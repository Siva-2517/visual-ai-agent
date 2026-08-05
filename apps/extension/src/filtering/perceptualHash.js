/**
 * Perceptual Hash (pHash) implementation for client-side visual frame deduplication.
 * Reduces raw image to 8x8 grayscale and computes a 64-bit fingerprint.
 */

/**
 * Computes a 64-character binary perceptual hash string from an Image or Canvas element.
 * @param {HTMLCanvasElement|HTMLImageElement} imageElement 
 * @returns {string} 64-bit binary hash string (e.g. "11001010...")
 */
export function computePerceptualHash(imageElement) {
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 8;
  const ctx = canvas.getContext('2d');
  
  // Draw scaled down 8x8 image
  ctx.drawImage(imageElement, 0, 0, 8, 8);
  const imageData = ctx.getImageData(0, 0, 8, 8);
  const pixels = imageData.data;

  // Convert to grayscale & compute average luminosity
  const grayscales = [];
  let totalLuminosity = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    // Standard perceptual luminance formula
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    grayscales.push(gray);
    totalLuminosity += gray;
  }

  const avgLuminosity = totalLuminosity / 64;

  // Build binary hash: 1 if pixel >= average, 0 if pixel < average
  let hashString = '';
  for (let i = 0; i < grayscales.length; i++) {
    hashString += grayscales[i] >= avgLuminosity ? '1' : '0';
  }

  return hashString;
}

/**
 * Computes the Hamming Distance between two 64-bit binary hash strings.
 * @param {string} hash1 
 * @param {string} hash2 
 * @returns {number} Distance (number of differing bits, 0 to 64)
 */
export function computeHammingDistance(hash1, hash2) {
  if (!hash1 || !hash2 || hash1.length !== hash2.length) return 64;
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      distance++;
    }
  }
  return distance;
}

/**
 * Checks if a newly captured frame is significantly different from the previous frame.
 * @param {string} newHash 
 * @param {string} previousHash 
 * @param {number} distanceThreshold Default threshold is 5 bits difference out of 64
 * @returns {boolean} True if frame is significantly different, false if duplicate
 */
export function isSignificantVisualChange(newHash, previousHash, distanceThreshold = 5) {
  if (!previousHash) return true;
  const distance = computeHammingDistance(newHash, previousHash);
  return distance >= distanceThreshold;
}
