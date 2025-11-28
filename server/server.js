import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer();

// OpenShift のモデルURL（後で Route URL を入れる）
const MODEL_URL = process.env.MODEL_URL;

if (!MODEL_URL) {
  console.log("WARNING: MODEL_URL is not set. Set it via environment variables.");
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
      model: "qwen3-vl-30b-a3b-thinking-fp8",
     // temperature: 0.2,
     // max_tokens: 512,
      messages: [
        {
          role: "system",
          content:
            "必ず日本語のみで回答し、事実と考察を指定フォーマットで箇条書きにします。不明な点は必ず『不明』と書き、画像にない情報は含めません。",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                "次の画像を分析し、以下の出力形式で回答してください。",
                "1) 事実: 画像から直接確認できる内容（箇条書き・最大5項目）。英語/中国語があれば日本語訳も含める。",
                "2) 考察: 事実を根拠に推測される内容（箇条書き・最大3項目）。",
                "不明な点は『不明』と記載し、画像にない情報は書かないでください。",
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

    const content =
      result?.choices?.[0]?.message?.content ??
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

// === フロントアプリを提供 ===
app.use(express.static(path.join(__dirname, "../dist")));

app.get("*", (_, res) => {
  res.sendFile(path.resolve(__dirname, "../dist/index.html"));
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Backend + Frontend server running on port ${port}`));
