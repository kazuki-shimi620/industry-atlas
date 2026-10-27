# INDUSTRY ATLAS — Notion企業DBから四季報風の業界地図

React + Vite + GitHub Pages。Notion企業DBは編集元として保持し、GitHub Actionsが毎日1回JSONへ同期して静的配信します。閲覧時のNotion API呼び出しはありません。

## 設定
1. GitHubで**新しい公開リポジトリ**（例 `industry-atlas`）を作成し、このフォルダの中身をmainへアップロード。
2. Notionの **My integrations** でInternal Integrationを作成し、企業・グループDBと企業ブランドDBの両方をそのIntegrationへ共有（閲覧権限）。
3. GitHubリポジトリの Settings → Secrets and variables → Actions に設定:
   - Secret `NOTION_TOKEN`: Integration secret（絶対にソースへコミットしない）
   - Variable `NOTION_COMPANIES_DB_ID`: `dad0713ed692450abce0f3fc71640179`
   - Variable `NOTION_BRANDS_DB_ID`: `b6f92467dbbc4a17a734373c2ffe4797`
4. Settings → Pages → Build and deployment → Source: **GitHub Actions**。
5. Actions → `Sync Notion and deploy` → Run workflow。日次同期はNOTION_TOKEN設定後にscheduleを有効化してください。

## ローカル
`npm install && npm run dev`。Notion同期は環境変数 `NOTION_TOKEN`, `NOTION_BRANDS_DB_ID` を設定して `npm run sync`。

## 表示仕様
- 「地図業界」に含まれる業界を表示
- 「地図表示=主要表示」を初期表示
- 「地図上の親グループ」をたどって傘下企業を展開
- ブランドの「企業グループ」「運営企業」を参照
- 小規模企業はデータを消さず初期表示のみ省略
- 図の面積・配置は市場シェアを表しません。地図上の親グループも法的支配関係を保証しません。

## 注意
- **公開GitHub Pagesは企業名・ブランド名を公開します**。公開可能な情報のみ同期してください。非公開の企業メモ・内部情報は同期しません。
- 2022-06-28版Notion APIを使っています。NotionでDBが複数データソース構成に変わった場合はAPI対応を更新してください。
- NotionのIntegrationトークンをGitHub Actions以外に置かないでください。

## 引き継ぎ時点の実装と検証

2026-10-27取得のNotionスナップショット（企業407件・ブランド251件）を収録。初回はトークンなしでもこのスナップショットを公開できます。日次同期には別途NOTION_TOKENの設定が必要です。接続済みChatGPT Notion連携の資格情報はGitHub Actionsへ引き継がれません。

- 業界16種、主要表示109件。重複する上位・下位グループをまとめて表示。
- 業界タグのない登録済み傘下企業も、親グループ経由で表示。
- 中間グループから再帰的に展開。子会社・ブランド名による検索。
- 関連企業は親子関係と分けて表示。
- `npm run check`で循環、親の欠落、ブランド参照、傘下企業の検索を検証。
- 元DBの空欄・未整理・省略候補は主要表示に昇格させません。飲食の主要表示は現在ゼンショー1件、ドラッグストアは2件です。増やすにはNotion側で地図業界・地図表示を編集してください。
- dist/ は動作確認済みビルド。GitHub PagesではActionsがリポジトリ名に応じて再ビルドします。
- 公開リポジトリ: https://github.com/kazuki-shimi620/industry-atlas

Notion自動同期はAPIトークン設定待ちです。設定完了後、workflowに日次scheduleを追加してください（日本時間03:20: cron `20 18 * * *`）。
