// Shared signaling between src/office/actions.ts (publisher) and
// src/dialog/dialog.ts (subscriber): when the user clicks a ribbon
// button while a previous error popup is still open, actions.ts
// broadcasts a fresh popup id and the older dialog closes itself.
//
// BroadcastChannel is the primary signal; localStorage is a fallback
// for hosts where the dialog runtime doesn't expose BroadcastChannel.

export const POPUP_CHANNEL = 'ppt-tools-dialog';
export const POPUP_STORAGE_KEY = 'pptToolsLatestPopupId';
