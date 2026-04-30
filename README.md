# ppt-tools

PowerPoint Office アドイン（VBA ではなく Office.js）。図形操作のためのツールを提供します：

- 選択図形を下／上／左／右に詰める（指定方向にパイルを集約し、隣接する図形の隙間をゼロにする）
- 選択図形の高さ・幅を参照図形に揃える
- 2 つの図形の位置を入れ替える（`left` / `top` のみ。サイズは保持）

呼び出し面は 2 つあります：

- **タスクペイン**（PowerPoint 右側の作業ウィンドウ） — 操作ボタン 7 個。**挿入** タブ → **個人用アドイン** → **ppt-tools** で開きます。
- **ホームタブのリボン** — `ppt-tools` グループに 6 control（4 方向「詰める」+ 高さ/幅 Menu + 位置を入れ替える）。各 control は **クイック アクセス ツール バー（QAT）** に個別ピン留め可能（Menu 内の Item も登録可）。

座標計算ロジックは `src/core/` に純粋関数として実装し、Office.js に依存しません。Vitest で完全にユニットテスト可能です。Office.js に依存するアダプタコードは `src/office/` に分離されています。

## ✋ どちらの読み手ですか？

| やりたいこと | 読むドキュメント |
| --- | --- |
| 🔧 PowerPoint で **使うだけ** | 👉 **[`INSTALL.md`](./INSTALL.md)** に進んでください（Node.js などのインストール不要、5 分で完了） |
| 💻 コードを読む・改造する・PR を出す | この README をそのまま下に読み進めてください |

このリポジトリは GitHub 上で公開されており、リンクを知っている方なら誰でも自由に利用・改変・配布できます（[MIT License](./LICENSE)）。

実装の進行状況は [`TASKS.md`](./TASKS.md)、機能・非機能要件は [`REQUIREMENTS.md`](./REQUIREMENTS.md) にあります。

## クイックスタート（開発者向け・Windows）

ソースから動かして動作確認・改造したい開発者向けの手順です。**単に PowerPoint で使いたいだけの方は [`INSTALL.md`](./INSTALL.md) に進んでください**（こちらは不要）。

以下の手順だけで OK です：

