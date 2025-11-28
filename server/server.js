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

    // Qwen3-VL のマルチモーダル用ペイロード
    const payload = {
      model: "qwen3-vl-30b-a3b-thinking-fp8",
      messages: [
        {
          role: "system",
          content:
            "あなたは日本語のみで回答するアシスタントです。出力は簡潔な日本語で行い、他の言語を混在させないでください。",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: [
                "添付画像の内容を詳細に観察し、レポート用の文章を日本語で作成してください。",
                "事実に基づく説明と考察を明確に分け、以下のフォーマットで出力します。",
                "1) 事実: 画像から確認できる情報のみを箇条書きで詳しく記述してください（位置・色・数・状態など具体的に）。",
                "2) 考察: 事実を根拠に推測される状況やリスク、確認すべき点を箇条書きで述べてください。根拠も併記してください。",
                "画像内に英語または中国語の文章がある場合は、日本語訳を併記し、何が書かれているかを事実の項目に含めてください。",
                "不明な点は推測せず「不明」と記載し、画像にない情報は含めないでください。",
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
