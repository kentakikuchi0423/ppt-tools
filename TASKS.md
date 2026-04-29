# タスク

実装の進行順。各タスクは `npm run validate` がグリーンであり、「完了条件」チェックリストを満たした時点で完了とする。

ステータス記号: `[ ]` 未着手 ・ `[~]` 着手中 ・ `[x]` 完了。

## Phase 0 — 雛形（この PR）

- [x] devcontainer 設定（`.devcontainer/devcontainer.json`）。
- [x] 各種ベース設定（`.gitignore`、`.editorconfig`、`.prettierrc`、`.prettierignore`、`tsconfig.json`、`eslint.config.js`、`vite.config.ts`、`vitest.config.ts`）。
- [x] 必要なスクリプトと devDependencies を備えた `package.json`。
- [x] `README.md`、`CLAUDE.md`、`REQUIREMENTS.md`、`TASKS.md`。
- [x] ソースの骨格（`src/core/types.ts`、`tests/smoke.test.ts`）。

**検証手順（devcontainer 内で実行）:**

```bash
npm install
npm run validate     # typecheck + lint + test → すべてグリーン
```

`npm run build`、`npm run manifest:validate`、`npm run start:debug` はこの時点では**失敗するのが正常**。Phase 1 で生成される成果物に依存する。

---

## Phase 1 — アドインの外殻

### Task 1 — manifest の雛形

PowerPoint タスクペイン・アドインを記述する `manifest.xml` を作成する。

- `<Id>` には新しいランダム GUID を発行（既存値を流用しない）。
- リボングループは 1 つ、ボタンは 1 個（ラベル: 「Open ppt-tools」）。
- タスクペインのソース: `https://localhost:3000/taskpane.html`。
- コマンドのソース: `https://localhost:3000/commands.html`。
- `npm run manifest:validate` で検証。
- `README.md` の「手動サイドロード」節を、確定したリボンラベル・ファイルパスで更新する。

**完了条件:**

- [x] `manifest.xml` がリポジトリ直下に存在する。
- [x] `npm run manifest:validate` が成功する。
- [x] `README.md` のサイドロード節が実ラベル／実パスを使っている。

### Task 2 — Vite マルチエントリ + dev-certs の HTTPS 化

2 種類の HTML エントリを作成し、Vite の HTTPS サーバを dev-certs で配線する。

- `taskpane.html`（リポジトリ直下）— Office.js を CDN から読み込み、`src/taskpane/taskpane.ts` をロードする。Vite が `https://localhost:3000/taskpane.html` で配信できるよう、HTML はプロジェクトルートに配置している（実装段階で TASKS の当初記述から変更）。
- `src/taskpane/taskpane.ts` — `Office.onReady` を呼び、6 ボタンのプレースホルダを描画。
- `commands.html` + `src/commands/commands.ts` — リボンコマンド用の最小スタブ。
- `vite.config.ts` — マルチエントリ入力。`office-addin-dev-certs` の証明書があれば HTTPS、無ければ警告して HTTP にフォールバック。
- `npm run build` で `dist/taskpane.html` と `dist/commands.html` が出力される。

**完了条件:**

- [x] `npm run dev` が `https://localhost:3000` で起動し、両エントリを配信する（dev-certs 未導入時は HTTP）。
- [x] `npm run build` が成功し、両バンドルを出力する。
- [ ] サイドロードでプレースホルダのタスクペインまで PowerPoint で到達できる（Windows ホスト上で要検証）。

---

## Phase 2 — コアロジック（純粋・テスト可能）

### Task 3 — コア型の整備

`src/core/types.ts` を肉付けする：

- `Shape`（id、left、top、width、height。すべて points 単位の数値）。
- `Direction = 'up' | 'down' | 'left' | 'right'`。
- `ReferenceShapeResolver` インタフェース。
- 失敗しうるオペレーション用の Result 判別共用体（`{ ok: true; shapes: Shape[] }` | `{ ok: false; reason: string }`）。swap と alignHeights が使う。

**完了条件:** 型が型検査を通り、後続タスクのテストファイルから import できる。

### Task 4 — パック操作

`src/core/operations/pack.ts` を作成し、`packDown`、`packUp`、`packLeft`、`packRight` を `(shapes: Shape[]) => Shape[]` の純粋関数として実装する。

`tests/operations/pack.test.ts` で各方向につき以下をカバー：

- 空入力
- 1 図形（入力をそのまま返す）
- ソート済みかつ重なりなしの入力
- 未ソート入力（主軸でソートする）
- 重なりのある入力
- ID の同一性（入力 ID と同じ ID 集合が出力される）

実装前に Q2（隙間ゼロ／既存ギャップ維持）をユーザーと確定する。既定: 隙間ゼロ。

