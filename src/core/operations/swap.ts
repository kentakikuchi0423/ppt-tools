import type { OperationResult, Shape } from '../types.js';

// FR-6: swap the `left` and `top` of exactly two shapes. Sizes (`width`,
// `height`) and `id` are preserved. Any selection count other than 2 is a
// no-op.

export function swapPositions(shapes: readonly Shape[]): OperationResult {
  if (shapes.length !== 2) {
    return { ok: false, reason: 'Select exactly 2 shapes to swap positions.' };
  }
  const [a, b] = shapes;
  if (!a || !b) {
    return { ok: false, reason: 'Select exactly 2 shapes to swap positions.' };
  }
  return {
    ok: true,
    shapes: [
      { ...a, left: b.left, top: b.top },
      { ...b, left: a.left, top: a.top },
    ],
  };
}
