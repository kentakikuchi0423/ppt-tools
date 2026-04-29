/**
 * Plain shape value type used by the pure core layer.
 * Adapters in src/office/ map Office.js shapes to/from this type.
 * Coordinates and sizes are in points (the unit Office.js uses for shape geometry).
 */
export interface Shape {
  readonly id: string;
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

/**
 * Strategy for picking the "reference" shape used by alignment operations.
 * V1 implementation: last selected. V2 fallback: stored reference shape ID.
 * See REQUIREMENTS.md FR-5 and CLAUDE.md "Reference-shape resolver pattern".
 */
export interface ReferenceShapeResolver {
  resolve(shapes: readonly Shape[]): Shape | undefined;
}

/**
 * Result type for operations that can fail due to invalid selection state
 * (e.g., swap requires exactly 2 shapes; align-heights requires >= 2).
 */
export type OperationResult =
  | { readonly ok: true; readonly shapes: readonly Shape[] }
  | { readonly ok: false; readonly reason: string };
