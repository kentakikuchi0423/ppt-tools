import { alignHeights } from '../core/operations/alignHeights.js';
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
  | 'swap-positions';

const operations: Record<ButtonId, Op> = {
  'pack-up': (s) => ({ ok: true, shapes: packUp(s) }),
  'pack-down': (s) => ({ ok: true, shapes: packDown(s) }),
  'pack-left': (s) => ({ ok: true, shapes: packLeft(s) }),
  'pack-right': (s) => ({ ok: true, shapes: packRight(s) }),
  'align-heights': (s) => alignHeights(s, LastSelectedResolver),
  'swap-positions': swapPositions,
};

// FR-1〜FR-6 selection-count rules. Pack tolerates a single shape (no-op
// passthrough); align-heights needs 2+; swap needs exactly 2.
const isEnabledFor: Record<ButtonId, (selectionCount: number) => boolean> = {
  'pack-up': (n) => n >= 1,
  'pack-down': (n) => n >= 1,
  'pack-left': (n) => n >= 1,
  'pack-right': (n) => n >= 1,
  'align-heights': (n) => n >= 2,
  'swap-positions': (n) => n === 2,
};

function setStatus(msg: string, kind: 'info' | 'error' = 'info'): void {
  const el = document.getElementById('status');
  if (!el) return;
  el.textContent = msg;
  el.dataset['kind'] = kind;
}

function applyButtonStates(selectionCount: number): void {
  for (const id of Object.keys(operations) as ButtonId[]) {
    const btn = document.getElementById(id);
    if (btn instanceof HTMLButtonElement) {
      btn.disabled = !isEnabledFor[id](selectionCount);
    }
  }
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
    setStatus('Working…');
    const shapes = await getSelectedShapes();
    const result = op(shapes);
    if (result.ok) {
      await applyShapes(result.shapes);
      setStatus(`Updated ${String(result.shapes.length)} shape(s).`);
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
    setStatus('ppt-tools must run inside PowerPoint.', 'error');
    return;
  }
  setStatus('Select shapes and pick an operation.');
  applyButtonStates(0);
  for (const [id, op] of Object.entries(operations)) {
    const btn = document.getElementById(id);
    if (!(btn instanceof HTMLButtonElement)) continue;
    btn.addEventListener('click', () => {
      void runOperation(op);
    });
  }

  // PowerPoint fires DocumentSelectionChanged on slide changes. Shape-level
  // selection changes within a slide aren't always covered, so we also
  // refresh on window focus as a fallback when the user clicks back into the
  // pane after selecting different shapes.
  Office.context.document.addHandlerAsync(
    Office.EventType.DocumentSelectionChanged,
    () => {
      void refreshButtonStates();
    },
  );
  window.addEventListener('focus', () => {
    void refreshButtonStates();
  });
  void refreshButtonStates();
});
