import { alignHeights } from '../core/operations/alignHeights.js';
import { alignWidths } from '../core/operations/alignWidths.js';
import { packDown, packLeft, packRight, packUp } from '../core/operations/pack.js';
import { swapPositions } from '../core/operations/swap.js';
import { LastSelectedResolver } from '../core/resolvers/lastSelected.js';
import type { OperationResult, Shape } from '../core/types.js';
import { applyShapes, getSelectedShapes } from '../office/selection.js';
import './taskpane.css';

type Op = (shapes: readonly Shape[]) => OperationResult;
type ButtonId =
  | 'pack-up'
  | 'pack-down'
  | 'pack-left'
  | 'pack-right'
  | 'align-heights'
  | 'align-widths'
  | 'swap-positions';

const operations: Record<ButtonId, Op> = {
  'pack-up': packUp,
  'pack-down': packDown,
  'pack-left': packLeft,
  'pack-right': packRight,
  'align-heights': (s) => alignHeights(s, LastSelectedResolver),
  'align-widths': (s) => alignWidths(s, LastSelectedResolver),
  'swap-positions': swapPositions,
};

// 1 個でも選択されていれば各ボタンは押せるようにし、押下時に各オペレーションが
// 「なぜ動かないか」のメッセージを返すようにする。0 個のときだけ選択そのものが
// 無いので全部無効化する。
const buttonIds = Object.keys(operations) as ButtonId[];

function applyButtonStates(selectionCount: number): void {
  for (const id of buttonIds) {
    const btn = document.getElementById(id);
    if (btn instanceof HTMLButtonElement) {
      btn.disabled = selectionCount < 1;
    }
  }
}

function setStatus(msg: string, kind: 'info' | 'error' = 'info'): void {
  const el = document.getElementById('status');
  if (!el) return;
  el.textContent = msg;
  el.dataset['kind'] = kind;
}

async function refreshButtonStates(): Promise<void> {
  try {
    const shapes = await getSelectedShapes();
    applyButtonStates(shapes.length);
  } catch {
    applyButtonStates(0);
  }
}

async function runOperation(op: Op): Promise<void> {
  try {
    setStatus('処理中…');
    const shapes = await getSelectedShapes();
    const result = op(shapes);
    if (result.ok) {
      await applyShapes(result.shapes);
      setStatus(`${String(result.shapes.length)} 個の図形を更新しました。`);
    } else {
      setStatus(result.reason, 'error');
    }
  } catch (err) {
    setStatus(err instanceof Error ? err.message : String(err), 'error');
  }
  await refreshButtonStates();
}

void Office.onReady((info) => {
  if (info.host !== Office.HostType.PowerPoint) {
    setStatus('ppt-tools は PowerPoint 内で実行してください。', 'error');
    return;
  }
  setStatus('図形を選択して操作を選んでください。');
  applyButtonStates(0);
  for (const id of buttonIds) {
    const btn = document.getElementById(id);
    if (!(btn instanceof HTMLButtonElement)) continue;
    btn.addEventListener('click', () => {
      void runOperation(operations[id]);
    });
  }

  Office.context.document.addHandlerAsync(Office.EventType.DocumentSelectionChanged, () => {
    void refreshButtonStates();
  });
  window.addEventListener('focus', () => {
    void refreshButtonStates();
  });
  void refreshButtonStates();
});
