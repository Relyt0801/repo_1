# Stitch Studio — Landing Page

Eine moderne, responsive Landing-Page, gebaut mit semantischem HTML, Tailwind (CDN)
und einer Prise Vanilla-JS.

## Lokal ansehen

```bash
# Im Repo-Root:
python3 -m http.server 8000
# dann http://localhost:8000 öffnen
```

## Stack

- HTML5 (semantisch, a11y-first)
- Tailwind CSS via CDN
- Google Fonts: Space Grotesk (Display) + DM Sans (Body)
- Vanilla JavaScript (Mobile-Menü, Scroll-Reveal)

## Design-System

Generiert mit dem `ui-ux-pro-max`-Skill:

- **Pattern:** Bento Grid Showcase
- **Style:** Social Proof-Focused
- **Farben:** Sky Blue (Trust) + Orange CTA (Warm)
- **Typo:** Space Grotesk + DM Sans

## Struktur

- `index.html` — gesamte Page (Hero, Bento-Features, Showcase, Testimonials, Pricing, CTA, Footer)
- `styles.css` — Reduced-Motion, Focus-Ring, Text-Wrap, Reveal-Animation
- `script.js` — Mobile-Menü-Toggle, Scroll-Reveal mit IntersectionObserver
