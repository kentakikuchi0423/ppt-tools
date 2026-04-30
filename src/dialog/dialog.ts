import './dialog.css';

const params = new URLSearchParams(window.location.search);
const messageEl = document.getElementById('message');
if (messageEl) {
  messageEl.textContent = params.get('msg') ?? '';
}

const closeBtn = document.getElementById('close');
if (closeBtn instanceof HTMLButtonElement) {
  closeBtn.addEventListener('click', () => {
    // The dialog is opened by commands.ts via displayDialogAsync, which
    // listens for messageParent and calls dialog.close() on receipt.
    // Office's dialog runs in an isolated window so window.close() does
    // not reliably close it from the dialog itself.
    Office.context.ui.messageParent('close');
  });
}
