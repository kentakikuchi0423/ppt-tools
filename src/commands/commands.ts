// FunctionFile entry for the V1.0 manifest fallback path. On hosts that
// don't support VersionOverridesV1_1 (no shared runtime), this file is
// loaded fresh on every ribbon-button click. Action handlers live in the
// shared registerRibbonActions() so the same code services both fallback
// and shared-runtime hosts.

import { registerRibbonActions } from '../office/actions.js';

void Office.onReady(() => {
  registerRibbonActions();
});
