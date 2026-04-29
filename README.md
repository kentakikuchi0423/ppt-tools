# ppt-tools

PowerPoint Office アドイン（VBA ではなく Office.js）。図形操作のためのツールを提供します：

- 選択図形を下／上／左／右にパック（指定方向の隙間を詰める）
- 選択図形の高さを参照図形に揃える
- 2 つの図形の位置を入れ替える（`left` / `top` のみ。サイズは保持）

座標計算ロジックは `src/core/` に純粋関数として実装し、Office.js に依存しません。Vitest で完全にユニットテスト可能です。Office.js に依存するアダプタコードは `src/office/` に分離されています。

> **ステータス: 雛形のみ。** アドイン機能は未実装です。実装計画は [`TASKS.md`](./TASKS.md) を参照してください。

## 必要環境

- **Node.js 22.x**（`engines` フィールドで `>=22 <23` を強制）。
- **VS Code + Dev Containers 拡張**（推奨。下記「devcontainer での開発」参照）。
- **Windows ホスト + PowerPoint（Microsoft 365）**：アドインの手動サイドロード検証に必要。

## devcontainer での開発（推奨）

開発はすべて devcontainer の中で行います。ホスト機に Node を入れる必要はありません。

1. このフォルダを VS Code で開く。
2. プロンプトが出たら **「コンテナで再度開く」**（Reopen in Container）を選ぶ。コマンドパレットからは `Dev Containers: Reopen in Container`。
3. コンテナは `mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm` から構築されます。`postCreateCommand` で `npm ci || npm install` が走ります。
4. コンテナ起動後：
   ```bash
   npm run validate
   ```
   これで `typecheck` → `lint` → `test` が一括実行されます。

## ホスト直接での開発（代替）

devcontainer を使わない場合：

```bash
nvm use 22       # 任意の Node 22 マネージャでも可
npm install
npm run validate
```

## npm スクリプト

| スクリプト | 内容 |
| --- | --- |
| `npm run dev`             | Vite 開発サーバをポート 3000 で起動 |
| `npm run build`           | `dist/` への本番ビルド（HTML エントリが必要 — TASKS task 2 で追加） |
| `npm run typecheck`       | `tsc --noEmit` を `src/` と `tests/` に対して実行 |
| `npm run lint`            | ESLint をワークスペース全体に実行 |
| `npm run lint:fix`        | ESLint を `--fix` 付きで実行 |
| `npm run format`          | Prettier `--write` をワークスペース全体に実行 |
| `npm run format:check`    | Prettier `--check`（CI 向け） |
| `npm run test`            | Vitest シングル実行 |
| `npm run test:watch`      | Vitest ウォッチモード |
| `npm run test:coverage`   | Vitest（v8 カバレッジ） |
| `npm run validate`        | `typecheck` → `lint` → `test` を順に実行 |
| `npm run manifest:validate` | `manifest.xml` を検証（TASKS task 1 までは失敗します） |
| `npm run start:debug`     | Office アドインのデバッグセッション開始（TASKS task 1 までは失敗します） |
| `npm run stop:debug`      | デバッグセッション停止 |

## プロジェクト構成

```
.
├── .devcontainer/
│   └── devcontainer.json        # Node 22 イメージ + postCreateCommand
├── src/
│   ├── core/                    # 純粋ロジック。Office.js 非依存。Vitest 100% テスト。
│   │   └── types.ts
│   ├── office/                  # （TASKS で追加）Office.js アダプタ。PowerPoint.run / Office.context を呼ぶ唯一の層。
│   └── taskpane/                # （TASKS で追加）タスクペイン UI（HTML + TS）
├── tests/                       # Vitest。src/core のみ import する。
│   └── smoke.test.ts            # プレースホルダ。TASKS task 4 で置き換え。
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

> **以下の手順は雛形です。** 実体の `manifest.xml` は TASKS task 1 で作成されるため、リボンラベルや具体的なファイルパスはその時点で確定し、本 README に反映されます。下記はあくまで全体フローの骨格です。

このリポジトリは Windows レジストリを変更しません。PowerPoint を自動起動しません。サイドロード自動化スクリプトも含みません。サイドロードは Windows ホスト上で**ユーザーが手動**で行います。

### 事前準備（Windows ホスト上で一度だけ）

1. 開発用証明書をインストールし、PowerPoint が `https://localhost:3000` を信頼できるようにします：
   ```bash
   npx office-addin-dev-certs install
   ```
   自己署名 CA を生成して Windows の証明書ストアに登録します。生成される `*.pem` / `*.crt` ファイルは `.gitignore` 済みです。

2. Windows ホスト上に「共有フォルダカタログ」用のフォルダを作成します（例：`C:\OfficeAddins\ppt-tools`）。リポジトリ内の `manifest.xml` をそのフォルダにコピーします。（manifest が TASKS task 1 で追加されたあと、本 README は具体的なパスに更新されます。）

3. PowerPoint で、その共有フォルダを「信頼できるアドインカタログ」として登録：
   - **ファイル → オプション → トラスト センター → トラスト センターの設定 → 信頼できるアドイン カタログ**
   - 手順 2 のフォルダ URL を追加し、**「メニューに表示する」** にチェックして **OK**。
   - PowerPoint を再起動。

### アドインの起動

1. devcontainer 内（あるいは Node 22 のホスト）で：
   ```bash
   npm run dev
   ```
   開発サーバは `https://localhost:3000` でタスクペインを配信します（dev-certs を `vite.config.ts` に組み込み済みになると HTTPS で動作。TASKS task 2）。

2. PowerPoint 上で：
   - **挿入 → アドインの取得 → 共有フォルダー → ppt-tools → 追加**
   - リボンにアドインのボタンが現れます（ラベルは TASKS task 1 で確定）。
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

非公開。配布ライセンスは未設定です。
