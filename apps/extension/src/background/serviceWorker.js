/**
 * Manifest V3 Ephemeral Service Worker.
 * Handles tab events, DOM mutation signals, chrome.alarms periodic triggers,
 * and posts redacted payloads to the FastAPI backend.
 */

const DEFAULT_BACKEND_URL = 'http://localhost:8000/api/v1/activity/ingest';
const DEFAULT_API_KEY = 'dev_api_key_visual_agent_2026_abc123def456ghi789jkl012mno345pqr';

async function getBackendConfig() {
  const { backendUrl, apiKey } = await chrome.storage.local.get(['backendUrl', 'apiKey']);
  return {
    backendUrl: backendUrl || DEFAULT_BACKEND_URL,
    apiKey: apiKey || DEFAULT_API_KEY,
  };
}

// Helper to retrieve or auto-generate persistent User Sync Key
async function getUserKey() {
  const { userKey } = await chrome.storage.local.get(['userKey']);
  if (userKey) return userKey;

  // Generate new Sync Key
  const generatedKey = 'usr_' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : Math.random().toString(36).substring(2) + Date.now().toString(36));
  await chrome.storage.local.set({ userKey: generatedKey });
  try {
    if (chrome.storage.sync) {
      await chrome.storage.sync.set({ userKey: generatedKey });
    }
  } catch (e) {
    // Sync storage fallback
  }
  return generatedKey;
}

// Initialize extension state and alarms on startup
chrome.runtime.onInstalled.addListener(async () => {
  const userKey = await getUserKey();
  chrome.storage.local.set({
    recording: true,
    userKey: userKey,
    excludedDomains: ['bank.com', 'login.gov'],
    buffer: []
  });

  // Create periodic alarm every 5 minutes as session check trigger
  chrome.alarms.create('periodicCapture', { periodInMinutes: 5 });
  console.log('[ServiceWorker] Visual AI Extension Installed with User Key:', userKey);
});

// Periodic Alarm Handler
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'periodicCapture') {
    const { recording } = await chrome.storage.local.get(['recording']);
    if (recording) {
      await processActiveTabCapture('periodic_alarm');
    }
  }
});

// Navigation & Tab Focus Listeners
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const { recording } = await chrome.storage.local.get(['recording']);
  if (recording) {
    await processActiveTabCapture('tab_switch', activeInfo.tabId);
  }
});

chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId === 0) { // Main frame only
    const { recording } = await chrome.storage.local.get(['recording']);
    if (recording) {
      await processActiveTabCapture('page_visit', details.tabId);
    }
  }
});

function dataURItoBlob(dataURI) {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

/**
 * Captures, redacts, and sends tab activity to backend API.
 */
async function processActiveTabCapture(eventType, targetTabId = null) {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab || !activeTab.url || activeTab.url.startsWith('chrome://')) return;

    const url = new URL(activeTab.url);
    const domain = url.hostname;

    // Check exclusion list
    const { excludedDomains } = await chrome.storage.local.get(['excludedDomains']);
    if (excludedDomains && excludedDomains.includes(domain)) {
      console.log(`[ServiceWorker] Skipping excluded domain: ${domain}`);
      return;
    }

    const userKey = await getUserKey();

    // Ask content script for PII element bounding boxes
    let piiBoxes = [];
    try {
      const response = await chrome.tabs.sendMessage(activeTab.id, { action: 'GET_PII_BOXES' });
      if (response && response.boxes) {
        piiBoxes = response.boxes;
      }
    } catch (e) {
      // Content script might not be injected on this page
    }

    // Request visible tab capture via Data URL
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, async (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) return;

      // Send payload to FastAPI backend
      const formData = new FormData();
      formData.append('url', activeTab.url);
      formData.append('domain', domain);
      formData.append('page_title', activeTab.title || '');
      formData.append('tab_id', String(activeTab.id));
      formData.append('event_type', eventType);
      formData.append('user_key', userKey);
      formData.append('timestamp', new Date().toISOString());

      // Convert Data URL to Blob for upload
      const blob = dataURItoBlob(dataUrl);
      formData.append('screenshot', blob, 'capture.png');

      try {
        const { backendUrl, apiKey } = await getBackendConfig();
        const response = await fetch(backendUrl, {
          method: 'POST',
          headers: {
            'X-API-Key': apiKey,
            'X-User-Key': userKey
          },
          body: formData
        });

        if (response.ok) {
          console.log(`[ServiceWorker] Event ingested successfully: ${eventType} (${domain}) [Key: ${userKey}]`);
        } else {
          console.warn(`[ServiceWorker] Ingestion API returned error: ${response.status}`);
        }
      } catch (err) {
        console.error('[ServiceWorker] Failed to post activity event:', err);
      }
    });
  } catch (err) {
    console.error('[ServiceWorker] Error in processActiveTabCapture:', err);
  }
}
