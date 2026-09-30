# 割り勘ノート

会計を人数で分ける簡易計算と、参加者間の立替精算を行うアプリです。

- GitHub Pages: 画面を静的配信します（`gh-pages-src/`）。
- Sites + D1: グループと支払いを保存するAPIを提供します（`app/api/`）。
- グループURLを知る人は、そのグループの支払いを閲覧・編集できます。

## 開発

Node.js 24 で `npm ci` を実行してください。

- Pages画面: `node node_modules/vite/bin/vite.js build --config vite.config.pages.ts`
- APIを含むサイト: `node scripts/run-framework.mjs build`
- 型チェック: `node node_modules/typescript/bin/tsc --noEmit`

`main` への push で `.github/workflows/pages.yml` がGitHub Pagesを更新します。Pages画面は公開済みSites APIを呼び出します。API側は `https://sakibou5922.github.io` からのブラウザアクセスを許可します。
