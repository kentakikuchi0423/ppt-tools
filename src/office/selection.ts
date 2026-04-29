import type { Shape } from '../core/types.js';

// Office.js adapter. The only file in the codebase that calls PowerPoint.run.
// Everything else operates on plain Shape values.

function assertPowerPoint(): void {
  if (typeof PowerPoint === 'undefined') {
    throw new Error('PowerPoint is not available. ppt-tools must run inside PowerPoint.');
  }
}

export async function getSelectedShapes(): Promise<Shape[]> {
  assertPowerPoint();
  return PowerPoint.run(async (context) => {
    const selected = context.presentation.getSelectedShapes();
    selected.load('items/id,items/left,items/top,items/width,items/height');
    await context.sync();
    return selected.items.map<Shape>((s) => ({
      id: s.id,
      left: s.left,
      top: s.top,
      width: s.width,
      height: s.height,
    }));
  });
}

// Writes the geometry from `updates` back to the current selection. Matches
// shapes by id so that the user's intent ("apply to the shapes I just had
// selected") survives small selection drift between read and write. The
// whole batch is wrapped in a single PowerPoint.run so PowerPoint's Undo
// stack treats the operation as a single step.
export async function applyShapes(updates: readonly Shape[]): Promise<void> {
  if (updates.length === 0) return;
  assertPowerPoint();
  await PowerPoint.run(async (context) => {
    const selected = context.presentation.getSelectedShapes();
    selected.load('items/id');
    await context.sync();
    const byId = new Map<string, Shape>(updates.map((s) => [s.id, s]));
    for (const shape of selected.items) {
      const u = byId.get(shape.id);
      if (!u) continue;
      shape.left = u.left;
      shape.top = u.top;
      shape.width = u.width;
      shape.height = u.height;
    }
    await context.sync();
  });
}
