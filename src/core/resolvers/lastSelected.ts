import type { ReferenceShapeResolver, Shape } from '../types.js';

// V1 default: the last shape in the input order is the reference. Office.js
// returns selected shapes in the order they were selected, so this picks
// whichever shape the user clicked last.

export const LastSelectedResolver: ReferenceShapeResolver = {
  resolve(shapes: readonly Shape[]): Shape | undefined {
    return shapes.length === 0 ? undefined : shapes[shapes.length - 1];
  },
};
