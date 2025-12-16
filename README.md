# モバイルレポートアプリの設定メモ

このプロジェクトで推論に利用するモデル名や接続先を変更する手順をまとめています。

## 推論モデルの切り替え
- バックエンドの `/api/analyze-image` ハンドラーが組み立てるペイロード内で `model` フィールドを設定しています。
- ファイル: `server/server.js` のペイロード定義（`payload` オブジェクト）。デフォルトでは `model: "qwen3-vl-30b-a3b-instruct-fp8"` がハードコードされています。
- 別のモデルを使いたい場合は、この `model` の値を希望するモデル名に置き換えてください。

## モデルエンドポイントの変更
- 推論先エンドポイントのベースURLは環境変数 `MODEL_URL` で指定します。
- `.env` などで `MODEL_URL` を変更すると、リクエスト先のホストを切り替えられます。（OpenShift側でURLを設定しています）
- 環境変数が未設定の場合はサーバー起動時に警告が表示されるので、必要に応じて設定してください。

## Open WebUI 連携用環境変数の設定

`mobile-report-app` は、画像解析レポート（Markdown）を Open WebUI の Knowledge Base に自動登録するために、以下の環境変数を使用します。

- 必須環境変数
  - `OPENWEBUI_URL`  
    - Open WebUI のベース URL  
    - 例（Route 利用時）: `https://open-webui-user1.apps.<cluster-domain>`  
    - 末尾に `/` を付けないこと（アプリ側で `/api/v1/...` を連結します）
  - `OPENWEBUI_API_KEY`  
    - Open WebUI のユーザー API Key
  - `OPENWEBUI_KB_ID`  
    - Open WebUI の Knowledge Base ID（UUID 形式）

---

### OPENWEBUI_API_KEY の確認方法

- Open WebUI の Web UI にログインする
- 管理者パネル＞一般＞認証＞Enable API Keysを有効にする
- 画面右上のユーザーアイコン（またはユーザー名）をクリックする
- 以下のメニューから API Key を確認・発行する
  - 「Settings」→「API Keys」
- 表示されている API Key（トークン文字列）をコピーし、`OPENWEBUI_API_KEY` に設定する
  - OpenShift では、次のような Secret に格納して参照することを推奨:

    ```yaml
    apiVersion: v1
    kind: Secret
    metadata:
      name: openwebui-api-key
      namespace: mobile-report-app
    type: Opaque
    stringData:
      token: "<Open WebUI の API Key>"
    ```

---

### OPENWEBUI_KB_ID の確認方法

- Open WebUI の Web UI にログインする
- 上部メニューから「Knowledge」または「Knowledge Base」画面を開く
- 対象の Knowledge Base をクリックして詳細画面を開く
- 次のいずれかの場所から ID を確認する
  - ブラウザのアドレスバー（URL）中の ID パラメータ  
    - 例: `https://open-webui-.../knowledge/<KB_ID>` の `<KB_ID>` 部分
  - Knowledge Base の「Settings」タブ内に表示される ID（UUID 形式）
- 取得した ID をそのまま `OPENWEBUI_KB_ID` に設定する  
  - 例: `5fb96075-d388-4a85-ae04-410614d11c9b`

---
