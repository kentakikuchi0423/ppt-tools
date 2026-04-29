// FunctionFile for ribbon-button ExecuteFunction commands.
//
// Each Office.actions.associate registration here lets the corresponding
// manifest <Control> run the operation directly from the ribbon (or the
// Quick Access Toolbar, once the user pins one of these buttons there).
//
// Failure mode: ribbon commands have no UI surface for error toasts, so
// we log to the runtime log and silently complete. For interactive
// feedback the user can still open the task pane.

import { alignHeights } from '../core/operations/alignHeights.js';
import { alignWidths } from '../core/operations/alignWidths.js';
import { packDown, packLeft, packRight, packUp } from '../core/operations/pack.js';
import { swapPositions } from '../core/operations/swap.js';
import { LastSelectedResolver } from '../core/resolvers/lastSelected.js';
import type { OperationResult, Shape } from '../core/types.js';
import { applyShapes, getSelectedShapes } from '../office/selection.js';

type Op = (shapes: readonly Shape[]) => OperationResult;

async function runFromRibbon(op: Op, event: Office.AddinCommands.Event): Promise<void> {
  try {
    const shapes = await getSelectedShapes();
    const result = op(shapes);
    if (result.ok) {
      await applyShapes(result.shapes);
    } else {
      console.warn('ppt-tools ribbon command rejected:', result.reason);
    }
  } catch (err) {
    console.error('ppt-tools ribbon command failed:', err);
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
