/**
 * Content script injected into web pages.
 * Calculates sensitive PII bounding boxes on request for local redaction.
 */

// Listen for messages from background service worker
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'GET_PII_BOXES') {
    const sensitiveSelectors = [
      'input[type="password"]',
      'input[autocomplete^="cc-"]',
      'input[name*="cvv" i]',
      'input[name*="card" i]',
      'input[name*="password" i]',
      '.pii-sensitive'
    ];

    const boxes = [];
    const elements = document.querySelectorAll(sensitiveSelectors.join(', '));
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        boxes.push({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height
        });
      }
    });

    sendResponse({ boxes: boxes, pageTitle: document.title, url: window.location.href });
  }
  return true;
});
