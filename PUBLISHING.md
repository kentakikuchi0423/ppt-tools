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

開発時の `https://localhost:3000` は本番では使えません。HTTPS の公開ホストが必要です。

本リポジトリには **GitHub Pages へのデプロイ workflow** が同梱されています（[`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml)）。

**初回セットアップ（GitHub 上で 1 回だけ）**:

1. リポジトリ → **Settings** → **Pages** → **Source** を **GitHub Actions** に切り替え。
2. リポジトリ → **Actions** タブ → 左メニューから **Deploy to GitHub Pages** → **Run workflow** ボタン。
3. 完了するとアドインが `https://kentakikuchi0423.github.io/ppt-tools/` から配信される。

以降は **Run workflow** をクリックするだけで再デプロイ。

代替ホスティング候補：

- Cloudflare Pages（無料、独自ドメイン可）
- Azure Static Web Apps（無料枠あり、Microsoft 純正）
- Vercel / Netlify

GitHub Pages 以外を使う場合は、後述の `npm run manifest:prod` を `MANIFEST_HOST=...` 付きで実行してデプロイ先 URL に差し替えたマニフェストを生成してください。

### 3. 本番用マニフェスト

開発用 `manifest.xml`（localhost を指す）と別に、本番用マニフェストを生成します。差分は URL のホスト名と `<Id>` GUID（dev/prod を別アドインとして PowerPoint に登録するため）。

`scripts/build-manifest.mjs`（`npm run manifest:prod` で実行）が自動でこの差分を当てます：

```bash
# デフォルト（GitHub Pages 向け、リポジトリに pre-allocated された prod GUID）
npm run manifest:prod
# → dist/manifest.xml を生成

# 本番ホスト・GUID・バージョンを差し替えたい場合は環境変数で
MANIFEST_HOST=https://example.com/path \
MANIFEST_GUID=00000000-0000-0000-0000-000000000000 \
MANIFEST_VERSION=1.2.3.0 \
npm run manifest:prod

# 生成 + バリデーション
npm run manifest:prod:validate
```

`MANIFEST_HOST` が `https://localhost:3000` だったり `MANIFEST_GUID` が dev GUID と同じだとスクリプトは exit 1 で停止します（誤って localhost を指す「本番」マニフェストを作るのを防ぐため）。

差分の内訳：

| 項目 | 開発 | 本番（既定） |
| --- | --- | --- |
| `SourceLocation`、`Commands.Url`、`Taskpane.Url`、`bt:Image`、`AppDomain` | `https://localhost:3000/...` | `https://kentakikuchi0423.github.io/ppt-tools/...` |
| `<Id>` GUID | `c3f24a1e-...` | `9f4e74b3-...` |
| `<Version>` | 任意 | 公開ごとに上げる（既定: `1.0.0.0`） |
| `SupportUrl` | 変更なし | 変更なし |

### 4. アセット

- [ ] **アイコン（本番品質）**: 現状の `scripts/generate-icons.mjs` で生成した PNG はプレースホルダ（青背景 + ASCII グリフ）。AppSource 提出前に**プロのデザイナー作の本番アイコン**に差し替え。要件は 16/32/64/80/96/128 px、PNG、透過背景推奨。
- [ ] **スクリーンショット**: AppSource 掲載用に 1366×768 px の PNG を 1〜10 枚。実機の PowerPoint 上でリボン／タスクペイン／操作前後の図形配置を撮影。
- [ ] **アドイン説明文（短文・長文、日英）**: 下書きは [AppSource 提出用コピー（下書き）](#appsource-提出用コピー下書き) を参照。最終版を Partner Center に貼り付ける。

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

## AppSource 提出用コピー（下書き）

Partner Center の入力欄にそのまま貼り付ける想定の下書き。実際の提出時はリリース内容に合わせて調整してください。

### カテゴリ・属性（Partner Center の選択項目）

- **カテゴリ**: Productivity（生産性）
- **対応ホスト**: PowerPoint
- **対応プラットフォーム**: Windows desktop / Mac desktop / Office on the web
- **対応 Office バージョン**: Microsoft 365（サブスクリプション版）
- **言語**: 日本語（プライマリ）／英語（セカンダリ）

### 短文（日本語、〜100 文字）

> PowerPoint の図形を一発で整列・配置調整。下／上／左／右に詰める、高さ・幅を揃える、2 図形の位置入替の 7 操作を、リボンと QAT から 1 クリックで。

### 短文（英語、〜100 chars）

> One-click shape alignment for PowerPoint. Pack down/up/left/right, match height/width, swap positions — straight from the ribbon and QAT.

### 長文（日本語、〜4000 文字）

```
ppt-tools は、PowerPoint 上で「複数図形をピシッと整える」だけのために作られた、シンプルな Office アドインです。手作業でドラッグ＆ドロップしたり、書式コピー → サイズ手入力したりしていた作業を、選択 → 1 クリックに置き換えます。

# できること（7 操作）

- 下に詰める / 上に詰める / 左に詰める / 右に詰める
  選択中の図形を指定方向に寄せ、隣接する図形どうしの隙間をゼロにします。整列順序は元の座標順を維持します。
- 高さを揃える
  選択した複数の図形を、最後に選んだ図形（参照図形）の高さに合わせます。上端は固定。
- 幅を揃える
  同様に、参照図形の幅に合わせます。左端は固定。
- 位置を入れ替える
  選択した 2 つの図形の `left` / `top` を入れ替えます。サイズや書式は保持します。

すべての操作は PowerPoint 標準の Undo（Ctrl+Z）で 1 回取り消せます。

# 呼び出し方

- リボン: ホームタブの末尾に追加される「ppt-tools」グループから直接クリック。
- クイックアクセスツールバー (QAT): 各ボタンを右クリック →「クイック アクセス ツール バーに追加」で個別ピン留め。Menu 内の項目（高さを揃える／幅を揃える）も個別に登録できます。
- タスクペイン: 挿入 → 個人用アドイン → ppt-tools。図形操作 7 ボタンを縦並びで表示。

# 動作環境

- Microsoft 365 の PowerPoint（Windows / Mac / Web）。
- インターネット接続（Office.js を CDN から読み込みます）。
- 図形の選択数によって有効になる操作が変わります（例: 詰める = 2 つ以上、入れ替える = 2 つ、高さ・幅を揃える = 2 つ以上で最後の図形が参照）。

# プライバシー・セキュリティ

- 利用者の図形データ・スライド内容は外部に送信しません。
- 認証も不要、サーバー側のロギングもありません。すべての処理はクライアント側で完結します。
- 詳細はプライバシーポリシーをご覧ください: https://kentakikuchi0423.github.io/ppt-tools/PRIVACY.md

# ライセンス・サポート

- MIT License で配布しています。
- 不具合報告・機能要望は GitHub の Issue Tracker にお願いします。
  https://github.com/kentakikuchi0423/ppt-tools/issues
```

### 長文（英語、〜4000 chars）

```
ppt-tools is a focused PowerPoint add-in that turns shape-alignment chores into one click. Stop dragging shapes pixel-by-pixel or retyping sizes — select, click, done.

# What it does (7 operations)

- Pack down / up / left / right
  Pushes the selected shapes toward the chosen edge, removing every gap between adjacent shapes. Original ordering is preserved.
- Match height
  Resizes the selected shapes to match the height of the last-selected (reference) shape. Top edge is anchored.
- Match width
  Same idea, anchored on the left edge.
- Swap positions
  Swaps the `left` / `top` coordinates of two selected shapes. Sizes and formatting are preserved.

Every operation is a single Undo step (Ctrl+Z) in PowerPoint.

# Where to find it

- Ribbon: a "ppt-tools" group is added to the Home tab.
- Quick Access Toolbar: right-click any button (including individual menu items for Match height / Match width) and pin it.
- Task pane: Insert → My Add-ins → ppt-tools — the same 7 buttons in a vertical layout.

# Requirements

- PowerPoint on Microsoft 365 (Windows, Mac, or Web).
- Internet connection (Office.js is loaded from the Microsoft CDN).
- Some commands require a minimum number of selected shapes (e.g. Pack ≥ 2, Swap = 2, Match height/width ≥ 2 with the last selection acting as the reference).

# Privacy & security

- No shape data, slide content, or telemetry leaves your machine.
- No accounts, no server-side logging — everything runs in the add-in's WebView.
- Full policy: https://kentakikuchi0423.github.io/ppt-tools/PRIVACY.md

# License & support

- Distributed under the MIT License.
- Bug reports and feature requests: https://github.com/kentakikuchi0423/ppt-tools/issues
```

### 検索キーワード（AppSource search keywords）

`align`, `alignment`, `pack`, `distribute`, `arrange`, `shapes`, `swap`, `resize`, `match height`, `match width`, `整列`, `配置`, `詰める`, `揃える`, `入れ替える`, `図形`

### サポート URL（必須）

- リポジトリ: https://github.com/kentakikuchi0423/ppt-tools
- Issue Tracker（サポート窓口）: https://github.com/kentakikuchi0423/ppt-tools/issues
- プライバシーポリシー: https://kentakikuchi0423.github.io/ppt-tools/PRIVACY.md

## 次のアクションとして残っているもの

- [x] GitHub Pages デプロイワークフロー追加
- [x] 本番用マニフェスト生成スクリプト
- [x] AppSource 提出文章の下書き作成（[AppSource 提出用コピー（下書き）](#appsource-提出用コピー下書き)）
- [ ] 本番品質のアイコン作成（デザイナー作業）
- [ ] スクリーンショット撮影（実機の PowerPoint で）
- [ ] Partner Center アカウント開設
- [ ] GitHub Pages の有効化（Settings → Pages → Source: GitHub Actions）+ 初回デプロイ実行

これらはこのドキュメント末尾のチェックリストとして管理してください。
