# 要件

## ゴール

PowerPoint タスクペイン・アドイン（Office.js）として、図形操作のための 7 オペレーションを提供する。座標計算ロジックは Office ホスト無しで完全にテスト可能であること。

## 機能要件

「詰める」（pack）系オペレーション：選択図形を指定方向の端へ集約し、隣接図形の間隔をゼロにする。本仕様内では英語名 `packDown` / `packUp` / `packLeft` / `packRight` をコード上で使う。

### FR-1 — 下に詰める

- **トリガー**: 2 個以上の図形を選択して「下に詰める」をクリック。
- **挙動**: 最も下の図形（`top` が最大）は固定。それ以外の図形は、上方向（top が小さい側）から順に隣接する図形と `top` 同士が接するように詰める（パイル全体がスライドの下端側に集まる）。
- **備考**: 変化するのは `top` のみ。`left`、`width`、`height` は保持。
- **選択数ルール**: 2 個未満ならエラーを表示する。

### FR-2 — 上に詰める

- **トリガー**: 2 個以上の図形を選択して「上に詰める」をクリック。
- **挙動**: FR-1 のミラー。最も上の図形（`top` が最小）は固定。後続の各図形の `top` を `previous.top + previous.height` にする（パイル全体が上端側に集まる）。
- **選択数ルール**: 2 個未満ならエラーを表示する。

### FR-3 — 左に詰める

- **トリガー**: 2 個以上の図形を選択して「左に詰める」をクリック。
- **挙動**: 図形を `left` 昇順にソートし、最も左の図形は固定。後続の各図形の `left` を `previous.left + previous.width` にする（パイル全体が左端側に集まる）。
- **選択数ルール**: 2 個未満ならエラーを表示する。

### FR-4 — 右に詰める

- **トリガー**: 2 個以上の図形を選択して「右に詰める」をクリック。
- **挙動**: FR-3 のミラー。最も右の図形は固定。各図形の `left` を `next.left - this.width` にする（パイル全体が右端側に集まる）。
- **選択数ルール**: 2 個未満ならエラーを表示する。

### FR-5 — 高さを揃える

- **トリガー**: 2 個以上の図形を選択して「高さを揃える」をクリック。
- **挙動**:
  - 参照図形を `ReferenceShapeResolver` で決定（下記）。
  - 各選択図形の `height` を参照図形の `height` に合わせる。
  - `top` は保持（図形は下方向に伸縮する。Q1 で top 固定に確定）。
  - `left`、`width` は保持。
- **選択数ルール**: 2 個未満ならエラーを表示する。
- **参照図形の決定（差し替え可能）**:
  - **V1（既定）**: `LastSelectedResolver` — `shapes[shapes.length - 1]`（Office.js の選択順が安定であると仮定）。
  - **V2（フォールバック）**: `StoredReferenceResolver` — 別途用意する「参照図形として保存」ボタンで設定された図形 ID を使う。V1 が PowerPoint 上で不安定な場合に使用する。
  - `alignHeights` コア関数はリゾルバを引数に取るため、戦略の差し替えがアルゴリズムに影響しない。

### FR-5b — 幅を揃える

- **トリガー**: 2 個以上の図形を選択して「幅を揃える」をクリック。
- **挙動**: FR-5 の幅軸版。各選択図形の `width` を参照図形の `width` に合わせる。`left` は固定（図形は右方向に伸縮）。`top`、`height` は保持。
- **選択数ルール**: 2 個未満ならエラーを表示する。
- 参照図形の決定は FR-5 と同じリゾルバを使う。

### FR-6 — 位置の入れ替え

- **トリガー**: 2 個ちょうどの図形を選択して「位置の入れ替え」をクリック。
- **挙動**: 2 図形の `left` と `top` を入れ替える。`width` と `height` は入れ替え**ない**。
- **選択数ルール**: 2 個でないときはエラーを表示する。

### FR-7 — UI 配置

ユーザーは以下 2 つの面から各オペレーションを呼び出せる。

#### タスクペイン（PowerPoint 右側に出る作業ウィンドウ）

- 各オペレーションに 1 ボタン（合計 7 ボタン。論理グルーピング: 4 方向の「詰める」／高さ揃え＋幅揃え／入れ替え）。
- FR-5 の V2 を有効化する場合は「参照図形として保存」ボタンも追加。
- ボタンは「選択数 0 のときのみ無効」とし、それ以外は押下可能にする。各オペレーションは押下時に必要選択数を満たさなければ理由文（日本語）をステータス領域に表示する。
- ステータス領域はタスクペイン下部に常駐し、成功時は更新図形数、失敗時は理由文、起動直後は操作案内を表示する。
- 開き方: PowerPoint の **挿入** タブ → **個人用アドイン** → **ppt-tools**（または **ホーム** タブのアドインメニューから）。

#### リボン（ホームタブの「ppt-tools」グループ）

- グループ内に 6 control（4 方向「詰める」ボタン + **高さ/幅を揃える**ドロップダウン Menu + **位置を入れ替える**ボタン）。
  - PowerPoint のリボンは 1 グループあたり 6 control が上限のため、揃え系 2 操作を Menu に集約している。
- 各 control は **クイック アクセス ツール バー（QAT）に個別ピン留め可能**（Menu 内の Item も個別に登録可）。
- ボタン押下後の挙動はタスクペインと同じ：必要選択数を満たさなければ Office Dialog ポップアップで理由文を表示。
- 0 個選択時のグレーアウト追従は **試みている**が、host 依存。RibbonApi 1.1 をサポートし、かつ DocumentSelectionChanged が安定して発火する PowerPoint で有効。タスクペインを開いていないと共有ランタイムが起動せず、追従しないこともある（仕様上の制約）。

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

## 確定済みの設計判断

実装初期に未解決だった以下の問いはすべて既定どおりに確定した（2026-04-29）。

- **Q1** — 高さ揃えのアンカー: **top 固定**（下方向に伸縮）。実装は `src/core/operations/alignHeights.ts`。
- **Q2** — 「詰める」操作: **隙間ゼロ**（接する）。実装は `src/core/operations/pack.ts`。
- **Q3** — グループ図形: **不透明扱い**。Office.js が返す選択図形をそのまま使い、子図形には立ち入らない。
- **Q4** — 単位: Office.js は `points` を使うが、UI 文言には数値・単位を一切露出しない（タスクペインのステータスは図形数のみ表示）。

## 開発者向け補足

### マニフェストとランタイム

- `manifest.xml` は VersionOverrides V1.0 を fallback、V1.1 を主に持つ二重構造。V1.0 と V1.1 は同一 control ID を共有しており、host がどちらを採用しても `Office.ribbon.requestUpdate` の対象 ID が一致する。
- V1.1 は `<Runtimes lifetime="long">` で **共有ランタイム** を宣言する。これによりタスクペイン用 JS（`src/taskpane/taskpane.ts`）が文書ライフタイム中ずっと生存し、`DocumentSelectionChanged` イベント＋ 1 秒ポーリングによってリボンの enable/disable を継続的に同期する。
- リボンボタンの実行アクションは `src/office/actions.ts` の `registerRibbonActions()` に集約され、V1.0 経路（`commands.ts`）と V1.1 共有ランタイム経路（`taskpane.ts`）の両方が同じ関数を呼んで登録する。
- リボン経由の操作で必要選択数を満たさない場合は `dialog.html` を `Office.context.ui.displayDialogAsync` で開いてエラー文を表示する。連続呼び出し時は `BroadcastChannel` + `localStorage` で古いポップアップを閉じてから新しいポップアップを表示する。
