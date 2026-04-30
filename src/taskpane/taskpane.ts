import type { Op } from '../core/types.js';
import { registerRibbonActions } from '../office/actions.js';
import { OPERATIONS } from '../office/operations.js';
import { setRibbonEnabled } from '../office/ribbon.js';
import { applyShapes, getSelectedShapes } from '../office/selection.js';
import './taskpane.css';

function applyButtonStates(selectionCount: number): void {
  for (const { htmlId } of OPERATIONS) {
    const btn = document.getElementById(htmlId);
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
  // Shared-runtime entry: this script also runs to service ribbon commands
  // even when the task pane is not visible. Register handlers up-front.
  registerRibbonActions();

  if (info.host !== Office.HostType.PowerPoint) {
    setStatus('ppt-tools は PowerPoint 内で実行してください。', 'error');
    return;
  }

  // The task-pane DOM only exists when the pane is open. Guard before
  // wiring UI handlers.
  const statusEl = document.getElementById('status');
  if (statusEl) {
    setStatus('図形を選択して操作を選んでください。');
    applyButtonStates(0);
    for (const { htmlId, run } of OPERATIONS) {
      const btn = document.getElementById(htmlId);
      if (!(btn instanceof HTMLButtonElement)) continue;
      btn.addEventListener('click', () => {
        void runOperation(run);
      });
    }
  }

  Office.context.document.addHandlerAsync(Office.EventType.DocumentSelectionChanged, () => {
    void refreshButtonStates();
  });
  window.addEventListener('focus', () => {
    void refreshButtonStates();
  });

  // DocumentSelectionChanged isn't always raised when the shape selection
  // inside a slide changes (it fires more reliably for slide-level
  // changes). Poll as a safety net so the ribbon greys out within ~1 s of
  // the user clicking off all shapes. setRibbonEnabled is a no-op when
  // the requested state matches the current one.
  setInterval(() => {
    void refreshButtonStates();
  }, 1000);

  void refreshButtonStates();
});
