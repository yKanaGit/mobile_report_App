import express from "express";
import multer from "multer";
import fetch, { Blob, FormData } from "node-fetch";
import path from "path";
import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPORT_DIR = process.env.REPORT_DIR || "/data/reports";

const app = express();
const upload = multer();

app.use(express.json());

// OpenShift のモデルURL（後で Route URL を入れる）
const MODEL_URL = process.env.MODEL_URL;
// NOTE: OPENWEBUI_URL / OPENWEBUI_API_KEY / OPENWEBUI_KB_ID の実際の値は、Open WebUI を OpenShift 上にデプロイしてから Deployment の env で設定します。

if (!MODEL_URL) {
  console.log("WARNING: MODEL_URL is not set. Set it via environment variables.");
}

async function uploadMarkdownToOpenWebUI(filename, markdown) {
  const OPENWEBUI_URL = process.env.OPENWEBUI_URL;
  const OPENWEBUI_API_KEY = process.env.OPENWEBUI_API_KEY;
  const OPENWEBUI_KB_ID = process.env.OPENWEBUI_KB_ID;

  if (!OPENWEBUI_URL || !OPENWEBUI_API_KEY || !OPENWEBUI_KB_ID) {
    console.warn("OpenWebUI settings missing. Skipping KB upload.");
    return null;
  }

  try {
    const formData = new FormData();
    const blob = new Blob([markdown], { type: "text/markdown" });
    formData.append("file", blob, filename);

    const uploadResponse = await fetch(`${OPENWEBUI_URL}/api/v1/files/`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENWEBUI_API_KEY}`,
      },
      body: formData,
    });

    const uploadJson = await uploadResponse.json();
    console.log(
      "OpenWebUI /api/v1/files/ response:",
      JSON.stringify(uploadJson, null, 2)
    );

    const fileId =
      uploadJson.file_id ||
      uploadJson.id ||
      (uploadJson.data && uploadJson.data.file_id) ||
      (uploadJson.data && uploadJson.data.id) ||
      (uploadJson.file && uploadJson.file.id) ||
      (Array.isArray(uploadJson.files) &&
        uploadJson.files[0] &&
        (uploadJson.files[0].file_id || uploadJson.files[0].id));

    if (!fileId) {
      console.error(
        "Failed to obtain file_id from OpenWebUI upload response. uploadJson =",
        uploadJson
      );
      return null;
    }

    const kbResponse = await fetch(
      `${OPENWEBUI_URL}/api/v1/knowledge/${OPENWEBUI_KB_ID}/file/add`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENWEBUI_API_KEY}`,
        },
        body: JSON.stringify({ file_id: fileId }),
      }
    );

    if (!kbResponse.ok) {
      const kbErrorText = await kbResponse.text();
      console.error(
        `Failed to add file to OpenWebUI knowledge base: ${kbResponse.status} ${kbErrorText}`
      );
      return null;
    }

    return fileId;
  } catch (error) {
    console.error("Failed to upload markdown to OpenWebUI:", error);
    return null;
  }
}

// === API ===
app.post("/api/analyze-image", upload.single("image"), async (req, res) => {
  console.log("*** analyze-image API called ***");

  try {
    // 画像ファイル取得
    const imageBuffer = req.file?.buffer;
    if (!imageBuffer) {
      return res.status(400).json({
        ok: false,
        error: "No image uploaded",
      });
    }

    // base64 へ変換
    const base64Image = imageBuffer.toString("base64");

    // Qwen3-VL のマルチモーダル用ペイロード（日本語固定・出力形式指定・長文抑制）
    const payload = {
      model: "qwen3-vl-30b-a3b-instruct-fp8",
     // temperature: 0.2,
      max_tokens: 3276,
      messages: [
        {
          role: "system",
          content:
            "必ず日本語のみで回答し、事実を指定フォーマットで箇条書きにします。",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                "画像を解析して、レポートとして回答してください。",
                "事件性・事故性の判断を行ってください。",
                "画像内に日本語以外の文章がある場合、原文と日本語訳をレポートの下部にまとめてください。",
              ].join("\n"),
            },
            {
              type: "image_url",
              image_url: {
                // data URL 形式で画像を渡す
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
    };

    const response = await fetch(`${MODEL_URL}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log("Model response:", result);

    const message = result?.choices?.[0]?.message;

    const normalizeContent = (value) => {
      if (typeof value === "string") {
        return value.trim();
      }

      if (Array.isArray(value)) {
        return value
          .map((part) => {
            if (typeof part === "string") return part;
            if (part?.text) return part.text;
            return "";
          })
          .filter(Boolean)
          .join("\n")
          .trim();
      }

      return "";
    };

    const content =
      normalizeContent(message?.content) ||
      normalizeContent(message?.reasoning_content) ||
      "(モデルから content が返ってきませんでした)";

    res.json({
      ok: true,
      content,
      raw: result,
    });
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({
      ok: false,
      error: "LLM request failed",
      detail: err.message,
    });
  }
});

app.post("/api/submit-report", async (req, res) => {
  const { content, memo, raw } = req.body ?? {};

  if (typeof content !== "string" || content.trim() === "") {
    return res.status(400).json({ ok: false, error: "content is required" });
  }

  const uuid = randomUUID();
  const caseCode = uuid.replace(/-/g, "").slice(0, 8).toUpperCase();

  const now = new Date();
  const isoString = now.toISOString();
  const dateString = isoString.split("T")[0];

  const indentMemo = (text) =>
    text
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n");

  const memoBlock =
    typeof memo === "string" && memo.trim() !== ""
      ? [`memo: |-`, indentMemo(memo)].join("\n")
      : "";

  const rawString = JSON.stringify(raw ?? {}, null, 2);

  const markdownParts = [
    "---",
    `id: ${uuid}`,
    `case_code: ${caseCode}`,
    `created_at: ${isoString}`,
    "source: mobile_report_app",
  ];

  if (memoBlock) {
    markdownParts.push(memoBlock);
  }

  markdownParts.push(
    "---",
    "",
    `# モバイルレポート (${caseCode})`,
    "",
    `このレポートの案件IDは **${caseCode}** です。`,
    "",
    "## モデル解析結果",
    "",
    content,
    "",
    "## 生データ (raw)",
    "",
    "```json",
    rawString,
    "```"
  );

  const markdown = markdownParts.join("\n");

  console.log(markdown);

  const dirPath = path.join(REPORT_DIR, dateString);
  const filePath = path.join(dirPath, `${uuid}.md`);

  try {
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, markdown, "utf-8");
  } catch (err) {
    console.error("Failed to save report:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to save report",
      detail: err.message,
    });
  }

  const filename = `${dateString}-${caseCode}.md`;
  const openwebuiFileId = await uploadMarkdownToOpenWebUI(filename, markdown);

  res.json({
    ok: true,
    uuid,
    caseCode,
    filePath,
    openwebuiFileId,
  });
});

// === フロントアプリを提供 ===
app.use(express.static(path.join(__dirname, "../dist")));

app.get("*", (_, res) => {
  res.sendFile(path.resolve(__dirname, "../dist/index.html"));
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Backend + Frontend server running on port ${port}`));
