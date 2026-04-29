import type { ReferenceShapeResolver, Shape } from '../types.js';

// V2 fallback: the user explicitly saves a reference shape (its id is
// persisted by the office layer). On each align operation, we match that id
// against the current selection. If the saved reference isn't in the current
// selection, resolve returns undefined and the operation fails cleanly.

export class StoredReferenceResolver implements ReferenceShapeResolver {
  constructor(private readonly referenceId: string) {}

  resolve(shapes: readonly Shape[]): Shape | undefined {
    return shapes.find((s) => s.id === this.referenceId);
  }
}
