# Chrome Extension Icon Assets 🎨

This directory contains the visual icon assets for the **Visual AI Browser Activity Agent** Chrome Extension (Manifest V3).

---

## 📐 Icon Asset Specifications

| File Name | Resolution | Format | Used For |
|---|---|---|---|
| `icon16.png` | 16x16 px | PNG | Chrome Toolbar Favicon & Action Icon |
| `icon32.png` | 32x32 px | PNG | High-DPI (Retina) Windows / Mac Toolbar Icon |
| `icon48.png` | 48x48 px | PNG | Extension Management Page (`chrome://extensions`) |
| `icon128.png` | 128x128 px | PNG | Chrome Web Store Storefront & Installation Prompt |
| `icon512.png` | 512x512 px | PNG | High-Resolution Marketing & Promo Graphic |
| `icon.svg` | Vector | SVG | Master Source Vector Graphic |

---

## ⚙️ Manifest V3 Integration

To register these icons in your extension `manifest.json`, declare them in both the global `icons` object and the `action.default_icon` object:

```json
{
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "action": {
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    },
    "default_popup": "src/popup/popup.html",
    "default_title": "Visual AI Activity Agent"
  }
}
```

---

## 🎨 Modifying or Regenerating Icons

If you modify `icon.svg` and need to regenerate PNG assets:

### Using ImageMagick (CLI):
```bash
magick convert -background none -resize 16x16 icon.svg icon16.png
magick convert -background none -resize 32x32 icon.svg icon32.png
magick convert -background none -resize 48x48 icon.svg icon48.png
magick convert -background none -resize 128x128 icon.svg icon128.png
magick convert -background none -resize 512x512 icon.svg icon512.png
```

### Design Guidelines:
- **Background:** Transparent or dark navy circle matching `#0a0e1a`.
- **Primary Color:** Indigo gradient (`#6366f1` → `#8b5cf6`).
- **Contrast:** High-visibility central eye/camera aperture symbol.
