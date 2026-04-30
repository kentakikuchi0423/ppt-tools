// Shared registration of ribbon-button ExecuteFunction handlers.
//
// Called from both commands.ts (V1.0 fallback path, where the FunctionFile
// loads commands.html on every ribbon click) and taskpane.ts (V1.1 shared
// runtime path, where the FunctionFile and task pane share one persistent
// runtime started from taskpane.html).
//
// Validation failures (wrong selection count, missing reference shape, …)
// are surfaced via a small Office Dialog popup since ribbon commands have
// no other UI surface. Multiple rapid clicks broadcast their popup id over
// a BroadcastChannel + localStorage so the older dialog dismisses itself
// when a newer one is requested.

import { alignHeights } from '../core/operations/alignHeights.js';
import { alignWidths } from '../core/operations/alignWidths.js';
import { packDown, packLeft, packRight, packUp } from '../core/operations/pack.js';
import { swapPositions } from '../core/operations/swap.js';
import { LastSelectedResolver } from '../core/resolvers/lastSelected.js';
import type { OperationResult, Shape } from '../core/types.js';
import { setRibbonEnabled } from './ribbon.js';
import { applyShapes, getSelectedShapes } from './selection.js';

type Op = (shapes: readonly Shape[]) => OperationResult;

const POPUP_CHANNEL = 'ppt-tools-dialog';
const POPUP_STORAGE_KEY = 'pptToolsLatestPopupId';

function broadcastNewPopup(popupId: string): void {
  try {
    const channel = new BroadcastChannel(POPUP_CHANNEL);
    channel.postMessage({ type: 'newPopup', id: popupId });
    channel.close();
  } catch {
    // BroadcastChannel may not be available; the dialog page also polls
    // localStorage as a fallback.
  }
  try {
    localStorage.setItem(POPUP_STORAGE_KEY, popupId);
  } catch {
    // Ignore — best-effort.
  }
}

function tryOpenDialog(message: string, popupId: string): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    const url = `${window.location.origin}/dialog.html?msg=${encodeURIComponent(message)}&id=${popupId}`;
    Office.context.ui.displayDialogAsync(
      url,
      { height: 16, width: 10, displayInIframe: false },
      (asyncResult) => {
        if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
          const dialog = asyncResult.value;
          dialog.addEventHandler(Office.EventType.DialogMessageReceived, () => {
            dialog.close();
          });
          resolve(true);
        } else {
          resolve(false);
        }
      },
    );
  });
}

async function sleep(ms: number): Promise<void> {
  return new Promise<void>((r) => {
    setTimeout(r, ms);
  });
}

async function showPopup(message: string): Promise<void> {
  const popupId = String(Date.now());
  broadcastNewPopup(popupId);
  await sleep(180);
  for (let attempt = 0; attempt < 4; attempt++) {
    const opened = await tryOpenDialog(message, popupId);
    if (opened) return;
    await sleep(300);
  }
  console.error('[ppt-tools] failed to open popup after retries');
}

async function runFromRibbon(op: Op, event: Office.AddinCommands.Event): Promise<void> {
  try {
    const shapes = await getSelectedShapes();
    const result = op(shapes);
    if (result.ok) {
      await applyShapes(result.shapes);
    } else {
      await showPopup(result.reason);
    }
  } catch (err) {
    await showPopup(err instanceof Error ? err.message : String(err));
  } finally {
    try {
      const after = await getSelectedShapes();
      await setRibbonEnabled(after.length >= 1);
    } catch {
      // Ignore — leave the ribbon in its previous state.
    }
    event.completed();
  }
}

const ribbonCommand =
  (op: Op) =>
  (event: Office.AddinCommands.Event): void => {
    void runFromRibbon(op, event);
  };

let registered = false;

export function registerRibbonActions(): void {
  if (registered) return;
  registered = true;
  Office.actions.associate('packDown', ribbonCommand(packDown));
  Office.actions.associate('packUp', ribbonCommand(packUp));
  Office.actions.associate('packLeft', ribbonCommand(packLeft));
  Office.actions.associate('packRight', ribbonCommand(packRight));
  Office.actions.associate(
    'alignHeights',
    ribbonCommand((s) => alignHeights(s, LastSelectedResolver)),
  );
  Office.actions.associate(
    'alignWidths',
    ribbonCommand((s) => alignWidths(s, LastSelectedResolver)),
  );
  Office.actions.associate('swapPositions', ribbonCommand(swapPositions));
}
