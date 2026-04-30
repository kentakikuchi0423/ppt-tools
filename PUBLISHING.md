# 公開（配布）ガイド

ppt-tools をエンドユーザーに届ける方法は 3 通りあります。

| 方法 | 対象ユーザー | インストール体験 | 必要な準備 |
| --- | --- | --- | --- |
| **A. AppSource（Microsoft の公式ストア）** | 一般公開 | PowerPoint 内「アドインの取得」から検索 → 1 クリックで追加 | 公開審査（数日〜2 週間）、本ガイドのチェックリストを満たす |
| **B. Microsoft 365 管理者によるテナント配布** | 自分の組織内ユーザー全員 | 管理者がプッシュインストール、ユーザー側操作不要 | テナント管理者権限、Centralized Deployment 利用 |
| **C. 信頼できる共有フォルダカタログ** | チーム内（少人数） | ユーザーがフォルダを Trust Center に登録 → 1 度だけ手動追加 | 共有ネットワークフォルダ、各ユーザー側で 1 回設定 |

A が一般公開向けの本道、B が社内利用向けの本道、C は B のライト版です。以下では A（AppSource）を基準に説明します。B/C は本ガイドの「本番ホスティング」までを準備したうえで、Microsoft Learn の該当ガイドに沿って実施してください。

## AppSource 公開チェックリスト

### 1. 開発者アカウント

- [ ] [Microsoft Partner Center](https://partner.microsoft.com/) で開発者アカウント登録（個人または法人）。
- [ ] Microsoft 365 & Copilot ワークロードに登録。
- [ ] 個人開発者の場合、登録料は無料。法人は米国 \$99/年 程度。

### 2. 本番ホスティング

開発時の `https://localhost:3000` は本番では使えません。HTTPS の公開ホストが必要です。本リポジトリでは GitHub Pages を使った無料ホスティング設定を `.github/workflows/deploy-pages.yml` に用意しています（後続タスクで追加予定）。

代替候補：

- GitHub Pages（無料、リポジトリ単位）
- Cloudflare Pages（無料、独自ドメイン可）
- Azure Static Web Apps（無料枠あり、Microsoft 純正）
- Vercel / Netlify

ホスティング先 URL（例：`https://kentakikuchi0423.github.io/ppt-tools/`）が確定したら、本番用マニフェストを作成します。

### 3. 本番用マニフェスト

開発用 `manifest.xml`（localhost を指す）と別に、本番用マニフェストを生成します。差分は基本的に URL のホスト名のみ：

| 項目 | 開発 | 本番 |
| --- | --- | --- |
| `SourceLocation` (taskpane) | `https://localhost:3000/taskpane.html` | `https://<host>/taskpane.html` |
| `Commands.Url` | `https://localhost:3000/commands.html` | `https://<host>/commands.html` |
| `Taskpane.Url` | 同上 | 同上 |
| `bt:Image` 各エントリ | `https://localhost:3000/assets/...` | `https://<host>/assets/...` |
| `AppDomains > AppDomain` | `https://localhost:3000` | `https://<host>` |
| `<Id>` GUID | 開発用 | **本番用は別 GUID を発行**（dev/prod を別アドインとして登録するため） |
| `<Version>` | 任意 | 公開ごとに上げる |
| `SupportUrl` | リポジトリ URL | リポジトリ URL（同じ） |

### 4. アセット

- [ ] **アイコン（本番品質）**: 現状の `scripts/generate-icons.mjs` で生成した PNG はプレースホルダ（青背景 + ASCII グリフ）。AppSource 提出前に**プロのデザイナー作の本番アイコン**に差し替え。要件は 16/32/64/80/96/128 px、PNG、透過背景推奨。
- [ ] **スクリーンショット**: AppSource 掲載用に 1366×768 px の PNG を 1〜10 枚。実機の PowerPoint 上でリボン／タスクペイン／操作前後の図形配置を撮影。
- [ ] **アドイン説明文（短文・長文、日英）**:
  - 短文（〜100 文字）: 「PowerPoint で図形を一発整列・パッキングできるアドイン」
  - 長文（〜4000 文字）: 機能一覧、使い方、スクリーンショット説明など。`README.md` 冒頭をベースに調整。

### 5. 法務ドキュメント

- [x] **ライセンス**: `LICENSE`（MIT）。
- [x] **プライバシーポリシー**: `PRIVACY.md`（リポジトリ内 + GitHub Pages で公開し、AppSource 提出時に URL を提示）。
- [ ] **利用規約 (Terms of Use)**: 個人開発の OSS なら省略可だが、AppSource は推奨。MIT ライセンスで実質代替できる。

### 6. 機能の最終確認

- [ ] 7 オペレーション全部が PowerPoint Microsoft 365（Windows）で動作する。
- [ ] エラーポップアップが日本語で正しく表示される。
- [ ] PowerPoint の組み込み Undo（Ctrl+Z）が 1 回で全変更を取り消せる。
- [ ] グループ図形を含む選択でも操作が破綻しない。
- [ ] Mac PowerPoint・PowerPoint Online での動作確認（v1 範囲外だが任意）。

### 7. AppSource 提出

- [ ] Partner Center → 新しい提出 → Office アドイン。
- [ ] 本番マニフェスト XML をアップロード。
- [ ] 上記アセット・説明文・URL を入力。
- [ ] サポート対象ホスト（PowerPoint Desktop Windows / Mac / Online）と Office 365 SKU を選択。
- [ ] 審査開始 → 通常 5〜10 営業日で結果が出る。問題があれば指摘事項に従って修正・再提出。

審査ガイドラインの正本：[Microsoft 365 ストア検証ポリシー](https://learn.microsoft.com/legal/marketplace/certification-policies)

## 配布後の運用

- バグ修正・機能追加のたびに `<Version>` を上げて Partner Center に再提出。
- ユーザーは PowerPoint 起動時または「アドイン更新の確認」で自動更新を受け取る。

## 次のアクションとして残っているもの

- [ ] GitHub Pages デプロイワークフロー追加
- [ ] 本番用マニフェスト生成スクリプト
- [ ] 本番品質のアイコン作成（デザイナー作業）
- [ ] スクリーンショット撮影（実機の PowerPoint で）
- [ ] AppSource 提出文章の本文作成
- [ ] Partner Center アカウント開設

これらはこのドキュメント末尾のチェックリストとして管理してください。
