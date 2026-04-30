// FunctionFile for ribbon-button ExecuteFunction commands.
//
// Each Office.actions.associate registration here lets the corresponding
// manifest <Control> run the operation directly from the ribbon (or the
// Quick Access Toolbar, once the user pins one of these buttons there).
//
// Validation failures (wrong selection count, missing reference shape,
// etc.) are surfaced via a small Office Dialog popup. When the user fires
// commands in quick succession, the newer popup takes over: each
// invocation broadcasts its id over a BroadcastChannel and updates a
// localStorage flag, and the existing dialog page closes itself when it
// observes a newer id.

import { alignHeights } from '../core/operations/alignHeights.js';
import { alignWidths } from '../core/operations/alignWidths.js';
import { packDown, packLeft, packRight, packUp } from '../core/operations/pack.js';
import { swapPositions } from '../core/operations/swap.js';
import { LastSelectedResolver } from '../core/resolvers/lastSelected.js';
import type { OperationResult, Shape } from '../core/types.js';
import { setRibbonEnabled } from '../office/ribbon.js';
import { applyShapes, getSelectedShapes } from '../office/selection.js';

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
          // Most common failure here is "dialog already open" while the
          // previous popup is still closing itself in response to our
          // broadcast. The caller retries after a short delay.
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
  // Give any existing popup a moment to receive the broadcast and close.
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

void Office.onReady(() => {
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
});