`tests/smoke.test.ts` は `pack.test.ts` ができた時点で削除する。

**完了条件:**

- [x] 4 関数が `pack.ts` から export されている。
- [x] `tests/operations/pack.test.ts` が上記ケースを網羅している。
- [x] `npm run validate` グリーン。

### Task 5 — 高さ揃え

`src/core/operations/alignHeights.ts` を作成する：

- シグネチャ: `alignHeights(shapes: Shape[], resolver: ReferenceShapeResolver) => Result`。
- `shapes.length < 2` または resolver が `undefined` を返した場合は `{ ok: false }`。
- それ以外は各図形の `height` を参照図形の `height` に揃える（top 固定 — Q1 で確認）。

両リゾルバも同様に実装する（入力に対して純粋なので `src/core/` に置いてよい）：

- `LastSelectedResolver`
- `StoredReferenceResolver` — `referenceId: string` で構築する。

`tests/operations/alignHeights.test.ts` でカバーする項目：

- 各リゾルバについて、参照あり／参照なしの両ケース。
- 入力 < 2 図形（no-op）。
- 参照図形そのものは変更されない。
- すべての図形で `top`、`left`、`width` が保持される。

**完了条件:**

- [x] 両リゾルバが export されている。
- [x] テストが全ブランチをカバー。
- [x] `npm run validate` グリーン。

### Task 6 — 位置の入れ替え

`src/core/operations/swap.ts` を作成する：

- シグネチャ: `swapPositions(shapes: Shape[]) => Result`。
- `shapes.length === 2` でない限り `{ ok: false }`。
- 2 図形の `left` と `top` を入れ替える。`width`、`height`、`id` は保持する。

`tests/operations/swap.test.ts` で 0／1／2／3 個の入力ケース、`width`/`height` の保持、id の保持をカバー。

**完了条件:**

- [x] `swapPositions` が export されている。
- [x] 入力数 4 ケースをすべてテスト。
- [x] `npm run validate` グリーン。

---

## Phase 3 — Office.js アダプタ

### Task 7 — 選択の読み取り

`src/office/selection.ts` を作成する：

- `getSelectedShapes(): Promise<Shape[]>` を `PowerPoint.run` で実装。
- `selectedShapes` をロードし、各 Office shape をプレーンな `Shape` 値型にマップする。
- PowerPoint 内で動いていない場合は型付きエラーをスローする。

**完了条件:**

- [ ] PowerPoint 上での手動スモーク: 3 個の図形を選択すると、ジオメトリが正しい 3 件の `Shape` レコードが返る。
- [ ] `src/core/` からの import は型のみ。

### Task 8 — 選択への書き戻し

`src/office/selection.ts` に `applyShapes(updates: Shape[]): Promise<void>` を追加する：

- 各更新 `Shape` について、id で対応する PowerPoint 上の生図形を引き当て、`left`、`top`、`width`、`height` を書き戻す。
- 単一の `PowerPoint.run` で囲み、PowerPoint の Undo が 1 ステップとして扱えるようにする。

**完了条件:**

- [ ] 手動スモーク: PowerPoint 上で変更が反映され、Ctrl+Z 一回ですべて取り消せる。

---

## Phase 4 — UI 配線

### Task 9 — タスクペインの配線

`src/taskpane/taskpane.ts` で：

- 各オペレーションに対応するボタンを 1 個ずつ配置。
- 各ハンドラ: `getSelectedShapes` → コアオペレーション → `ok` なら `applyShapes`、`!ok` ならステータスメッセージ表示。
- 下部にステータス表示領域。
- 高さ揃えの v1 リゾルバは `LastSelectedResolver`。

**完了条件:**

- [ ] 6 ボタンすべてが PowerPoint 上で動作する。
- [ ] 不正な選択数の場合にエラーメッセージが表示される。

### Task 10 — 手動サイドロード検証

ユーザーが Windows PowerPoint 上で 6 オペレーションすべてをエンドツーエンドで検証する。サイドロード手順に補足が必要なら `README.md` を更新する。

**完了条件:**

- [ ] FR-1 〜 FR-6 の要件どおりに 6 オペレーションが動作することをユーザーが確認。

### Task 11 — 仕上げ

- 選択数が不正なボタンを無効化する（可能なら `Office.context.document.addHandlerAsync` で selection-changed を購読、不可ならフォーカス時に再評価）。
- エラートーストの改善。
- 未解決の問い Q1 〜 Q4 を確定し、`REQUIREMENTS.md` に最終回答を記載。
- V1 の `LastSelectedResolver` が不安定だった場合、`StoredReferenceResolver` と「参照図形として保存」ボタンを追加して出荷する。

**完了条件:**

- [ ] Q1 〜 Q4 がクローズしている。
- [ ] 選択数に応じたボタンの活性／非活性が機能している。
