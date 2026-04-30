// FunctionFile for ribbon-button ExecuteFunction commands.
//
// Each Office.actions.associate registration here lets the corresponding
// manifest <Control> run the operation directly from the ribbon (or the
// Quick Access Toolbar, once the user pins one of these buttons there).
//
// Validation failures (wrong selection count, missing reference shape,
// etc.) are surfaced to the user via a small Office Dialog popup since
// ribbon commands have no other UI surface.

import { alignHeights } from '../core/operations/alignHeights.js';
import { alignWidths } from '../core/operations/alignWidths.js';
import { packDown, packLeft, packRight, packUp } from '../core/operations/pack.js';
import { swapPositions } from '../core/operations/swap.js';
import { LastSelectedResolver } from '../core/resolvers/lastSelected.js';
import type { OperationResult, Shape } from '../core/types.js';
import { applyShapes, getSelectedShapes } from '../office/selection.js';

type Op = (shapes: readonly Shape[]) => OperationResult;

function showPopup(message: string): void {
  const url = `${window.location.origin}/dialog.html?msg=${encodeURIComponent(message)}`;
  Office.context.ui.displayDialogAsync(
    url,
    { height: 25, width: 30, displayInIframe: false },
    (asyncResult) => {
      if (asyncResult.status !== Office.AsyncResultStatus.Succeeded) {
        console.error('Failed to open ppt-tools popup:', asyncResult.error);
        return;
      }
      const dialog = asyncResult.value;
      dialog.addEventHandler(Office.EventType.DialogMessageReceived, () => {
        dialog.close();
      });
      dialog.addEventHandler(Office.EventType.DialogEventReceived, () => {
        // Fires when the user closes the dialog via the X button.
        // No-op — the dialog object is already invalidated.
      });
    },
  );
}

async function runFromRibbon(op: Op, event: Office.AddinCommands.Event): Promise<void> {
  try {
    const shapes = await getSelectedShapes();
    const result = op(shapes);
    if (result.ok) {
      await applyShapes(result.shapes);
    } else {
      showPopup(result.reason);
    }
  } catch (err) {
    showPopup(err instanceof Error ? err.message : String(err));
  } finally {
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
