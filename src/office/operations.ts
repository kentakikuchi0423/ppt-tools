// Single source of truth for the 7 ribbon/task-pane operations. Each entry
// pre-binds the resolver (where applicable) and ties the core op to its
// surface-specific identifiers:
//   - actionName: matches manifest <FunctionName> (Office.actions.associate)
//   - htmlId: matches the <button> id in taskpane.html
//
// Both src/office/actions.ts (ribbon path) and src/taskpane/taskpane.ts
// (task-pane path) iterate this list, so adding a new operation only
// requires updating this file plus the manifest XML and HTML.

import { alignHeights, alignWidths } from '../core/operations/align.js';
import { packDown, packLeft, packRight, packUp } from '../core/operations/pack.js';
import { swapPositions } from '../core/operations/swap.js';
import { LastSelectedResolver } from '../core/resolvers/lastSelected.js';
import type { Op } from '../core/types.js';

export interface OperationDef {
  readonly actionName: string;
  readonly htmlId: string;
  readonly run: Op;
}

export const OPERATIONS: readonly OperationDef[] = [
  { actionName: 'packDown', htmlId: 'pack-down', run: packDown },
  { actionName: 'packUp', htmlId: 'pack-up', run: packUp },
  { actionName: 'packLeft', htmlId: 'pack-left', run: packLeft },
  { actionName: 'packRight', htmlId: 'pack-right', run: packRight },
  {
    actionName: 'alignHeights',
    htmlId: 'align-heights',
    run: (s) => alignHeights(s, LastSelectedResolver),
  },
  {
    actionName: 'alignWidths',
    htmlId: 'align-widths',
    run: (s) => alignWidths(s, LastSelectedResolver),
  },
  { actionName: 'swapPositions', htmlId: 'swap-positions', run: swapPositions },
];
