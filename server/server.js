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
    const response = await fetch(`${MODEL_URL}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "qwen3-vl-30b-a3b-thinking-fp8",
        messages: [
          { role: "user", content: "Extract information from the uploaded image." }
        ]
      }),
    });

    const result = await response.json();
    console.log("Model response:", result);

    // ここでフロント用にシンプルな JSON に詰め替える
    const content =
      result?.choices?.[0]?.message?.content ??
      "(モデルから content が返ってきませんでした)";

    res.json({
      ok: true,
      content,      // フロント側で使いやすいテキスト
      raw: result,  // 元レスポンス（必要ならデバッグ用に保持）
    });
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ ok: false, error: "LLM request failed", detail: err.message });
  }
});

// === フロントアプリを提供 ===
app.use(express.static(path.join(__dirname, "../dist")));

app.get("*", (_, res) => {
  res.sendFile(path.resolve(__dirname, "../dist/index.html"));
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Backend + Frontend server running on port ${port}`));
