import type { OperationResult, Shape } from '../types.js';

// FR-1〜FR-4: zero-gap packing along a single axis. The anchor (the shape
// whose coordinate stays fixed) is the shape closest to the named side:
//   packDown  → bottom-most stays, others move down to it
//   packUp    → top-most stays, others move up to it
//   packLeft  → left-most stays, others move left to it
//   packRight → right-most stays, others move right to it
// Other shapes are repositioned so they touch (zero gap, Q2 default).

const NEED_TWO_FOR_PACK = '詰めるには図形を 2 つ以上選択してください。';

type Axis = 'top' | 'left';
type Side = 'min' | 'max';

function place(s: Shape, axis: Axis, value: number): Shape {
  return axis === 'top' ? { ...s, top: value } : { ...s, left: value };
}

function size(s: Shape, axis: Axis): number {
  return axis === 'top' ? s.height : s.width;
}

function pack(shapes: readonly Shape[], axis: Axis, side: Side): OperationResult {
  if (shapes.length < 2) return { ok: false, reason: NEED_TWO_FOR_PACK };
  const dirSign = side === 'min' ? 1 : -1;
  const sorted = [...shapes].sort((a, b) => (a[axis] - b[axis]) * dirSign);
  const [anchor, ...rest] = sorted;
  if (!anchor) return { ok: false, reason: NEED_TWO_FOR_PACK };

  const result: Shape[] = [{ ...anchor }];
  let cursor = side === 'min' ? anchor[axis] + size(anchor, axis) : anchor[axis];
  for (const s of rest) {
    if (side === 'min') {
      result.push(place(s, axis, cursor));
      cursor += size(s, axis);
    } else {
      cursor -= size(s, axis);
      result.push(place(s, axis, cursor));
    }
  }
  if (side === 'max') result.reverse();
  return { ok: true, shapes: result };
}

export function packUp(shapes: readonly Shape[]): OperationResult {
  return pack(shapes, 'top', 'min');
}

export function packDown(shapes: readonly Shape[]): OperationResult {
  return pack(shapes, 'top', 'max');
}

export function packLeft(shapes: readonly Shape[]): OperationResult {
  return pack(shapes, 'left', 'min');
}

export function packRight(shapes: readonly Shape[]): OperationResult {
  return pack(shapes, 'left', 'max');
}