1. **Node.js 22 以上**をインストール（[nodejs.org](https://nodejs.org/) から LTS 版）。
2. このリポジトリを Windows のフォルダに clone（例：`C:\Users\<あなた>\Documents\dev\ppt-tools`）。
3. リポジトリ直下の **`start.cmd` をダブルクリック**。

`start.cmd` が自動で：

1. Node.js のバージョン確認
2. `npm install`（初回のみ。数分かかる）
3. 開発用証明書のインストール（初回のみ。**UAC ダイアログが出たら「はい」**）
4. dev サーバ起動 + アドインのサイドロード + PowerPoint 起動

PowerPoint が開いたら：

- リボンの **ホーム** タブ右端に追加された **ppt-tools** グループから操作ボタンを直接クリック、または
- 右側のタスクペイン（作業ウィンドウ）を開く: **挿入** タブ → **個人用アドイン** → **ppt-tools**（タスクペイン上部の📌ピン留めボタンで常駐化できます）

終了するときは `start.cmd` のウィンドウを閉じる、または別の PowerShell で `npm run stop:debug`。

タスクペインやリボンが古い表示のまま動かない・キャッシュが疑わしい場合は、代わりに **`reload.cmd`** をダブルクリック。Office プロセスの強制終了 + アドインキャッシュ全削除 + 再起動を一括で行います。

## 必要環境

- **Node.js 22 以上**（`engines` フィールド）。
- **Windows + PowerPoint（Microsoft 365）**：アドインの実機検証用。
- **VS Code + Dev Containers 拡張**（オプション）：Linux 側でコード品質チェック（typecheck / lint / test / build）するときに便利。

## どこで何を実行するか

このプロジェクトには「コード品質チェック用」と「PowerPoint 実機検証用」の 2 系統の作業があり、それぞれ実行場所が違います。

| やりたいこと                        | コマンド                             | 実行場所                                                                                                                                                                 |
| ----------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 型検査・Lint・ユニットテスト        | `npm run validate`                   | **devcontainer / 任意**                                                                                                                                                  |
| 本番ビルド                          | `npm run build`                      | **devcontainer / 任意**                                                                                                                                                  |
| マニフェスト検証                    | `npm run manifest:validate`          | **devcontainer / 任意**                                                                                                                                                  |
| 開発用証明書のインストール          | `npx office-addin-dev-certs install` | **Windows ホスト**（PowerShell を管理者権限で）。Linux／WSL／devcontainer で実行しても PowerPoint からは信頼されません                                                   |
| 開発サーバ起動（PowerPoint 連携用） | `npm run dev`                        | **Windows ホスト**。dev-certs は実行ユーザーのホーム直下（`~/.office-addin-dev-certs/`）から読まれるため、証明書をインストールした OS と同じ環境で起動する必要があります |
| サイドロード                        | `npm run start:debug`                | **Windows ホスト**                                                                                                                                                       |

## devcontainer での開発（コード品質作業）

1. このフォルダを VS Code で開く。
2. プロンプトが出たら **「コンテナで再度開く」**（Reopen in Container）を選ぶ。コマンドパレットからは `Dev Containers: Reopen in Container`。
3. コンテナは `mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm` から構築されます。`postCreateCommand` で `npm ci || npm install` が走ります。
4. コンテナ起動後：
   ```bash
   npm run validate
   ```
   これで `typecheck` → `lint` → `test` が一括実行されます。

devcontainer 内では PowerPoint 連携の動作確認はできません（dev-certs を Windows 側に配置できないため）。サイドロード検証は次項の「Windows ホストでの開発」を使ってください。

## Windows ホストでの開発（PowerPoint 実機検証）

PowerPoint と連携させて動作確認するときは、Windows 側に Node 22 を入れて Windows のターミナルから操作します。devcontainer / WSL の Linux 側で `npm run dev` しても PowerPoint からは読み込めません。

```powershell
# 管理者権限の PowerShell（初回のみ）
nvm use 22
npm install
npx office-addin-dev-certs install   # UAC ダイアログで「はい」
```

```powershell
# 通常の PowerShell（毎回）
npm run start:debug
```

`npm run start:debug` は dev サーバ（`https://localhost:3000`）の起動 → アドインのサイドロード → PowerPoint の起動までを一括で行います。PowerPoint が立ち上がったらリボンの **ホーム** タブの **ppt-tools** グループから操作ボタンを直接クリック、またはタスクペイン（**挿入 → 個人用アドイン → ppt-tools**）を開いて使ってください。

終了するときは `npm run stop:debug`。

## npm スクリプト

| スクリプト                  | 内容                                                                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`               | Vite 開発サーバを `https://localhost:3000` で起動（dev-certs インストール時のみ HTTPS。未インストール時は HTTP にフォールバック） |
| `npm run build`             | `dist/` に `taskpane.html` / `commands.html` / `dialog.html` を含む本番ビルドを出力                                               |
| `npm run typecheck`         | `tsc --noEmit` を `src/` と `tests/` に対して実行                                                                                 |
| `npm run lint`              | ESLint をワークスペース全体に実行                                                                                                 |
| `npm run lint:fix`          | ESLint を `--fix` 付きで実行                                                                                                      |
| `npm run format`            | Prettier `--write` をワークスペース全体に実行                                                                                     |
| `npm run format:check`      | Prettier `--check`（CI 向け）                                                                                                     |
| `npm run test`              | Vitest シングル実行                                                                                                               |
| `npm run test:watch`        | Vitest ウォッチモード                                                                                                             |
| `npm run test:coverage`     | Vitest（v8 カバレッジ）                                                                                                           |
| `npm run validate`          | `typecheck` → `lint` → `test` を順に実行                                                                                          |
| `npm run icons`             | `manifest.xml` 用のプレースホルダ PNG（16/32/80）を `public/assets/` に再生成                                                     |
| `npm run manifest:validate` | `manifest.xml` を検証                                                                                                             |
| `npm run start:debug`       | Office アドインのデバッグセッション開始                                                                                           |
| `npm run stop:debug`        | デバッグセッション停止                                                                                                            |

## プロジェクト構成

```
.
├── .devcontainer/
│   └── devcontainer.json        # Node 22 イメージ + postCreateCommand
├── manifest.xml                 # PowerPoint アドインのマニフェスト（V1.0 fallback + V1.1 共有ランタイム）
├── start.cmd                    # Windows ワンクリック起動
├── reload.cmd                   # ワンクリック再起動（プロセス kill + キャッシュ削除 + start.cmd 相当）
├── taskpane.html                # タスクペイン HTML エントリ
├── commands.html                # FunctionFile HTML エントリ（V1.0 fallback 用）
├── dialog.html                  # リボン経由のエラー表示用ポップアップ
├── public/
│   └── assets/                  # manifest 参照のアイコン PNG（npm run icons で生成）
├── scripts/
│   ├── generate-icons.mjs       # 8 種類のアイコン PNG ジェネレータ
│   ├── setup-windows.ps1        # start.cmd の中身
│   └── reload-windows.ps1       # reload.cmd の中身
├── src/
│   ├── core/                    # 純粋ロジック。Office.js 非依存。Vitest 100% テスト。
│   │   ├── operations/          # pack / alignHeights / alignWidths / swap
│   │   ├── resolvers/           # LastSelectedResolver / StoredReferenceResolver
│   │   └── types.ts
│   ├── office/                  # Office.js アダプタ。PowerPoint.run / Office.context を呼ぶ唯一の層。
│   │   ├── actions.ts           # registerRibbonActions() — リボン commands の共通登録
│   │   ├── ribbon.ts            # Office.ribbon.requestUpdate のラッパ（grayout 連動）
│   │   └── selection.ts         # getSelectedShapes / applyShapes
│   ├── taskpane/                # タスクペイン UI（共有ランタイム経路でも使われる）
│   ├── commands/                # FunctionFile（V1.0 fallback 経路でリボンクリック時にロード）
│   └── dialog/                  # ポップアップダイアログのスクリプト
├── tests/                       # Vitest。src/core のみ import する。
├── eslint.config.js             # flat config + typescript-eslint strict-type-checked + prettier
├── tsconfig.json                # TS strict（+ noUncheckedIndexedAccess、exactOptionalPropertyTypes）
├── vite.config.ts
├── vitest.config.ts
├── package.json
├── CLAUDE.md                    # AI 支援セッション向けルール
├── REQUIREMENTS.md              # 機能要件・非機能要件
└── TASKS.md                     # 実装の進行順
```

## Windows PowerPoint への手動サイドロード

このリポジトリは Windows レジストリを変更しません。PowerPoint を自動起動しません。サイドロード自動化スクリプトも含みません。サイドロードは Windows ホスト上で**ユーザーが手動**で行います。

### 事前準備（Windows ホスト上で一度だけ）

1. 開発用証明書をインストールし、PowerPoint が `https://localhost:3000` を信頼できるようにします。**必ず Windows のターミナル（PowerShell を管理者権限で起動）で実行**してください — devcontainer / WSL の Linux 側で実行しても PowerPoint の証明書ストアには登録されず、UAC ダイアログも出ないので待っても完了しません：

   ```powershell
   npx office-addin-dev-certs install
   ```

   実行直後に出る UAC ダイアログで「はい」を選択。完了メッセージ（`You now have trusted access to https://localhost.`）が表示されれば成功です。自己署名 CA を生成して Windows の証明書ストアに登録します。生成される `*.pem` / `*.crt` ファイルは `.gitignore` 済みです。

2. Windows ホスト上に「共有フォルダカタログ」用のフォルダを作成します（例：`C:\OfficeAddins\ppt-tools`）。リポジトリ直下の `manifest.xml` をそのフォルダにコピーします。

3. **そのフォルダを Windows のファイル共有機能で共有** します（PowerPoint のトラスト センターは UNC パスしか受け付けず、ローカルの `C:\...` は弾かれます）：
   - フォルダを右クリック → プロパティ → 共有タブ → **「共有」** ボタン
   - 自分のユーザーに「読み取り/書き込み」権限を付与 → **「共有」** で完了
   - 表示される **ネットワーク パス**（例: `\\<コンピューター名>\<共有名>`）をコピー

4. PowerPoint で、その共有フォルダを「信頼できるアドインカタログ」として登録：
   - **ファイル → オプション → トラスト センター → トラスト センターの設定 → 信頼できるアドイン カタログ**
   - **「カタログ URL」** に手順 3 でコピーした **`\\` から始まる UNC パス** を貼り付け
   - **「カタログの追加」** → 表の **「メニューに表示する」** にチェック → **OK**
   - PowerPoint を再起動

   公式手順は [Microsoft Learn: Sideload Office Add-ins from a network share](https://learn.microsoft.com/en-us/office/dev/add-ins/testing/create-a-network-shared-folder-catalog-for-task-pane-and-content-add-ins) を参照。

### アドインの起動

1. devcontainer 内（あるいは Node 22 のホスト）で：

   ```bash
   npm run dev
   ```

   開発サーバは `https://localhost:3000` でタスクペイン（`/taskpane.html`）と FunctionFile（`/commands.html`）を配信します。dev-certs インストール済みなら HTTPS、未インストール時は HTTP（PowerPoint からは読み込めないので警告ログが出ます）。

2. PowerPoint 上で：
   - **挿入 → アドインの取得 → 共有フォルダー → ppt-tools → 追加**
   - リボンの **ホーム** タブに **ppt-tools** グループが追加され、6 control（4 方向「詰める」+ 高さ/幅 Menu + 位置を入れ替える）が並びます。
   - タスクペイン（作業ウィンドウ）を開きたい場合は **挿入 → 個人用アドイン → ppt-tools**。

### 開発ループ

タスクペインは Vite の HMR でリロードされます。PowerPoint がタスクペインを強くキャッシュすることがあるため、変更が反映されない場合はアドインペインを一度閉じて開き直す、または `reload.cmd` で全キャッシュを削除して再起動してください。

共有フォルダ経由のサイドロードに関する Microsoft 公式ドキュメントは Microsoft Learn を参照してください（検索キーワード: "Sideload Office Add-ins for testing from a network share"）。

## 配布する（GitHub Pages 経由のセルフホスト）

GitHub のリポジトリリンクを知っている人なら誰でも、**Microsoft の審査なし** でこのアドインを自分の PowerPoint にインストールできます。仕組みは「アドイン本体（HTML/JS）は GitHub Pages の HTTPS ホストから配信、マニフェスト XML は配布先 PC のローカルフォルダに置いてトラスト センターに登録」。図形操作はクライアント JS で完結するため、初回ロード以外はオフラインでも動作します。

### 配布先の人がやること

→ **[`INSTALL.md`](./INSTALL.md) を参照**（5 ステップ・約 5 分）。リポジトリリンクと一緒にこの URL を渡せば OK：

```
https://github.com/kentakikuchi0423/ppt-tools/blob/main/INSTALL.md
```

### 開発者（メンテナ）側 — 1 回だけ

1. **GitHub Pages を有効化**: GitHub のリポジトリ → **Settings → Pages → Source** を **GitHub Actions** に変更。
2. **デプロイを実行**: リポジトリ → **Actions** タブ → 左メニュー **Deploy to GitHub Pages** → **Run workflow**。完了するとアドインが `https://kentakikuchi0423.github.io/ppt-tools/` 配下から配信される（[`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml) が `npm run build` → `npm run manifest:prod` → Pages デプロイまで自動で実行）。
3. これで `https://kentakikuchi0423.github.io/ppt-tools/manifest.xml` が誰でもダウンロードできる状態になる。

機能を更新したら、**Run workflow** を再実行するだけ。配布先 PC は次回 PowerPoint 起動時に新本体を自動取得します（マニフェスト XML を差し替えない限り、配布先側の追加操作は不要）。

> 自前ドメインや別ホスト（Cloudflare Pages、Azure Static Web Apps など）を使いたい場合は `MANIFEST_HOST=https://example.com/path npm run manifest:prod` でホストを差し替えたマニフェストを生成できます。詳細は `scripts/build-manifest.mjs` の冒頭コメントを参照。

### 開発用と配布用の使い分け

| | dev サイドロード（前節） | 配布用（本節） |
| --- | --- | --- |
| 使うマニフェスト | リポジトリ直下の `manifest.xml` | `dist/manifest.xml`（`npm run manifest:prod` で生成） |
| ホスト | `https://localhost:3000`（`npm run dev` 必須） | `https://kentakikuchi0423.github.io/ppt-tools/`（GitHub Pages） |
| 必要な準備 | Node 22 + dev-certs インストール | 配布先は何も入れなくて良い（PowerPoint 内の WebView2 のみ） |
| `<Id>` GUID | dev 用 (`c3f24a1e-...`) | prod 用 (`9f4e74b3-...`) |

dev 用と prod 用は GUID が違うので PowerPoint からは別アドインとして認識されます。両方を同時に登録しても競合しません。

## 制約・注意

- このリポジトリは PowerPoint を自動操作しません。Windows レジストリも変更しません。`office-addin-debugging` を超えるサイドロード補助も含みません。
- 開発用証明書（`*.pem`、`*.crt`、`*.key`）は `.gitignore` 済み。コミット禁止。
- 秘密情報・API キーは含まれていません。アドインも外部サービスを呼びません。
- ランタイム `dependencies` ゼロ。Office.js はタスクペイン HTML から CDN で読み込みます。
- v1 ではグループ図形を不透明な単一図形として扱います（再帰展開しません）。

## ライセンス

[MIT License](./LICENSE)。プライバシーポリシーは [`PRIVACY.md`](./PRIVACY.md) を参照。
