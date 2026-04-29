# CLAUDE.md

このファイルは、本リポジトリで作業する Claude Code（claude.ai/code）への指示書です。

## プロジェクト概要

PowerPoint Office アドイン（VBA ではなく Office.js）。図形操作のための6オペレーションを提供する：

- 下／上／左／右へのパック（隙間を詰める）
- 参照図形に高さを揃える
- 2 つの図形の位置を入れ替える

仕様の正本は `REQUIREMENTS.md`（FR-1 … FR-7、NFR-1 … NFR-5）、実装の進行順は `TASKS.md` を参照。

## スタック

- Node.js 22、ESM（`"type": "module"`）。
- TypeScript strict（`noUncheckedIndexedAccess`、`exactOptionalPropertyTypes`、`verbatimModuleSyntax`）。
- ビルド／開発サーバは Vite、テストは Vitest。
- ESLint v9 flat config + `typescript-eslint` strict-type-checked + `eslint-config-prettier`。整形は Prettier。
- Office.js は実行時に CDN から読み込む（npm の `dependencies` には何も入れない）。

## アーキテクチャ規則（最重要）

```
src/
├── core/    # 純粋ロジック層。Office.js への import 禁止。Vitest で 100% テスト。
├── office/  # PowerPoint.run / Office.context を呼べる唯一の層。
└── taskpane/ # UI。
```

- `src/core/` から `PowerPoint.run` / `Office.context` および `Office` / `PowerPoint` グローバル配下を**絶対に**呼ばない。
- `tests/` 配下のテストは `src/core/` のみを import する。Office.js を生成しない。
- `src/office/` のアダプタが Office.js のオブジェクトと、`src/core/types.ts` で定義されるプレーンな `Shape` 値型との相互変換を担う。
- この層分離があるからこそ、PowerPoint ホスト無しで座標ロジックをテストできる。

## 参照図形リゾルバ・パターン

`alignHeights`（`src/core/operations/alignHeights.ts`）は `ReferenceShapeResolver` をパラメータとして受け取る。リゾルバ自体は入力（`Shape[]` と保存済み ID 文字列）に対して純粋なので **`src/core/` に置く**。実装は 2 種類：

- `LastSelectedResolver` — `shapes[shapes.length - 1]` を採用（V1）。
- `StoredReferenceResolver` — コンストラクタで受け取った `referenceId` に一致する図形を引き当てる（V2、Office.js の選択順が不安定だった場合のフォールバック）。

「参照図形 ID を保存／読み込みする」永続化は副作用なので `src/office/` 側で `Office.context.document.settings` 等を介して行い、得た文字列を `StoredReferenceResolver` に注入する。新しい整列系オペレーションを追加する際もこの方式を踏襲する。アルゴリズム本体は純粋に保ち、リゾルバを注入する。

## テスト規則

`src/core/operations/<name>.ts` には対応する `tests/operations/<name>.test.ts` を必ず置く。最低限カバーするケース：

- 空入力
- 1 図形のみ
- ソート済み入力
- 未ソート入力
- 各オペレーション固有の境界条件（重なり、同一座標 など）

## よく使うコマンド

| コマンド                                       | 用途                                                                               |
| ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| `npm run validate`                             | `typecheck` → `lint` → `test`。タスク完了宣言の前に必ずグリーンにする。            |
| `npm run typecheck`                            | `tsc --noEmit` を `src/` と `tests/` に対して実行（設定は `tsconfig.json`）。      |
| `npm run lint` / `npm run lint:fix`            | ESLint flat config（`eslint.config.js`）。                                         |
| `npm run test` / `npm run test:watch`          | Vitest。テストファイルは `tests/**/*.test.ts`。                                    |
| `npm run test:coverage`                        | v8 カバレッジ。`src/core/**` のみ計測（`vitest.config.ts`）。                      |
| `npx vitest run tests/operations/pack.test.ts` | 単一テストファイルを実行。                                                         |
| `npx vitest run -t "pack down sorts"`          | テスト名パターンで絞り込み実行。                                                   |
| `npm run dev`                                  | Vite 開発サーバを `https://localhost:3000` で起動（dev-certs 配線後に HTTPS 化）。 |
| `npm run build`                                | 本番ビルドを `dist/` へ出力。HTML エントリ（TASKS task 2）が無いうちは失敗する。   |
| `npm run manifest:validate`                    | `manifest.xml` の検証。TASKS task 1 で manifest を作るまでは失敗する。             |
| `npm run start:debug` / `npm run stop:debug`   | `office-addin-debugging` セッション。前提は同上。                                  |

Node 22 必須（`engines: ">=22 <23"`）。実行環境は devcontainer（`.devcontainer/devcontainer.json`）の使用を推奨。

## ワークフロー規則

- タスク完了を宣言する前に必ず `npm run validate` を通す。
- ランタイム `dependencies` を追加しない。すべて `devDependencies`。Office.js は CDN 読み込み。
- `manifest.xml` の `<Id>` GUID を安易に変更しない。これがアドインの識別子であり、変更すると PowerPoint のローカルキャッシュを無効化して再サイドロードが必要になる。
- `*.pem`、`*.crt`、`*.key`（開発用証明書）はコミットしない。
- `.env*` ファイルは `.env.example` を除いてコミットしない。

## 対象外（明示的依頼が無い限り実装しない）

- PowerPoint の自動操作（PowerPoint そのものを駆動するスクリプト）。
- Windows レジストリの変更。
- `office-addin-debugging` 標準 CLI を超えるサイドロード補助ツール。
- 独自 Undo／Redo（PowerPoint の組み込み Undo に乗る）。
- 複数スライドにまたがる操作（v1 はアクティブスライドのみ）。
- グループ図形の再帰展開（v1 ではグループは不透明として扱う）。
- アニメーション／トランジション。

## ドキュメント更新規則

機能的な振る舞いを追加・変更したときは：

1. 要件そのものが変わるなら `REQUIREMENTS.md` を更新。
2. 進捗マーキングや追加タスクのため `TASKS.md` を更新。
3. ユーザー向け振る舞いやサイドロード手順が変わるなら `README.md` を更新。
4. これら以外のドキュメントファイルは明確な理由が無い限り増やさない。

## ドキュメントの言語

- 本リポジトリの Markdown ドキュメント（`CLAUDE.md` / `README.md` / `REQUIREMENTS.md` / `TASKS.md` および今後追加されるもの）は**日本語**で書く。
- コード識別子、コマンド名、ファイルパス、設定キー、型名などの技術的トークンは英語のまま残す。コードブロック内のコマンド例も英語。
- ソースコード内コメント、コミットメッセージ、PR タイトルは引き続き英語。
- ユーザーへの確認・進捗報告は日本語。
