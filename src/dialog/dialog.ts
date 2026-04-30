import './dialog.css';

const POPUP_CHANNEL = 'ppt-tools-dialog';
const POPUP_STORAGE_KEY = 'pptToolsLatestPopupId';

const params = new URLSearchParams(window.location.search);
const myId = params.get('id') ?? '';

const messageEl = document.getElementById('message');
if (messageEl) {
  messageEl.textContent = params.get('msg') ?? '';
}

function selfClose(): void {
  // The dialog is opened by commands.ts via displayDialogAsync, which
  // listens for messageParent and calls dialog.close() on receipt.
  Office.context.ui.messageParent('close');
}

// Fallback signal: poll localStorage every 250 ms in case
// BroadcastChannel isn't supported in this dialog runtime.
const pollIntervalId = window.setInterval(() => {
  let latest: string | null = null;
  try {
    latest = localStorage.getItem(POPUP_STORAGE_KEY);
  } catch {
    // localStorage may be blocked; nothing else to fall back to.
  }
  if (latest && latest !== myId) {
    clearInterval(pollIntervalId);
    selfClose();
  }
}, 250);

// Primary signal: newer popups broadcast over BroadcastChannel. If the
// new id differs from ours, this dialog is stale — close itself so the
// new dialog can take its place.
try {
  const channel = new BroadcastChannel(POPUP_CHANNEL);
  channel.addEventListener('message', (event: MessageEvent) => {
    const data = event.data as { type?: string; id?: string } | null;
    if (data?.type === 'newPopup' && data.id && data.id !== myId) {
      clearInterval(pollIntervalId);
      selfClose();
    }
  });
} catch {
  // BroadcastChannel unavailable; the localStorage poll above covers us.
}

const closeBtn = document.getElementById('close');
if (closeBtn instanceof HTMLButtonElement) {
  closeBtn.addEventListener('click', () => {
    clearInterval(pollIntervalId);
    selfClose();
  });
}
