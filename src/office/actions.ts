// Registers Office.actions handlers shared between the V1.0 fallback
// path (commands.html loads commands.ts on each ribbon click) and the
// V1.1 shared-runtime path (taskpane.html keeps a persistent runtime).
//
// Validation failures (wrong selection count, missing reference shape, …)
// surface via a small Office Dialog popup. Multiple rapid clicks
// broadcast their popup id over a BroadcastChannel + localStorage so the
// older dialog dismisses itself when a newer one is requested.

import type { Op } from '../core/types.js';
import { POPUP_CHANNEL, POPUP_STORAGE_KEY } from '../dialog/popup-channel.js';
import { OPERATIONS } from './operations.js';
import { setRibbonEnabled } from './ribbon.js';
import { applyShapes, getSelectedShapes } from './selection.js';

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
    // Best-effort.
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
  // Try opening immediately. If no other dialog is currently open this
  // succeeds with no artificial delay. If a previous dialog is still
  // being dismissed, retry briefly to give it time to react to the
  // broadcast above.
  if (await tryOpenDialog(message, popupId)) return;
  for (let attempt = 0; attempt < 3; attempt++) {
    await sleep(200);
    if (await tryOpenDialog(message, popupId)) return;
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
      // Leave the ribbon in its previous state.
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
  for (const { actionName, run } of OPERATIONS) {
    Office.actions.associate(actionName, ribbonCommand(run));
  }
}
