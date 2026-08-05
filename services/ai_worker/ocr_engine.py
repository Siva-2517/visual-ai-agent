"""
Tier 1 AI Engine — EasyOCR text extraction layer.
Model is initialized lazily and safely to avoid startup crashes.
"""
import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

import numpy as np

_ocr_reader = None
_ocr_init_failed = False


def _get_ocr_reader():
    """Lazily initializes EasyOCR reader instance safely."""
    global _ocr_reader, _ocr_init_failed
    if _ocr_reader is not None:
        return _ocr_reader
    if _ocr_init_failed:
        return None

    try:
        import easyocr
        print("[OCR] Initializing EasyOCR model...")
        _ocr_reader = easyocr.Reader(['en'], gpu=False, download_enabled=True)
        print("[OCR] EasyOCR model loaded successfully.")
        return _ocr_reader
    except Exception as e:
        print(f"[OCR WARN] EasyOCR initialization deferred/failed: {e}")
        _ocr_init_failed = True
        return None


def extract_text_from_image(image_path: str) -> dict:
    """
    Extracts text and bounding boxes from an image file using EasyOCR.
    @param image_path Relative or absolute path to image file.
    @returns dict {extracted_text: str, confidence: float, word_count: int}
    """
    if not image_path or not os.path.exists(image_path):
        return {"extracted_text": "", "confidence": 0.0, "word_count": 0}

    reader = _get_ocr_reader()
    if reader is None:
        return {"extracted_text": "", "confidence": 0.0, "word_count": 0}

    try:
        results = reader.readtext(image_path)

        extracted_words = []
        confidences = []

        for (bbox, text, prob) in results:
            if text and text.strip():
                extracted_words.append(text.strip())
                confidences.append(prob)

        full_text = " ".join(extracted_words)
        avg_confidence = float(np.mean(confidences)) if confidences else 0.0

        return {
            "extracted_text": full_text,
            "confidence": round(avg_confidence, 2),
            "word_count": len(extracted_words)
        }
    except Exception as e:
        print(f"[OCR ERROR] Failed to extract text from {image_path}: {e}")
        return {"extracted_text": "", "confidence": 0.0, "word_count": 0}
