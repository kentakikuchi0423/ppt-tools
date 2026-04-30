// Updates the enabled/disabled state of the ppt-tools ribbon controls in
// response to selection changes, so the user can tell at a glance which
// operations make sense for the current selection.
//
// IDs are shared between the V1.0 fallback and the V1.1 shared-runtime
// blocks of manifest.xml. Whichever block the host accepts, the same ID
// is what's actually rendered, so a single requestUpdate covers both
// paths.

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

let warnedNoRibbonApi = false;

function ribbonApiSupported(): boolean {
  try {
    return Office.context.requirements.isSetSupported('RibbonApi', '1.1');
  } catch {
    return false;
  }
}

export async function setRibbonEnabled(enabled: boolean): Promise<void> {
  if (typeof Office === 'undefined') return;

  if (!ribbonApiSupported()) {
    if (!warnedNoRibbonApi) {
      warnedNoRibbonApi = true;
      console.warn(
        '[ppt-tools] RibbonApi 1.1 not supported in this Office host — ribbon controls will not grey out.',
      );
    }
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
  } catch (err) {
    console.error('[ppt-tools] Office.ribbon.requestUpdate failed:', err);
  }
}
