# 要件

## ゴール

PowerPoint タスクペイン・アドイン（Office.js）として、図形操作のための6オペレーションを提供する。座標計算ロジックは Office ホスト無しで完全にテスト可能であること。

## 機能要件

### FR-1 — 下にパック

- **トリガー**: 1 個以上の図形を選択して「下にパック」をクリック。
- **挙動**: 図形を `top` 昇順にソートし、最も上の図形は固定。後続の各図形の `top` を `previous.top + previous.height` にする（隙間ゼロ）。
- **備考**: 変化するのは `top` のみ。`left`、`width`、`height` は保持。

### FR-2 — 上にパック

- **トリガー**: 1 個以上の図形を選択して「上にパック」をクリック。
- **挙動**: FR-1 のミラー。`top` 昇順にソートし、最も下の図形は固定。各図形の `top` を `next.top - this.height` にする。

### FR-3 — 左にパック

- **トリガー**: 1 個以上の図形を選択して「左にパック」をクリック。
- **挙動**: 図形を `left` 昇順にソートし、最も左の図形は固定。後続の各図形の `left` を `previous.left + previous.width` にする。

### FR-4 — 右にパック

- **トリガー**: 1 個以上の図形を選択して「右にパック」をクリック。
- **挙動**: FR-3 のミラー。最も右の図形は固定。各図形の `left` を `next.left - this.width` にする。

### FR-5 — 高さを揃える

- **トリガー**: 2 個以上の図形を選択して「高さを揃える」をクリック。
- **挙動**:
  - 参照図形を `ReferenceShapeResolver` で決定（下記）。
  - 各選択図形の `height` を参照図形の `height` に合わせる。
  - `top` は保持（図形は下方向に伸縮する）。アンカー位置は実装時に確定 — Q1 参照。
  - `left`、`width` は保持。
- **選択数ルール**: 2 個未満なら no-op、UI にメッセージを表示する。
- **参照図形の決定（差し替え可能）**:
  - **V1（既定）**: `LastSelectedResolver` — `shapes[shapes.length - 1]`（Office.js の選択順が安定であると仮定）。
  - **V2（フォールバック）**: `StoredReferenceResolver` — 別途用意する「参照図形として保存」ボタンで設定された図形 ID を使う。V1 が PowerPoint 上で不安定な場合に使用する。
  - `alignHeights` コア関数はリゾルバを引数に取るため、戦略の差し替えがアルゴリズムに影響しない。

### FR-6 — 位置の入れ替え

- **トリガー**: 2 個ちょうどの図形を選択して「位置の入れ替え」をクリック。
- **挙動**: 2 図形の `left` と `top` を入れ替える。`width` と `height` は入れ替え**ない**。
- **選択数ルール**: 2 個でないときは no-op、UI にメッセージを表示する。

### FR-7 — タスクペイン UI

- 各オペレーションに 1 ボタン（合計 6 ボタン。論理グルーピング: 4 方向パック／高さ揃え／入れ替え）。
- FR-5 の V2 を有効化する場合は「参照図形として保存」ボタンも追加。
- 現在の選択数で操作が成立しないボタンは無効化する（例: 入れ替えは選択数が 2 でないと無効）。
- エラー／no-op メッセージはタスクペイン下部のステータス領域に表示する。

## 非機能要件

### NFR-1 — テスト容易性

- 座標計算ロジックはすべて `src/core/operations/*.ts` に置く。`office-js` および `Office` / `PowerPoint` グローバルへの import は**禁止**。
- 各オペレーションについて Vitest で最低限以下をカバーする: 空、1 個、ソート済み、未ソート、境界。
- カバレッジ目標: `src/core/operations/` の行カバレッジ 100%。`vitest.config.ts` に設定。

### NFR-2 — コード品質

- TypeScript strict（`noUncheckedIndexedAccess`、`exactOptionalPropertyTypes` 含む）。
- ESLint クリーン（`typescript-eslint` strict-type-checked プリセット）。
- Prettier フォーマット済み（CI 向けに `npm run format:check`）。
- 任意のタスクを完了とする前に `npm run validate`（`typecheck && lint && test`）を通す。

### NFR-3 — 依存関係の衛生

- `package.json` のランタイム `dependencies` をゼロに保つ。Office.js は `taskpane.html` から `<script>` で Microsoft CDN を読む。
- ツール（Vite、Vitest、ESLint、Prettier、`office-addin-*` 系 CLI）は `devDependencies` に置く。

### NFR-4 — 機密情報の取り扱い

- API キー、トークン、証明書、`.env` ファイルをコミットしない。
- `.gitignore` で `*.pem`、`*.crt`、`*.key`、`.env*` を除外（`.env.example` のみ例外）。

### NFR-5 — 運用上の制約

- Windows でのサイドロードはユーザーが手動で行う。
- このリポジトリは PowerPoint の自動操作も Windows レジストリの変更も行わない。`office-addin-debugging` の標準 CLI を超えるサイドロード補助は同梱しない。

## 対象外（v1）

- 独自 Undo／Redo（PowerPoint の組み込み Undo に乗る）。
- 複数スライドにまたがる操作（v1 は現スライドのみ）。
- グループ図形の再帰展開（グループは不透明な単一図形として扱う）。
- アニメーション／トランジション／SmartArt 固有の挙動。
- ノート、マスタースライド、レイアウトの読み書き。
- Windows 以外のホスト（Mac PowerPoint、PowerPoint Online — 動作確認は歓迎するが v1 範囲外）。

## 未解決の問い（実装初期に確定する）

- **Q1** — 高さ揃えのアンカー: 下方向に伸縮（top 固定）／上方向に伸縮（bottom 固定）／中心固定 のどれにするか。**既定: top 固定。**
- **Q2** — パック操作: 隙間ゼロ（接する）か、元の最小ギャップを維持するか。**既定: 隙間ゼロ。**
- **Q3** — グループ図形: 不透明扱いか再帰展開か。**既定: 不透明。**
- **Q4** — 単位: Office.js は図形ジオメトリを `points` で返す。UI 文言で「points」「EMU」が露出しないことを確認する。

これらは `TASKS.md` で追跡し、該当オペレーション実装の前にユーザーと確定する。
