/**
 * Extension popup UI controller.
 * Handles recording toggle switch and status indicator updates.
 */

document.addEventListener('DOMContentLoaded', async () => {
  const toggleRecording = document.getElementById('toggleRecording');
  const statusBadge = document.getElementById('statusBadge');
  const userKeyDisplay = document.getElementById('userKeyDisplay');
  const copyKeyBtn = document.getElementById('copyKeyBtn');
  const restoreKeyInput = document.getElementById('restoreKeyInput');
  const restoreKeyBtn = document.getElementById('restoreKeyBtn');

  // Load current recording state & userKey from storage
  const { recording, userKey } = await chrome.storage.local.get(['recording', 'userKey']);
  const isRecording = recording !== false; // Default true

  toggleRecording.checked = isRecording;
  updateStatusUI(isRecording);

  if (userKey) {
    userKeyDisplay.textContent = userKey;
  } else {
    userKeyDisplay.textContent = 'Generating...';
  }

  // Listen for toggle switch changes
  toggleRecording.addEventListener('change', async (e) => {
    const active = e.target.checked;
    await chrome.storage.local.set({ recording: active });
    updateStatusUI(active);
  });

  // Copy User Sync Key to Clipboard
  copyKeyBtn.addEventListener('click', () => {
    const currentKey = userKeyDisplay.textContent;
    if (currentKey && currentKey !== 'Loading...' && currentKey !== 'Generating...') {
      navigator.clipboard.writeText(currentKey);
      copyKeyBtn.textContent = 'Copied!';
      setTimeout(() => { copyKeyBtn.textContent = 'Copy'; }, 1500);
    }
  });

  // Restore Existing User Sync Key
  restoreKeyBtn.addEventListener('click', async () => {
    const newKey = restoreKeyInput.value.trim();
    if (!newKey) return;

    await chrome.storage.local.set({ userKey: newKey });
    try {
      if (chrome.storage.sync) {
        await chrome.storage.sync.set({ userKey: newKey });
      }
    } catch (e) {}

    userKeyDisplay.textContent = newKey;
    restoreKeyInput.value = '';
    restoreKeyBtn.textContent = 'Restored!';
    setTimeout(() => { restoreKeyBtn.textContent = 'Restore'; }, 1500);
  });

  function updateStatusUI(active) {
    if (active) {
      statusBadge.textContent = 'Active';
      statusBadge.className = 'status-badge status-active';
    } else {
      statusBadge.textContent = 'Paused';
      statusBadge.className = 'status-badge status-paused';
    }
  }
});
