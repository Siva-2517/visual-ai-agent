"""
Tier 2 AI Engine — Vision-Language Model (VLM) Escalation layer.
Uses Google Gemini 2.5 Flash (Primary, Free) with automatic failover to Groq Llama Vision (Fallback, Free).
"""
import os
import sys

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

import json
from typing import Optional, Dict, Any
from PIL import Image

from apps.backend.config import settings

# Structured JSON prompt template
PROMPT_TEMPLATE = """
Analyze this browser screenshot and extracted text to understand what the user is doing.

Extracted On-Screen Text:
"{ocr_text}"

Page Title: "{page_title}"
URL: "{url}"

Provide a structured JSON response with EXACTLY these keys:
{{
  "summary": "A concise 1-sentence description of what the user is looking at or doing (e.g. 'Comparing flight prices on Kayak')",
  "action_type": "One of: browsing, searching, shopping, coding, reading, form_filling, video_watching, messaging, other",
  "category": "One of: Productivity, Development, Entertainment, Shopping, Social, Travel, Finance, News, Education, Other",
  "ui_elements": ["list of prominent detected UI components, e.g. search_bar, price_list, login_form"],
  "confidence": 0.9
}}

Return ONLY valid raw JSON. No markdown code blocks.
"""


def analyze_with_gemini(image_path: str, ocr_text: str, page_title: str, url: str) -> Optional[Dict[str, Any]]:
    """Primary VLM call via Google Gemini 2.5 Flash API."""
    if not settings.GEMINI_API_KEY:
        print("[VLM] GEMINI_API_KEY not set. Skipping Gemini call.")
        return None

    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)

        model = genai.GenerativeModel("gemini-2.5-flash")
        img = Image.open(image_path)

        prompt = PROMPT_TEMPLATE.format(ocr_text=ocr_text, page_title=page_title, url=url)
        response = model.generate_content([prompt, img])

        if response and response.text:
            cleaned_text = response.text.strip().removeprefix("```json").removesuffix("```").strip()
            return json.loads(cleaned_text)
    except Exception as e:
        print(f"[VLM WARN] Gemini call failed: {e}. Attempting failover...")
        return None


def analyze_with_groq(image_path: str, ocr_text: str, page_title: str, url: str) -> Optional[Dict[str, Any]]:
    """Fallback VLM call via Groq Llama 3.3 API."""
    if not settings.GROQ_API_KEY:
        print("[VLM] GROQ_API_KEY not set. Skipping Groq fallback.")
        return None

    try:
        from groq import Groq

        client = Groq(api_key=settings.GROQ_API_KEY)
        prompt = PROMPT_TEMPLATE.format(ocr_text=ocr_text, page_title=page_title, url=url)

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"}
        )

        content = response.choices[0].message.content
        if content:
            return json.loads(content)
    except Exception as e:
        print(f"[VLM ERROR] Groq fallback failed: {e}")
        return None


def analyze_screen_content(
    image_path: Optional[str],
    ocr_text: str,
    page_title: str,
    url: str,
    domain: str
) -> Dict[str, Any]:
    """
    Orchestrates Tier 2 VLM analysis with dual-provider failover.
    Fallback to heuristic summary if no API keys are provided or both calls fail.
    """
    if image_path and os.path.exists(image_path):
        # 1. Try Gemini 2.5 Flash Primary
        result = analyze_with_gemini(image_path, ocr_text, page_title, url)
        if result:
            print(f"[VLM SUCCESS] Gemini summary generated for {domain}")
            return result

        # 2. Try Groq Llama Vision Fallback
        result = analyze_with_groq(image_path, ocr_text, page_title, url)
        if result:
            print(f"[VLM SUCCESS] Groq summary generated for {domain}")
            return result

    # 3. Heuristic fallback when no VLM keys are active
    print(f"[VLM FALLBACK] Using heuristic summary for {domain}")
    snippet = ocr_text[:120] if ocr_text else page_title or domain
    return {
        "summary": f"Browsing {domain}: {snippet}",
        "action_type": "browsing",
        "category": categorize_domain(domain),
        "ui_elements": [],
        "confidence": 0.6
    }


def categorize_domain(domain: str) -> str:
    """Basic domain categorizer for fallback mode."""
    domain_lower = domain.lower()
    if any(k in domain_lower for k in ['github', 'gitlab', 'stackoverflow', 'localhost', 'dev']):
        return 'Development'
    if any(k in domain_lower for k in ['youtube', 'netflix', 'spotify', 'twitch']):
        return 'Entertainment'
    if any(k in domain_lower for k in ['amazon', 'ebay', 'shopping', 'store']):
        return 'Shopping'
    if any(k in domain_lower for k in ['twitter', 'x.com', 'linkedin', 'facebook', 'reddit']):
        return 'Social'
    if any(k in domain_lower for k in ['google', 'wikipedia', 'arxiv', 'docs']):
        return 'Research'
    return 'Productivity'
