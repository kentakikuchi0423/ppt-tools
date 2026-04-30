import { alignHeights } from '../core/operations/alignHeights.js';
import { alignWidths } from '../core/operations/alignWidths.js';
import { packDown, packLeft, packRight, packUp } from '../core/operations/pack.js';
import { swapPositions } from '../core/operations/swap.js';
import { LastSelectedResolver } from '../core/resolvers/lastSelected.js';
import type { OperationResult, Shape } from '../core/types.js';
import { registerRibbonActions } from '../office/actions.js';
import { setRibbonEnabled } from '../office/ribbon.js';
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
  let count = 0;
  try {
    const shapes = await getSelectedShapes();
    count = shapes.length;
  } catch {
    count = 0;
  }
  applyButtonStates(count);
  await setRibbonEnabled(count >= 1);
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
  // Shared runtime entry: this script runs once when the document opens
  // (V1.1 hosts) or the first time the task pane shows / a ribbon button
  // is clicked. Register the ribbon action handlers here so they're
  // available before any ribbon dispatch.
  registerRibbonActions();

  if (info.host !== Office.HostType.PowerPoint) {
    setStatus('ppt-tools は PowerPoint 内で実行してください。', 'error');
    return;
  }

  // The task pane DOM only exists when the user has actually opened the
  // pane. In shared-runtime mode this script also runs to service ribbon
  // commands without the pane being visible, so guard against missing
  // elements before wiring UI handlers.
  const statusEl = document.getElementById('status');
  if (statusEl) {
    setStatus('図形を選択して操作を選んでください。');
    applyButtonStates(0);
    for (const id of buttonIds) {
      const btn = document.getElementById(id);
      if (!(btn instanceof HTMLButtonElement)) continue;
      btn.addEventListener('click', () => {
        void runOperation(operations[id]);
      });
    }
  }

  Office.context.document.addHandlerAsync(Office.EventType.DocumentSelectionChanged, () => {
    void refreshButtonStates();
  });
  window.addEventListener('focus', () => {
    void refreshButtonStates();
  });

  // PowerPoint's DocumentSelectionChanged event isn't always raised when
  // the shape selection inside a slide changes (it fires more reliably
  // for slide-level changes). Poll the selection as a safety net so the
  // ribbon greys out within ~1 s of the user clicking off all shapes.
  // setRibbonEnabled is a no-op when the requested state matches the
  // current one.
  setInterval(() => {
    void refreshButtonStates();
  }, 1000);

  void refreshButtonStates();
});
