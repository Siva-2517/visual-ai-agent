/**
 * Client-side PII Redactor.
 * Inspects active DOM elements and applies solid black redaction blocks over 
 * password fields, credit card inputs, and sensitive input fields on a Canvas element
 * before data leaves the browser.
 */

// Selectors identifying sensitive input fields
const SENSITIVE_INPUT_SELECTORS = [
  'input[type="password"]',
  'input[type="cardnumber"]',
  'input[autocomplete^="cc-"]',
  'input[name*="cvv" i]',
  'input[name*="ssn" i]',
  'input[name*="card" i]',
  'input[name*="password" i]',
  '.pii-sensitive',
  '[data-pii="true"]'
];

/**
 * Redacts sensitive fields directly on a Canvas rendering context based on element bounding boxes.
 * @param {HTMLCanvasElement} canvas 
 * @param {Array<{x: number, y: number, width: number, height: number}>} sensitiveBoxes 
 * @returns {HTMLCanvasElement} Redacted canvas
 */
export function applyRedactionToCanvas(canvas, sensitiveBoxes = []) {
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000000'; // Solid black blackout mask

  for (const box of sensitiveBoxes) {
    // Add small padding around input box to ensure total coverage
    const padding = 4;
    const x = Math.max(0, box.x - padding);
    const y = Math.max(0, box.y - padding);
    const width = box.width + (padding * 2);
    const height = box.height + (padding * 2);

    ctx.fillRect(x, y, width, height);

    // Draw warning text over redacted block
    ctx.fillStyle = '#FF4444';
    ctx.font = '10px sans-serif';
    ctx.fillText('[REDACTED PII]', x + 2, y + Math.min(height - 2, 12));
    ctx.fillStyle = '#000000';
  }

  return canvas;
}

/**
 * Content script helper function to extract bounding boxes of sensitive elements on page.
 * Executed in tab context.
 * @returns {Array<{x: number, y: number, width: number, height: number}>}
 */
export function getSensitiveElementBoxes() {
  const selectorString = SENSITIVE_INPUT_SELECTORS.join(', ');
  const elements = document.querySelectorAll(selectorString);
  const boxes = [];

  elements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      boxes.push({
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height
      });
    }
  });

  return boxes;
}
