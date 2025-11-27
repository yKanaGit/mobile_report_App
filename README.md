mobile_report_App

## 開発環境での API 連携

開発サーバーで `response.json()` が `index.html` を返してしまう場合は、フロントの `/api` リクエストがバックエンドへ到達していません。以下を設定してください。

### 1. バックエンドの URL を指定する

`.env`（または `.env.local`）にバックエンドのオリジンを設定します。

```bash
VITE_API_BASE_URL="http://localhost:8000"
```

### 2. Vite のプロキシを有効化する

開発サーバーが `/api` をバックエンドへ転送できるよう、同じ `.env` に以下を追加します。

```bash
VITE_API_PROXY_TARGET="http://localhost:8000"
```

`npm run dev` 実行時に `/api` へのリクエストが指定先にプロキシされ、HTML ではなく JSON が返るようになります。
