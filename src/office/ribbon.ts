// Updates the enabled/disabled state of the ppt-tools ribbon controls in
// response to selection changes, so the user can tell at a glance which
// operations make sense for the current selection.
//
// IDs match the V1.1 manifest section (modern PowerPoint Microsoft 365
// hosts use V1.1 with shared runtime). On a V1.0-only host the
// RibbonApi 1.1 requirement set isn't supported anyway, so the no-op
// path covers it.

const TAB_ID = 'TabHome';
const GROUP_ID = 'PptTools.V11.MainGroup';

const CONTROL_IDS = [
  'PptTools.V11.PackDown',
  'PptTools.V11.PackUp',
  'PptTools.V11.PackLeft',
  'PptTools.V11.PackRight',
  'PptTools.V11.AlignMenu',
  'PptTools.V11.SwapPositions',
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
