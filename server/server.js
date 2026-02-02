import express from "express";
import multer from "multer";
import fetch, { Blob, FormData } from "node-fetch";
import path from "path";
import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import { createHash, randomUUID } from "crypto";

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

const FRONT_MATTER_REGEX = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/;
const RAW_SECTION_REGEX = /\r?\n## 生データ \(raw\)[\s\S]*$/;
const KB_ADD_INFLIGHT = new Map();
const KB_ADD_RETRYABLE_PATTERN = /EMPTY_CONTENT|The content provided is empty/i;
const KB_ADD_RETRY_BASE_DELAYS_MS = [300, 1200];

const stripFrontMatter = (markdown) => markdown.replace(FRONT_MATTER_REGEX, "");
const stripRawSection = (markdown) => markdown.replace(RAW_SECTION_REGEX, "");

const buildSendMarkdown = ({ markdown, stripFrontMatterEnabled }) => {
  const normalizedMarkdown = stripFrontMatterEnabled
    ? stripFrontMatter(markdown)
    : markdown;
  const sanitizedMarkdown = stripRawSection(normalizedMarkdown);
  const body = sanitizedMarkdown.replace(/^\s+/, "");
  return `本文:\n\n${body}`;
};

const logSendMarkdownMeta = ({
  traceId,
  markdown,
  frontMatterRemoved,
  debugMinimal,
}) => {
  const mdSendSizeBytes = Buffer.byteLength(markdown, "utf8");
  const mdSendSha256 = createHash("sha256").update(markdown).digest("hex");
  const mdSendHead = markdown.slice(0, 200);

  console.log(
    "OpenWebUI send markdown meta:",
    JSON.stringify(
      {
        trace_id: traceId,
        md_send_size_bytes: mdSendSizeBytes,
        md_send_sha256: mdSendSha256,
        md_send_head: mdSendHead,
        front_matter_removed: frontMatterRemoved,
        debug_minimal: debugMinimal,
      },
      null,
      2
    )
  );
};

const jitterDelayMs = (baseMs) =>
  Math.round(baseMs * (0.7 + Math.random() * 0.6));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const logKbAddAttempt = ({
  traceId,
  kbId,
  fileId,
  attempt,
  status,
  responsePreview,
  nextWaitMs,
}) => {
  const payload = {
    trace_id: traceId,
    kb_id: kbId,
    file_id: fileId,
    attempt,
    status_code: status,
    response_preview: responsePreview,
  };

  if (typeof nextWaitMs === "number") {
    payload.next_wait_ms = nextWaitMs;
  }

  console.log("OpenWebUI kb add attempt:", JSON.stringify(payload, null, 2));
};

async function addFileToKbWithRetry({
  openWebUiUrl,
  kbId,
  fileId,
  token,
  traceId,
}) {
  const lockKey = `${kbId}:${fileId}`;
  const existingPromise = KB_ADD_INFLIGHT.get(lockKey);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = (async () => {
    for (let attempt = 0; attempt <= 2; attempt += 1) {
      const response = await fetch(
        `${openWebUiUrl}/api/v1/knowledge/${kbId}/file/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ file_id: fileId }),
        }
      );

      const responseText = await response.text();
      const responsePreview = responseText.slice(0, 200);
      const isRetryable =
        response.status === 400 &&
        KB_ADD_RETRYABLE_PATTERN.test(responseText);

      if (response.ok) {
        logKbAddAttempt({
          traceId,
          kbId,
          fileId,
          attempt,
          status: response.status,
          responsePreview,
        });
        return true;
      }

      const nextDelayBase =
        attempt < 2 && isRetryable
          ? KB_ADD_RETRY_BASE_DELAYS_MS[attempt]
          : undefined;
      const nextWaitMs =
        typeof nextDelayBase === "number"
          ? jitterDelayMs(nextDelayBase)
          : undefined;

      logKbAddAttempt({
        traceId,
        kbId,
        fileId,
        attempt,
        status: response.status,
        responsePreview,
        nextWaitMs,
      });

      if (!isRetryable || attempt >= 2) {
        throw new Error(
          `Failed to add file to OpenWebUI knowledge base: ${response.status} ${responsePreview}`
        );
      }

      await sleep(nextWaitMs);
    }

    return false;
  })();

  KB_ADD_INFLIGHT.set(lockKey, promise);
  try {
    return await promise;
  } finally {
    KB_ADD_INFLIGHT.delete(lockKey);
  }
}

async function uploadMarkdownToOpenWebUI(filename, markdown, options = {}) {
  const OPENWEBUI_URL = process.env.OPENWEBUI_URL;
  const OPENWEBUI_API_KEY = process.env.OPENWEBUI_API_KEY;
  const OPENWEBUI_KB_ID = process.env.OPENWEBUI_KB_ID;

  if (!OPENWEBUI_URL || !OPENWEBUI_API_KEY || !OPENWEBUI_KB_ID) {
    console.warn("OpenWebUI settings missing. Skipping KB upload.");
    return null;
  }

  try {
    const {
      traceId: providedTraceId,
      debugMinimal = false,
      stripFrontMatterEnabled = true,
    } = options;
    const traceId = providedTraceId || randomUUID();
    const markdownToSend = debugMinimal
      ? "# test\nhello world"
      : buildSendMarkdown({
          markdown,
          stripFrontMatterEnabled,
        });

    logSendMarkdownMeta({
      traceId,
      markdown: markdownToSend,
      frontMatterRemoved: stripFrontMatterEnabled && !debugMinimal,
      debugMinimal,
    });

    const formData = new FormData();
    const blob = new Blob([markdownToSend], { type: "text/markdown" });
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

    const added = await addFileToKbWithRetry({
      openWebUiUrl: OPENWEBUI_URL,
      kbId: OPENWEBUI_KB_ID,
      fileId,
      token: OPENWEBUI_API_KEY,
      traceId,
    });

    if (!added) {
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
            "あなたは事件事故現場の捜査官です。必ず日本語のみで回答し、事実を指定フォーマットで箇条書きにします。",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                "画像を解析して、レポートとして回答してください。",
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
  const { content, memo, raw, openwebui_debug_minimal: openWebUiDebugMinimal } =
    req.body ?? {};
  const normalizedContent =
    typeof content === "string" ? content.replace(/\s+/g, "").trim() : "";
  const emptyContentMessages = [
    "(モデルから content が返ってきませんでした)",
  ];
  const isContentEmpty =
    typeof content !== "string" ||
    content.trim() === "" ||
    normalizedContent.length === 0 ||
    emptyContentMessages.includes(content.trim());

  if (isContentEmpty) {
    return res
      .status(400)
      .json({ ok: false, error: "content is empty or invalid" });
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
  const openwebuiFileId = await uploadMarkdownToOpenWebUI(filename, markdown, {
    traceId: uuid,
    debugMinimal: Boolean(openWebUiDebugMinimal),
    stripFrontMatterEnabled: false,
  });

  res.json({
    ok: true,
    uuid,
    caseCode,
    filePath,
    openwebuiFileId,
    openwebuiDebugMinimal: Boolean(openWebUiDebugMinimal),
  });
});

// === フロントアプリを提供 ===
app.use(express.static(path.join(__dirname, "../dist")));

app.get("*", (_, res) => {
  res.sendFile(path.resolve(__dirname, "../dist/index.html"));
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Backend + Frontend server running on port ${port}`));
