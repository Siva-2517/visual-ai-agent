/**
 * Screen capture module using Manifest V3 APIs.
 * Captures active tab visible content, applies canvas PII redaction, and computes pHash.
 */

import { computePerceptualHash, isSignificantVisualChange } from '../filtering/perceptualHash.js';
import { applyRedactionToCanvas } from '../redaction/piiRedactor.js';

/**
 * Captures the currently active tab visible area as a redacted Data URL.
 * @param {number} tabId 
 * @param {Array} piiBoxes Sensitive input bounding boxes to redact
 * @returns {Promise<{dataUrl: string, pHash: string, isNew: boolean}>}
 */
export async function captureAndRedactTab(tabId, piiBoxes = []) {
  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, async (dataUrl) => {
      if (chrome.runtime.lastError || !dataUrl) {
        return reject(chrome.runtime.lastError?.message || 'Capture failed');
      }

      try {
        // Load raw capture into HTML Image element
        const img = new Image();
        img.src = dataUrl;
        await img.decode();

        // Create Canvas and draw original capture
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // Apply PII redaction blocks if any sensitive inputs detected
        if (piiBoxes && piiBoxes.length > 0) {
          applyRedactionToCanvas(canvas, piiBoxes);
        }

        // Compute 64-bit perceptual hash on the redacted image
        const pHash = computePerceptualHash(canvas);

        // Convert canvas to WebP base64 Data URL (smaller size)
        const redactedDataUrl = canvas.toDataURL('image/webp', 0.8);

        // Get last saved pHash from storage to check visual difference
        const storageData = await chrome.storage.local.get([`last_phash_${tabId}`]);
        const lastHash = storageData[`last_phash_${tabId}`];
        const isNew = isSignificantVisualChange(pHash, lastHash, 5);

        if (isNew) {
          await chrome.storage.local.set({ [`last_phash_${tabId}`]: pHash });
        }

        resolve({
          dataUrl: redactedDataUrl,
          pHash: pHash,
          isNew: isNew
        });
      } catch (err) {
        reject(err);
      }
    });
  });
}
