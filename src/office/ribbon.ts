// Updates the enabled/disabled state of the ppt-tools ribbon controls in
// response to selection changes, so the user can tell at a glance which
// operations make sense for the current selection.

const TAB_ID = 'TabHome';
const GROUP_ID = 'PptTools.MainGroup';

const CONTROL_IDS = [
  'PptTools.PackDown',
  'PptTools.PackUp',
  'PptTools.PackLeft',
  'PptTools.PackRight',
  'PptTools.AlignMenu',
  'PptTools.SwapPositions',
] as const;

export type RibbonStatus =
  | { kind: 'pending' }
  | { kind: 'unsupported' }
  | { kind: 'ok' }
  | { kind: 'error'; message: string };

let lastStatus: RibbonStatus = { kind: 'pending' };
const listeners = new Set<(status: RibbonStatus) => void>();

function setStatus(next: RibbonStatus): void {
  lastStatus = next;
  for (const listener of listeners) listener(next);
}

export function getRibbonStatus(): RibbonStatus {
  return lastStatus;
}

export function onRibbonStatusChange(listener: (status: RibbonStatus) => void): () => void {
  listeners.add(listener);
  listener(lastStatus);
  return () => listeners.delete(listener);
}

function ribbonApiSupported(): boolean {
  try {
    return Office.context.requirements.isSetSupported('RibbonApi', '1.1');
  } catch {
    return false;
  }
}

export async function setRibbonEnabled(enabled: boolean): Promise<void> {
  if (typeof Office === 'undefined') {
    setStatus({ kind: 'error', message: 'Office not available' });
    return;
  }

  if (!ribbonApiSupported()) {
    setStatus({ kind: 'unsupported' });
    return;
  }

  try {
    await Office.ribbon.requestUpdate({
      tabs: [
        {
          id: TAB_ID,
          groups: [
            {
              id: GROUP_ID,
              controls: CONTROL_IDS.map((id) => ({ id, enabled })),
            },
          ],
        },
      ],
    });
    setStatus({ kind: 'ok' });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[ppt-tools] Office.ribbon.requestUpdate failed:', err);
    setStatus({ kind: 'error', message });
  }
}
