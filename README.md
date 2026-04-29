# ppt-tools

PowerPoint Office アドイン（VBA ではなく Office.js）。図形操作のためのツールを提供します：

- 選択図形を下／上／左／右に詰める（指定方向にパイルを集約し、隣接する図形の隙間をゼロにする）
- 選択図形の高さ・幅を参照図形に揃える
- 2 つの図形の位置を入れ替える（`left` / `top` のみ。サイズは保持）

座標計算ロジックは `src/core/` に純粋関数として実装し、Office.js に依存しません。Vitest で完全にユニットテスト可能です。Office.js に依存するアダプタコードは `src/office/` に分離されています。

実装の進行状況は [`TASKS.md`](./TASKS.md) を参照してください。

## クイックスタート（Windows ユーザー向け）

PowerPoint で動作確認したいだけなら、以下の手順だけで OK です：

1. **Node.js 22 以上**をインストール（[nodejs.org](https://nodejs.org/) から LTS 版）。
2. このリポジトリを Windows のフォルダに clone（例：`C:\Users\<あなた>\Documents\dev\ppt-tools`）。
3. リポジトリ直下の **`start.cmd` をダブルクリック**。

`start.cmd` が自動で：

1. Node.js のバージョン確認
2. `npm install`（初回のみ。数分かかる）
3. 開発用証明書のインストール（初回のみ。**UAC ダイアログが出たら「はい」**）
4. dev サーバ起動 + アドインのサイドロード + PowerPoint 起動

PowerPoint が開いたらリボンの **ホーム** タブ右端の **ppt-tools** グループから **Open ppt-tools** をクリックしてタスクペインを開いてください。終了するときは `start.cmd` のウィンドウを閉じる、または別の PowerShell で `npm run stop:debug`。

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

`npm run start:debug` は dev サーバ（`https://localhost:3000`）の起動 → アドインのサイドロード → PowerPoint の起動までを一括で行います。PowerPoint が立ち上がったらリボンの **ホーム** タブにある **ppt-tools** グループの **Open ppt-tools** ボタンをクリックすればタスクペインが開きます。

終了するときは `npm run stop:debug`。

## npm スクリプト

| スクリプト                  | 内容                                                                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`               | Vite 開発サーバを `https://localhost:3000` で起動（dev-certs インストール時のみ HTTPS。未インストール時は HTTP にフォールバック） |
| `npm run build`             | `dist/` に `taskpane.html` / `commands.html` を含む本番ビルドを出力                                                               |
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
├── manifest.xml                 # PowerPoint アドインのマニフェスト
├── taskpane.html                # タスクペイン HTML エントリ
├── commands.html                # FunctionFile HTML エントリ（リボンコマンド用）
├── public/
│   └── assets/                  # manifest 参照のアイコン PNG（npm run icons で生成）
├── scripts/
│   └── generate-icons.mjs       # プレースホルダ PNG ジェネレータ
├── src/
│   ├── core/                    # 純粋ロジック。Office.js 非依存。Vitest 100% テスト。
│   │   ├── operations/          # pack / alignHeights / swap
│   │   ├── resolvers/           # LastSelectedResolver / StoredReferenceResolver
│   │   └── types.ts
│   ├── office/                  # Office.js アダプタ。PowerPoint.run / Office.context を呼ぶ唯一の層。
│   ├── taskpane/                # タスクペイン UI のスクリプト
│   └── commands/                # FunctionFile のスクリプト
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

3. PowerPoint で、その共有フォルダを「信頼できるアドインカタログ」として登録：
   - **ファイル → オプション → トラスト センター → トラスト センターの設定 → 信頼できるアドイン カタログ**
   - 手順 2 のフォルダ URL を追加し、**「メニューに表示する」** にチェックして **OK**。
   - PowerPoint を再起動。

### アドインの起動

1. devcontainer 内（あるいは Node 22 のホスト）で：

   ```bash
   npm run dev
   ```

   開発サーバは `https://localhost:3000` でタスクペイン（`/taskpane.html`）と FunctionFile（`/commands.html`）を配信します。dev-certs インストール済みなら HTTPS、未インストール時は HTTP（PowerPoint からは読み込めないので警告ログが出ます）。

2. PowerPoint 上で：
   - **挿入 → アドインの取得 → 共有フォルダー → ppt-tools → 追加**
   - リボンの **ホーム** タブに **ppt-tools** グループが追加され、**Open ppt-tools** ボタンが現れます。
   - クリックでタスクペインが開きます。

### 開発ループ

タスクペインは Vite の HMR でリロードされます。PowerPoint がタスクペインを強くキャッシュすることがあるため、変更が反映されない場合はアドインペインを一度閉じて開き直してください。

共有フォルダ経由のサイドロードに関する Microsoft 公式ドキュメントは Microsoft Learn を参照してください（検索キーワード: "Sideload Office Add-ins for testing from a network share"）。

## 制約・注意

- このリポジトリは PowerPoint を自動操作しません。Windows レジストリも変更しません。`office-addin-debugging` を超えるサイドロード補助も含みません。
- 開発用証明書（`*.pem`、`*.crt`、`*.key`）は `.gitignore` 済み。コミット禁止。
- 秘密情報・API キーは含まれていません。アドインも外部サービスを呼びません。
- ランタイム `dependencies` ゼロ。Office.js はタスクペイン HTML から CDN で読み込みます。
- v1 ではグループ図形を不透明な単一図形として扱います（再帰展開しません）。

## ライセンス

公開（AppSource やストア配布）を視野に開発中です。配布前に正式なライセンス文を `LICENSE` ファイルとして同梱します。
