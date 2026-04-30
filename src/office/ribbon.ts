// Updates the enabled/disabled state of the ppt-tools ribbon controls in
// response to selection changes, so the user can tell at a glance which
// operations make sense for the current selection.
//
// Office.ribbon.requestUpdate is available on PowerPoint Microsoft 365
// builds and is missing in older hosts; the helper degrades silently if
// the API isn't there.

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

export async function setRibbonEnabled(enabled: boolean): Promise<void> {
  if (typeof Office === 'undefined') return;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const ribbon = Office.ribbon as typeof Office.ribbon | undefined;
  if (!ribbon || typeof ribbon.requestUpdate !== 'function') return;
  try {
    await ribbon.requestUpdate({
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
    console.warn('ppt-tools: failed to update ribbon state:', err);
  }
}
