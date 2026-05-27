#!/usr/bin/env node
'use strict';

const PptxGenJS = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

// ─── DESIGN SYSTEM: AMBER-ANCIENT DARK ───────────────────────────────────────
//
// Visual philosophy: "Proxima"-style dark tech UI physics (volumetric radial
// glows, grid overlay, floating glass-morphism cards) translated into a warm
// amber/terracotta palette evoking antiquity, parchment and firelight.
//
// Slide canvas: 13.333 × 7.500 inches (LAYOUT_WIDE, 16:9)
// 96 px/inch convention used inside all SVG generators.
//
// ── COLOR TOKENS ─────────────────────────────────────────────────────────────
//
//  BACKGROUNDS
//  bg.base          #0E0A06  Near-black warm black – base slide fill
//  bg.midDark       #1A1108  Mid-dark warm charcoal – secondary zones
//  bg.surface       #231709  Slightly lifted surface, used for card backs
//
//  VOLUMETRIC GLOW
//  glow.amber       #C8720A  Primary radial glow – amber/gold sun
//  glow.ember       #7A2C0C  Secondary glow – deep terracotta ember
//  glow.highlight   #E8A034  Inner bright hotspot of amber glow
//
//  CARDS (glass-morphism dark)
//  card.bg          #2A1C0E  Dark amber-brown card body
//  card.bgAlt       #1E1409  Slightly darker card variant
//  card.border      #8B5E1A  Amber border, kept low-key
//  card.borderBright#C8872A  Highlighted border for hero cards
//
//  TEXT
//  text.primary     #F2E4C8  Warm white / parchment – main headings
//  text.secondary   #BFA882  Muted parchment – body copy
//  text.muted       #7D5F3A  De-emphasized annotations
//  text.gold        #D9A441  Bright gold – accent labels / highlights
//  text.amber       #C8720A  Mid-amber – sub-headings, dates
//
//  GRID
//  grid.line        #3D2A10  Very subtle amber grid lines (≈ 8 % opacity feel)
//
//  BADGES / PILLS
//  badge.bg         #3D220A  Dark amber pill background
//  badge.border     #C8720A  Amber pill border
//  badge.text       #F2C96D  Pale gold pill text
//
//  ACCENT GRADIENT (headline treatment)
//  grad.start       #F2C96D  Pale warm gold
//  grad.end         #C8720A  Deep amber
//
// ─────────────────────────────────────────────────────────────────────────────

const DS = {
  // Background stack
  bgBase:        '0E0A06',
  bgMidDark:     '1A1108',
  bgSurface:     '231709',

  // Volumetric glow
  glowAmber:     'C8720A',
  glowEmber:     '7A2C0C',
  glowHighlight: 'E8A034',

  // Cards
  cardBg:        '2A1C0E',
  cardBgAlt:     '1E1409',
  cardBorder:    '8B5E1A',
  cardBorderHi:  'C8872A',

  // Text
  textPrimary:   'F2E4C8',
  textSecondary: 'BFA882',
  textMuted:     '7D5F3A',
  textGold:      'D9A441',
  textAmber:     'C8720A',

  // Grid
  gridLine:      '3D2A10',

  // Badge/pill
  badgeBg:       '3D220A',
  badgeBorder:   'C8720A',
  badgeText:     'F2C96D',

  // Accent gradient (simulated with two stops)
  gradStart:     'F2C96D',
  gradEnd:       'C8720A',

  // Legacy aliases kept for compatibility
  pompejiRed:    '5C1E16',
  goldDark:      'B8862B',
  goldLight:     'D9A441',
  marmorWhite:   'F5EBD8',
  tintenBraun:   '2B1810',
};

// ── TYPOGRAPHY TOKENS ─────────────────────────────────────────────────────────
//
//  font.display     'Trajan Pro'  → fallback 'Georgia'   (headlines, titles)
//  font.body        'Calibri'                              (body copy)
//
//  SCALE (points)
//  display.xl       60 pt   slide hero title
//  display.lg       44 pt   section hero title
//  display.md       28 pt   sub-heading
//  display.sm       20 pt   card heading
//  body.lg          15 pt   lead body
//  body.md          13 pt   standard body
//  body.sm          11 pt   caption / annotation
//
//  LETTER-SPACING (charSpacing in pptxgenjs = 1/100 pt)
//  tight    0
//  normal   3
//  wide     6
//  x-wide   10
//
// ─────────────────────────────────────────────────────────────────────────────

const FONTS = {
  display: 'Georgia',   // Trajan Pro not guaranteed; Georgia is close and always present
  body:    'Calibri',
};

const TYPE = {
  displayXL:  { fontSize: 60, bold: true,  charSpacing: 5  },
  displayLG:  { fontSize: 44, bold: true,  charSpacing: 5  },
  displayMD:  { fontSize: 28, bold: false, charSpacing: 6  },
  displaySM:  { fontSize: 20, bold: true,  charSpacing: 4  },
  label:      { fontSize: 11, bold: false, charSpacing: 8  },
  bodyLG:     { fontSize: 15, bold: false, charSpacing: 0  },
  bodyMD:     { fontSize: 13, bold: false, charSpacing: 0  },
  bodySM:     { fontSize: 11, bold: false, charSpacing: 0  },
  badgeText:  { fontSize: 10, bold: true,  charSpacing: 4  },
};

// ── COMPONENT TOKENS ──────────────────────────────────────────────────────────
//
//  CARDS
//  borderRadius:  6 px  (≈ 0.063 in)  – rounded corners via SVG rect rx
//  shadow:        outer, color 000000, opacity 0.7, blur 14, offset 4, angle 45
//  backdropBlur:  simulated via dark semi-transparent overlay at 78 % opacity
//
//  GLOW (radial gradient circles)
//  Rendered as SVG radial-gradient exported as base64 image.
//  Primary ambient:   radius 2.8 in (≈ 270 px), opacity 0.38
//  Secondary ember:   radius 1.8 in (≈ 173 px), opacity 0.22
//  Hotspot:           radius 0.9 in (≈  86 px), opacity 0.50
//
// ─────────────────────────────────────────────────────────────────────────────

const SW = 13.333;
const SH = 7.500;
const IMGS_DIR = path.join(__dirname, 'images');

// ─── SVG HELPERS ─────────────────────────────────────────────────────────────

function imgPath(name) {
  const p = path.join(IMGS_DIR, name);
  return fs.existsSync(p) ? p : null;
}

function svgToDataUrl(svg) {
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

// Standard drop shadow for floating elements
function shadowObj(blur = 14, opacity = 0.7, offset = 4) {
  return { type: 'outer', color: '000000', opacity, blur, offset, angle: 45 };
}

// ── BACKGROUND LAYER ─────────────────────────────────────────────────────────
// Adds the base near-black warm gradient background.
// pptxgenjs doesn't support multi-stop gradients natively, so we simulate via
// an SVG full-slide image.
function bgGradientSvg(glowX, glowY, glowR, glowColor, glowOpacity,
                        emberX, emberY, emberR, emberColor, emberOpacity) {
  // Slide at 96 dpi → 1280 × 720 px
  const W = 1280;
  const H = 720;
  const gx = Math.round(glowX * W);
  const gy = Math.round(glowY * H);
  const gr = Math.round(glowR * Math.max(W, H));
  const ex = Math.round(emberX * W);
  const ey = Math.round(emberY * H);
  const er = Math.round(emberR * Math.max(W, H));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <!-- Base background gradient: near-black warm → dark amber -->
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="80%" fx="50%" fy="50%">
      <stop offset="0%"   stop-color="#1A1108"/>
      <stop offset="100%" stop-color="#0E0A06"/>
    </radialGradient>
    <!-- Primary amber volumetric glow -->
    <radialGradient id="glowA" cx="${gx}" cy="${gy}" r="${gr}"
                    fx="${gx}" fy="${gy}" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#${glowColor}" stop-opacity="${glowOpacity}"/>
      <stop offset="45%"  stop-color="#${glowColor}" stop-opacity="${(glowOpacity * 0.25).toFixed(3)}"/>
      <stop offset="100%" stop-color="#${glowColor}" stop-opacity="0"/>
    </radialGradient>
    <!-- Secondary ember glow -->
    <radialGradient id="glowB" cx="${ex}" cy="${ey}" r="${er}"
                    fx="${ex}" fy="${ey}" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#${emberColor}" stop-opacity="${emberOpacity}"/>
      <stop offset="40%"  stop-color="#${emberColor}" stop-opacity="${(emberOpacity * 0.3).toFixed(3)}"/>
      <stop offset="100%" stop-color="#${emberColor}" stop-opacity="0"/>
    </radialGradient>
    <!-- Inner hotspot -->
    <radialGradient id="glowC" cx="${gx}" cy="${gy}" r="${Math.round(gr * 0.32)}"
                    fx="${gx}" fy="${gy}" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#E8A034" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#E8A034" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- Base fill -->
  <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
  <!-- Ambient glow layers -->
  <rect width="${W}" height="${H}" fill="url(#glowA)"/>
  <rect width="${W}" height="${H}" fill="url(#glowB)"/>
  <rect width="${W}" height="${H}" fill="url(#glowC)"/>
</svg>`;
}

// ── GRID OVERLAY ─────────────────────────────────────────────────────────────
// Graph-paper style grid rendered as SVG pattern.
// spacing: distance between lines in inches (default 0.35 in ≈ 34 px)
function gridOverlaySvg(opacity = 0.18, spacing = 0.35) {
  const W = 1280;
  const H = 720;
  const sp = Math.round(spacing * 96); // px
  const lines = [];

  // Vertical lines
  for (let x = 0; x <= W; x += sp) {
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#3D2A10" stroke-width="1"/>`);
  }
  // Horizontal lines
  for (let y = 0; y <= H; y += sp) {
    lines.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#3D2A10" stroke-width="1"/>`);
  }
  // Major grid (every 4 cells) slightly brighter
  for (let x = 0; x <= W; x += sp * 4) {
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="#5A3D18" stroke-width="1.5"/>`);
  }
  for (let y = 0; y <= H; y += sp * 4) {
    lines.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#5A3D18" stroke-width="1.5"/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <g opacity="${opacity}">
    ${lines.join('\n    ')}
  </g>
</svg>`;
}

// ── GLASS CARD SVG ────────────────────────────────────────────────────────────
// Renders a rounded-rect card with glass-morphism feel:
// dark fill + subtle amber border + inner highlight rim.
// w, h in inches → converted to px
function glassCardSvg(wIn, hIn, fillColor = DS.cardBg, borderColor = DS.cardBorder,
                       borderAlpha = 0.75, highlightTop = true) {
  const W = Math.round(wIn * 96);
  const H = Math.round(hIn * 96);
  const r = 6; // border-radius px

  const innerHighlight = highlightTop
    ? `<rect x="1" y="1" width="${W - 2}" height="${Math.round(H * 0.35)}"
             rx="${r}" ry="${r}"
             fill="url(#topSheen)" opacity="0.12"/>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="cardGrad" cx="50%" cy="0%" r="90%">
      <stop offset="0%"   stop-color="#${fillColor}" stop-opacity="1"/>
      <stop offset="100%" stop-color="#0E0A06"        stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="topSheen" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="#F2E4C8" stop-opacity="1"/>
      <stop offset="100%" stop-color="#F2E4C8" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="borderGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="#${borderColor}" stop-opacity="${borderAlpha}"/>
      <stop offset="100%" stop-color="#${borderColor}" stop-opacity="${(borderAlpha * 0.3).toFixed(2)}"/>
    </linearGradient>
  </defs>
  <!-- Card body -->
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}"
        rx="${r}" ry="${r}" fill="url(#cardGrad)"/>
  <!-- Border gradient -->
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}"
        rx="${r}" ry="${r}" fill="none" stroke="url(#borderGrad)" stroke-width="1.5"/>
  <!-- Top-edge amber accent line -->
  <rect x="${r}" y="0" width="${W - r * 2}" height="2"
        rx="1" fill="#${DS.cardBorderHi}" opacity="0.9"/>
  ${innerHighlight}
</svg>`;
}

// ── GLOW PILL / BADGE SVG ─────────────────────────────────────────────────────
function glowPillSvg(wIn, hIn, text, bgColor = DS.badgeBg,
                      borderColor = DS.badgeBorder, textColor = DS.badgeText) {
  const W = Math.round(wIn * 96);
  const H = Math.round(hIn * 96);
  const r = Math.floor(H / 2);
  const fs = Math.round(H * 0.44);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}"
        rx="${r}" ry="${r}" fill="#${bgColor}" opacity="0.92"/>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}"
        rx="${r}" ry="${r}" fill="none" stroke="#${borderColor}" stroke-width="1.2" filter="url(#glow)"/>
  <text x="${W / 2}" y="${H / 2 + fs * 0.35}"
        font-family="Georgia, serif" font-size="${fs}" font-weight="bold"
        fill="#${textColor}" text-anchor="middle" letter-spacing="3">${text}</text>
</svg>`;
}

// ── HORIZONTAL ACCENT LINE ────────────────────────────────────────────────────
function accentLineSvg(wIn, hIn = 0.04, color = DS.textGold) {
  const W = Math.round(wIn * 96);
  const H = Math.max(3, Math.round(hIn * 96));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#${color}" stop-opacity="0"/>
      <stop offset="20%"  stop-color="#${color}" stop-opacity="1"/>
      <stop offset="80%"  stop-color="#${color}" stop-opacity="1"/>
      <stop offset="100%" stop-color="#${color}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#lineGrad)"/>
</svg>`;
}

// ── ROMAN NUMERAL MEDALLION SVG ───────────────────────────────────────────────
function medallionSvg(sizeIn, numeral, fillColor = DS.glowAmber) {
  const S = Math.round(sizeIn * 96);
  const cx = S / 2;
  const cy = S / 2;
  const r = S * 0.44;
  const fs = Math.round(S * 0.30);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <radialGradient id="medGrad" cx="40%" cy="30%" r="70%">
      <stop offset="0%"   stop-color="#${DS.glowHighlight}"/>
      <stop offset="100%" stop-color="#${fillColor}"/>
    </radialGradient>
  </defs>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#medGrad)"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#${DS.gradStart}" stroke-width="1.5" opacity="0.7"/>
  <text x="${cx}" y="${cy + fs * 0.38}"
        font-family="Georgia, serif" font-size="${fs}" font-weight="bold"
        fill="#${DS.bgBase}" text-anchor="middle">${numeral}</text>
</svg>`;
}

// ── CHI-RHO SYMBOL ────────────────────────────────────────────────────────────
function chiRhoSvg(sizeIn, color = DS.textGold) {
  const S = Math.round(sizeIn * 96);
  const cx = S / 2;
  const cy = S / 2;
  const r = S * 0.38;
  const sw = S * 0.055;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <filter id="chiGlow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <circle cx="${cx}" cy="${cy}" r="${r * 1.12}" fill="none" stroke="#${color}" stroke-width="1" opacity="0.25"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#${color}" stroke-width="${sw * 0.5}" opacity="0.5" filter="url(#chiGlow)"/>
  <!-- Rho vertical bar -->
  <line x1="${cx}" y1="${cy - r * 0.85}" x2="${cx}" y2="${cy + r * 0.85}"
        stroke="#${color}" stroke-width="${sw}" stroke-linecap="round" filter="url(#chiGlow)"/>
  <!-- Rho bowl -->
  <path d="M ${cx} ${cy - r * 0.85} Q ${cx + r * 0.55} ${cy - r * 0.85} ${cx + r * 0.55} ${cy - r * 0.35} Q ${cx + r * 0.55} ${cy + r * 0.1} ${cx} ${cy + r * 0.1}"
        fill="none" stroke="#${color}" stroke-width="${sw}" filter="url(#chiGlow)"/>
  <!-- Chi X -->
  <line x1="${cx - r * 0.55}" y1="${cy - r * 0.55}" x2="${cx + r * 0.55}" y2="${cy + r * 0.55}"
        stroke="#${color}" stroke-width="${sw}" stroke-linecap="round" filter="url(#chiGlow)"/>
  <line x1="${cx + r * 0.55}" y1="${cy - r * 0.55}" x2="${cx - r * 0.55}" y2="${cy + r * 0.55}"
        stroke="#${color}" stroke-width="${sw}" stroke-linecap="round" filter="url(#chiGlow)"/>
  <!-- Radial rays -->
  ${[0, 45, 90, 135, 180, 225, 270, 315].map(a => {
    const rad = a * Math.PI / 180;
    const x1 = cx + Math.cos(rad) * r;
    const y1 = cy + Math.sin(rad) * r;
    const x2 = cx + Math.cos(rad) * (r * 1.22);
    const y2 = cy + Math.sin(rad) * (r * 1.22);
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#${color}" stroke-width="${(S * 0.022).toFixed(1)}" opacity="0.5"/>`;
  }).join('\n  ')}
</svg>`;
}

// ── ICHTHYS FISH ──────────────────────────────────────────────────────────────
function ichthysSvg(wIn, hIn, color = DS.textGold) {
  const W = Math.round(wIn * 96);
  const H = Math.round(hIn * 96);
  const cx = W * 0.42;
  const cy = H / 2;
  const rx = W * 0.38;
  const ry = H * 0.38;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="fishGlow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <path d="M ${cx - rx} ${cy} Q ${cx} ${cy - ry * 1.3} ${cx + rx} ${cy} Q ${cx} ${cy + ry * 1.3} ${cx - rx} ${cy} Z"
        fill="none" stroke="#${color}" stroke-width="${H * 0.07}" filter="url(#fishGlow)"/>
  <path d="M ${cx + rx * 0.8} ${cy - ry * 0.55} L ${W * 0.97} ${cy - ry * 0.75}
           M ${cx + rx * 0.8} ${cy + ry * 0.55} L ${W * 0.97} ${cy + ry * 0.75}"
        fill="none" stroke="#${color}" stroke-width="${H * 0.06}" stroke-linecap="round" filter="url(#fishGlow)"/>
</svg>`;
}

// ── CORNER ORNAMENT SVG ───────────────────────────────────────────────────────
// Subtle angular corner decoration (top-left mirrored to other corners via transform)
function cornerOrnamentSvg(sizeIn, color = DS.cardBorder) {
  const S = Math.round(sizeIn * 96);
  const t = Math.round(S * 0.08);  // line thickness px
  const d = Math.round(S * 0.55);  // arm length

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <g stroke="#${color}" stroke-width="${t}" stroke-linecap="square" fill="none" opacity="0.7">
    <!-- Top-left corner -->
    <polyline points="${d},${t / 2} ${t / 2},${t / 2} ${t / 2},${d}"/>
    <!-- Top-right corner -->
    <polyline points="${S - d},${t / 2} ${S - t / 2},${t / 2} ${S - t / 2},${d}"/>
    <!-- Bottom-right corner -->
    <polyline points="${S - d},${S - t / 2} ${S - t / 2},${S - t / 2} ${S - t / 2},${S - d}"/>
    <!-- Bottom-left corner -->
    <polyline points="${d},${S - t / 2} ${t / 2},${S - t / 2} ${t / 2},${S - d}"/>
  </g>
</svg>`;
}

// ── AMBER DIVIDER ─────────────────────────────────────────────────────────────
function addAccentLine(slide, x, y, w, h = 0.03) {
  const svg = accentLineSvg(w, h, DS.textGold);
  slide.addImage({ data: svgToDataUrl(svg), x, y, w, h });
}

// ── FULL-SLIDE BACKGROUND BUILDER ─────────────────────────────────────────────
// glowSpec: { x, y, r, color, opacity }  — values 0–1 relative to slide dimensions
// emberSpec: same structure for secondary glow
function addDarkBackground(slide, glowSpec, emberSpec) {
  const bg = bgGradientSvg(
    glowSpec.x, glowSpec.y, glowSpec.r, glowSpec.color, glowSpec.opacity,
    emberSpec.x, emberSpec.y, emberSpec.r, emberSpec.color, emberSpec.opacity
  );
  slide.addImage({ data: svgToDataUrl(bg), x: 0, y: 0, w: SW, h: SH });

  // Grid overlay on top
  const grid = gridOverlaySvg(0.18, 0.35);
  slide.addImage({ data: svgToDataUrl(grid), x: 0, y: 0, w: SW, h: SH });
}

// ── PHOTO WITH DARK OVERLAY ───────────────────────────────────────────────────
function addPhotoPanel(slide, imgFile, x, y, w, h, overlayOpacity = 0.72) {
  const ip = imgPath(imgFile);
  if (ip) {
    slide.addImage({ path: ip, x, y, w, h, sizing: { type: 'cover', w, h } });
  } else {
    slide.addShape('rect', { x, y, w, h, fill: { color: DS.bgMidDark } });
  }
  // Dark warm overlay to integrate photo into dark system
  slide.addShape('rect', {
    x, y, w, h,
    fill: { color: DS.bgBase, transparency: Math.round((1 - overlayOpacity) * 100) },
  });
}

// ── GLASS CARD ────────────────────────────────────────────────────────────────
function addGlassCard(slide, x, y, w, h, opts = {}) {
  const fill   = opts.fill   || DS.cardBg;
  const border = opts.border || DS.cardBorder;
  const alpha  = opts.borderAlpha !== undefined ? opts.borderAlpha : 0.75;
  const svg    = glassCardSvg(w, h, fill, border, alpha, opts.highlightTop !== false);
  slide.addImage({ data: svgToDataUrl(svg), x, y, w, h, shadow: shadowObj() });
}

// ── MEDALLION ─────────────────────────────────────────────────────────────────
function addMedallion(slide, x, y, sizeIn, numeral) {
  const svg = medallionSvg(sizeIn, numeral);
  slide.addImage({ data: svgToDataUrl(svg), x, y, w: sizeIn, h: sizeIn });
}

// ── GLOW PILL BADGE ───────────────────────────────────────────────────────────
function addPill(slide, x, y, w, h, text) {
  const svg = glowPillSvg(w, h, text);
  slide.addImage({ data: svgToDataUrl(svg), x, y, w, h });
}

// ── CORNER ORNAMENTS ──────────────────────────────────────────────────────────
function addCornerOrnaments(slide, sizeIn = 0.8) {
  const svg = cornerOrnamentSvg(sizeIn, DS.cardBorder);
  slide.addImage({ data: svgToDataUrl(svg), x: 0.1, y: 0.1, w: sizeIn, h: sizeIn });
  slide.addImage({ data: svgToDataUrl(svg), x: SW - sizeIn - 0.1, y: 0.1, w: sizeIn, h: sizeIn });
  slide.addImage({ data: svgToDataUrl(svg), x: 0.1, y: SH - sizeIn - 0.1, w: sizeIn, h: sizeIn });
  slide.addImage({ data: svgToDataUrl(svg), x: SW - sizeIn - 0.1, y: SH - sizeIn - 0.1, w: sizeIn, h: sizeIn });
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

// ─── SLIDES ──────────────────────────────────────────────────────────────────

// ── SLIDE 1: HERO TITLE ───────────────────────────────────────────────────────
// Layout:    Full-bleed dark hero with center volumetric glow
// Glow:      Center (50%, 45%), amber primary, ember secondary bottom-right
// Key visual: Large display title with gradient text treatment via two-tone layout
// Typography: displayXL title + displayMD subtitle + label kicker
// Darkness:  Base dark (#0E0A06), glow at 0.42 opacity → medium intensity
function buildSlide1(pres) {
  const slide = pres.addSlide();

  // Background: center amber glow
  addDarkBackground(slide,
    { x: 0.50, y: 0.45, r: 0.72, color: DS.glowAmber,  opacity: 0.42 },
    { x: 0.75, y: 0.75, r: 0.45, color: DS.glowEmber,  opacity: 0.28 }
  );

  // Subtle Pantheon photo blended into background (very dark)
  addPhotoPanel(slide, 'pantheon.jpg', 0, 0, SW, SH, 0.88);

  // Corner ornaments
  addCornerOrnaments(slide, 0.75);

  // Kicker pill badge
  addPill(slide, SW / 2 - 2.0, 0.72, 4.0, 0.34, 'EINE GESCHICHTE IN 10 KAPITELN');

  // Accent line above title
  addAccentLine(slide, SW * 0.18, 1.22, SW * 0.64, 0.035);

  // Main title — split into two color zones (pale gold + amber)
  slide.addText('DIE ANFÄNGE', {
    x: 0, y: 1.38, w: SW, h: 1.05,
    align: 'center', fontFace: FONTS.display,
    ...TYPE.displayXL,
    color: DS.gradStart,
    shadow: shadowObj(18, 0.8, 5),
  });
  slide.addText('DER KIRCHE', {
    x: 0, y: 2.38, w: SW, h: 1.0,
    align: 'center', fontFace: FONTS.display,
    ...TYPE.displayXL,
    color: DS.textGold,
    shadow: shadowObj(18, 0.8, 5),
  });

  // Subtitle
  slide.addText('IN DER ANTIKE', {
    x: 0, y: 3.45, w: SW, h: 0.65,
    align: 'center', fontFace: FONTS.display,
    ...TYPE.displayMD,
    color: DS.textSecondary,
    charSpacing: 12,
    shadow: shadowObj(8, 0.6, 3),
  });

  // Accent line below subtitle
  addAccentLine(slide, SW * 0.22, 4.18, SW * 0.56, 0.035);

  // Teaser / hook
  slide.addText('Aus 12 Männern wurde die größte Religion der Welt.', {
    x: 0, y: 4.35, w: SW, h: 0.52,
    align: 'center', fontFace: FONTS.display,
    ...TYPE.bodyLG,
    italic: true,
    color: DS.textAmber,
    shadow: shadowObj(6, 0.5, 2),
  });
  slide.addText('Wie?', {
    x: 0, y: 4.84, w: SW, h: 0.52,
    align: 'center', fontFace: FONTS.display,
    fontSize: 22, bold: true, charSpacing: 6,
    italic: true,
    color: DS.gradStart,
    shadow: shadowObj(8, 0.6, 3),
  });

  // Bottom amber fade bar
  slide.addShape('rect', {
    x: 0, y: SH - 0.32, w: SW, h: 0.32,
    fill: { color: DS.glowAmber, transparency: 82 },
  });
}

// ── SLIDE 2: ANTIQUE WORLD — POLYTHEISM ───────────────────────────────────────
// Layout:    Two-column: left narrow dark panel (hook), right wide card grid
// Glow:      Left-center (22%, 50%), ember secondary right-bottom
// Key visual: Three floating glass cards with Roman numeral medallions
// Typography: displayMD hook + bodySM card body
// Darkness:  Medium-dark (base + slight glow on left)
function buildSlide2(pres) {
  const slide = pres.addSlide();

  addDarkBackground(slide,
    { x: 0.22, y: 0.50, r: 0.55, color: DS.glowAmber, opacity: 0.35 },
    { x: 0.80, y: 0.80, r: 0.38, color: DS.glowEmber, opacity: 0.22 }
  );

  addCornerOrnaments(slide, 0.70);

  // Left panel: dark forum photo blended
  addPhotoPanel(slide, 'forum.jpg', 0, 0, SW * 0.38, SH, 0.80);

  // Left hook text
  slide.addText('"Stell dir vor:', {
    x: 0.28, y: 1.05, w: SW * 0.32, h: 0.52,
    align: 'left', fontFace: FONTS.display,
    fontSize: 19, bold: false, italic: true, charSpacing: 1,
    color: DS.textSecondary,
  });
  slide.addText('10.000 Götter."', {
    x: 0.28, y: 1.52, w: SW * 0.32, h: 0.72,
    align: 'left', fontFace: FONTS.display,
    fontSize: 28, bold: true, italic: true, charSpacing: 2,
    color: DS.gradStart,
    shadow: shadowObj(10, 0.7, 3),
  });

  addAccentLine(slide, 0.28, 2.32, SW * 0.29, 0.03);

  slide.addText('Für jeden Bach. Jedes Tor.\nJeden Beruf. Jede Krankheit.', {
    x: 0.28, y: 2.48, w: SW * 0.32, h: 0.95,
    align: 'left', fontFace: FONTS.body,
    ...TYPE.bodyMD,
    color: DS.textSecondary,
  });

  // Right: slide label
  addPill(slide, SW * 0.42, 0.28, 2.8, 0.32, 'DIE GÖTTERWELT');

  // Three glass cards
  const cards = [
    {
      num: 'I',
      title: 'POLYTHEISMUS',
      text: 'Für jeden Aspekt des Lebens gab es eine Gottheit. Religion war überall — und nirgendwo persönlich.',
      badge: 'VIELGÖTTEREI',
    },
    {
      num: 'II',
      title: 'STAATSKULT',
      text: 'Den Kaiser anzubeten war Bürgerpflicht. Religion und Politik waren untrennbar verbunden.',
      badge: 'KAISERKULT',
    },
    {
      num: 'III',
      title: 'MYSTERIENKULTE',
      text: 'Geheimreligionen wie Mithras und Isis versprachen persönliche Erlösung — eine neue Idee.',
      badge: 'MITHRAS · ISIS',
    },
  ];

  const cw = SW * 0.535;
  const cx0 = SW * 0.425;

  cards.forEach((c, i) => {
    const cy = 0.72 + i * 1.98;
    const ch = 1.75;

    addGlassCard(slide, cx0, cy, cw, ch, { fill: DS.cardBg, border: DS.cardBorderHi });

    // Medallion
    addMedallion(slide, cx0 + 0.18, cy + (ch / 2) - 0.26, 0.52, c.num);

    // Title
    slide.addText(c.title, {
      x: cx0 + 0.84, y: cy + 0.14, w: cw - 1.2, h: 0.38,
      align: 'left', fontFace: FONTS.display,
      fontSize: 14, bold: true, charSpacing: 4,
      color: DS.textGold,
    });

    // Badge pill (right-aligned inside card)
    addPill(slide, cx0 + cw - 1.8, cy + 0.14, 1.6, 0.28, c.badge);

    addAccentLine(slide, cx0 + 0.84, cy + 0.58, cw - 1.0, 0.025);

    // Body text
    slide.addText(c.text, {
      x: cx0 + 0.84, y: cy + 0.70, w: cw - 1.0, h: 0.88,
      align: 'left', fontFace: FONTS.body,
      ...TYPE.bodyMD,
      color: DS.textSecondary,
    });
  });

  // Bottom quote bar
  slide.addShape('rect', {
    x: 0, y: SH - 0.72, w: SW, h: 0.50,
    fill: { color: DS.glowEmber, transparency: 75 },
  });
  addAccentLine(slide, 0, SH - 0.72, SW, 0.025);
  slide.addText('"Glaube als persönliche Beziehung — diese Idee gab es nicht."', {
    x: 0.5, y: SH - 0.70, w: SW - 1.0, h: 0.46,
    align: 'center', fontFace: FONTS.display,
    fontSize: 13, italic: true, charSpacing: 1,
    color: DS.textPrimary,
  });
}

// ── SLIDE 3: GREEK INFLUENCE ──────────────────────────────────────────────────
// Layout:    Four-column grid (equal width cards, centered), narrow header area
// Glow:      Right-center (78%, 40%), amber; secondary left-bottom ember
// Key visual: Four column cards with top-accent medallions and icon categories
// Typography: Hook quote center top + card body
// Darkness:  Base dark with subtle background photo
function buildSlide3(pres) {
  const slide = pres.addSlide();

  addDarkBackground(slide,
    { x: 0.78, y: 0.40, r: 0.60, color: DS.glowAmber, opacity: 0.38 },
    { x: 0.18, y: 0.82, r: 0.40, color: DS.glowEmber, opacity: 0.24 }
  );

  // Very subtle Parthenon photo as texture
  addPhotoPanel(slide, 'parthenon.jpg', 0, 0, SW, SH, 0.92);

  addCornerOrnaments(slide, 0.70);

  // Kicker
  addPill(slide, SW / 2 - 1.8, 0.22, 3.6, 0.32, 'DER GRIECHISCHE EINFLUSS');

  // Hook quote
  slide.addText('"Ohne Alexander den Großen kein Paulus in Athen."', {
    x: 0.5, y: 0.66, w: SW - 1.0, h: 0.72,
    align: 'center', fontFace: FONTS.display,
    fontSize: 22, bold: true, italic: true, charSpacing: 1,
    color: DS.gradStart,
    shadow: shadowObj(10, 0.7, 3),
  });

  addAccentLine(slide, SW * 0.12, 1.44, SW * 0.76, 0.035);

  // Four column cards
  const cols = [
    { num: 'I',  title: 'SPRACHE',    text: 'Koine-Griechisch: Sprache des halben Imperiums. Das Neue Testament wird komplett auf Griechisch geschrieben.' },
    { num: 'II', title: 'BIBEL',      text: 'Septuaginta (~250 v. Chr.) — Juden lesen ihre eigene Schrift bereits griechisch, lange vor Jesus.' },
    { num: 'III', title: 'PHILOSOPHIE', text: '"Im Anfang war der Logos" — Johannes 1:1 entlehnt direkt aus der stoischen und platonischen Philosophie.' },
    { num: 'IV', title: 'STÄDTE',     text: 'Alexander hinterlässt ein Netz von Poleis. Paulus\' Missionsrouten existieren bereits als Infrastruktur.' },
  ];

  const colW = (SW - 1.0) / 4 - 0.12;
  const colH = SH - 2.05;

  cols.forEach((c, i) => {
    const cx = 0.3 + i * (colW + 0.145);
    const cy = 1.62;

    addGlassCard(slide, cx, cy, colW, colH, {
      fill: DS.cardBgAlt, border: DS.cardBorder, borderAlpha: 0.65
    });

    // Medallion centered at top of card
    addMedallion(slide, cx + colW / 2 - 0.27, cy + 0.18, 0.54, c.num);

    // Title
    slide.addText(c.title, {
      x: cx + 0.08, y: cy + 0.84, w: colW - 0.16, h: 0.42,
      align: 'center', fontFace: FONTS.display,
      fontSize: 12, bold: true, charSpacing: 3,
      color: DS.textGold,
    });

    addAccentLine(slide, cx + 0.14, cy + 1.32, colW - 0.28, 0.025);

    // Body text
    slide.addText(c.text, {
      x: cx + 0.12, y: cy + 1.48, w: colW - 0.24, h: colH - 1.65,
      align: 'center', fontFace: FONTS.body,
      ...TYPE.bodyMD,
      color: DS.textSecondary,
    });
  });
}

// ── SLIDE 4: THE BIRTH MOMENT ─────────────────────────────────────────────────
// Layout:    Two-column: left narrow dark photo panel, right vertical timeline
// Glow:      Center-left (35%, 50%), ember primary (darker mood); secondary top-right
// Key visual: Vertical timeline with glow dots + Ichthys fish symbol bottom
// Typography: Bold punch date text + timeline entries
// Darkness:  Darkest slide — near-black, ember glow only (death/catacomb mood)
function buildSlide4(pres) {
  const slide = pres.addSlide();

  addDarkBackground(slide,
    { x: 0.35, y: 0.50, r: 0.55, color: DS.glowEmber, opacity: 0.45 },
    { x: 0.80, y: 0.22, r: 0.38, color: DS.glowAmber, opacity: 0.20 }
  );

  addPhotoPanel(slide, 'catacombs.jpg', 0, 0, SW * 0.38, SH, 0.78);

  addCornerOrnaments(slide, 0.68);

  // Left label
  addPill(slide, 0.22, 0.28, 2.2, 0.30, '30 N.CHR.');

  // Right: kicker
  addPill(slide, SW * 0.42, 0.22, 3.2, 0.30, 'DIE GEBURTSSTUNDE');

  // Left column — hook (overlaid on photo)
  slide.addText('Ein Wanderprediger\nwird hingerichtet.', {
    x: 0.18, y: 0.75, w: SW * 0.34, h: 1.4,
    align: 'left', fontFace: FONTS.display,
    fontSize: 20, bold: true, charSpacing: 1,
    color: DS.textPrimary,
    shadow: shadowObj(12, 0.8, 4),
  });

  slide.addText('50 Tage später:\nSeine Anhänger behaupten,\ner sei zurückgekehrt.', {
    x: 0.18, y: 2.25, w: SW * 0.34, h: 1.55,
    align: 'left', fontFace: FONTS.display,
    fontSize: 14, bold: false, italic: true, charSpacing: 0,
    color: DS.textAmber,
  });

  // Right side header
  addAccentLine(slide, SW * 0.42, 0.62, SW * 0.54, 0.03);

  // Timeline entries (right column)
  const events = [
    { year: '~30 n. Chr.', label: 'TOD & AUFERSTEHUNG', text: 'Jesus von Nazareth gekreuzigt unter Pontius Pilatus. 500 Zeugen der Erscheinungen laut Paulus.' },
    { year: 'Pfingsten 30', label: 'PFINGSTERFAHRUNG',   text: '~120 Anhänger in Jerusalem. Eine kollektive Erfahrung, die die Bewegung entfacht.' },
    { year: '30–50 n. Chr.', label: 'ERSTE GEMEINDEN',  text: 'Leben in Gütergemeinschaft. Mahlgemeinschaft als Zentrum. Noch vollständig als Juden identifiziert.' },
    { year: '~50 n. Chr.', label: 'ERSTE SCHRIFTEN',    text: 'Paulus schreibt seine Briefe — 20 Jahre vor den Evangelien. Das älteste NT-Zeugnis.' },
  ];

  events.forEach((e, i) => {
    const ty = 0.82 + i * 1.48;
    const tx = SW * 0.42;
    const tw = SW * 0.54;

    // Glass card for each timeline entry
    addGlassCard(slide, tx, ty, tw, 1.28, {
      fill: DS.cardBgAlt, border: DS.cardBorder, borderAlpha: 0.55
    });

    // Year badge
    addPill(slide, tx + 0.14, ty + 0.12, 2.0, 0.26, e.year);

    // Category label
    slide.addText(e.label, {
      x: tx + 2.22, y: ty + 0.10, w: tw - 2.38, h: 0.30,
      align: 'left', fontFace: FONTS.display,
      fontSize: 10, bold: true, charSpacing: 3,
      color: DS.textGold,
    });

    // Body
    slide.addText(e.text, {
      x: tx + 0.14, y: ty + 0.48, w: tw - 0.28, h: 0.72,
      align: 'left', fontFace: FONTS.body,
      ...TYPE.bodyMD,
      color: DS.textSecondary,
    });
  });

  // Ichthys fish + caption (bottom of left panel)
  const fishSvg = ichthysSvg(1.35, 0.62, DS.textGold);
  slide.addImage({ data: svgToDataUrl(fishSvg), x: 0.12, y: SH - 0.95, w: 1.35, h: 0.62 });
  slide.addText('ΙΧΘΥΣ — Iesous Christos Theou Yios Soter', {
    x: 1.55, y: SH - 0.90, w: SW * 0.28, h: 0.50,
    align: 'left', fontFace: FONTS.display,
    fontSize: 9, italic: true, charSpacing: 1,
    color: DS.textMuted,
  });
}

// ── SLIDE 5: PAUL'S MISSIONARY JOURNEYS ──────────────────────────────────────
// Layout:    Two-column: left vertical route timeline, right dark photo panel
// Glow:      Right-center (72%, 48%), amber; secondary ember left-bottom
// Key visual: Vertical dotted route line with glowing city stops + stat cards
// Typography: Hook quote left + city names bold + italic notes
// Darkness:  Medium-dark with warm amber glow on right
function buildSlide5(pres) {
  const slide = pres.addSlide();

  addDarkBackground(slide,
    { x: 0.72, y: 0.48, r: 0.60, color: DS.glowAmber, opacity: 0.36 },
    { x: 0.18, y: 0.78, r: 0.42, color: DS.glowEmber, opacity: 0.24 }
  );

  addPhotoPanel(slide, 'ostia.jpg', SW * 0.55, 0, SW * 0.45, SH, 0.80);

  addCornerOrnaments(slide, 0.68);

  addPill(slide, 0.28, 0.22, 2.8, 0.30, 'MISSIONSREISEN');

  // Hook quote
  slide.addText('"Der Mann, der Christen\njagte, wurde ihr\nwichtigster Missionar."', {
    x: 0.28, y: 0.65, w: SW * 0.50, h: 2.0,
    align: 'left', fontFace: FONTS.display,
    fontSize: 22, bold: true, italic: true, charSpacing: 1,
    color: DS.gradStart,
    shadow: shadowObj(10, 0.7, 3),
  });

  addAccentLine(slide, 0.28, 2.75, SW * 0.48, 0.03);

  // Route stations (left column, below hook)
  const stations = [
    { city: 'Antiochia', note: 'Hier nennt man sie zum ersten Mal "Christen"', badge: '~47 n.Chr.' },
    { city: 'Korinth',   note: '18 Monate. Wichtigste Handelsstadt des Ostens.', badge: '~51 n.Chr.' },
    { city: 'Athen',     note: 'Areopag-Rede. Paulus zitiert griechische Dichter.', badge: '~50 n.Chr.' },
    { city: 'Ephesus',   note: 'Kampf gegen Artemis-Kult. Beinahe ein Aufstand.', badge: '~53 n.Chr.' },
    { city: 'Rom',       note: 'Tod unter Nero, ~64 n. Chr. Mission abgeschlossen.', badge: '~64 n.Chr.' },
  ];

  const dotX = 0.30;
  const textX = 0.74;
  const routeY0 = 2.98;
  const rowH = 0.82;

  stations.forEach((s, i) => {
    const sy = routeY0 + i * rowH;

    // Glow dot
    slide.addShape('ellipse', {
      x: dotX, y: sy + 0.10, w: 0.26, h: 0.26,
      fill: { color: DS.glowHighlight },
      shadow: { type: 'outer', color: DS.glowAmber, opacity: 0.8, blur: 6, offset: 0, angle: 0 },
    });

    // Connector line (dashed feel via thin rect)
    if (i < stations.length - 1) {
      slide.addShape('line', {
        x: dotX + 0.12, y: sy + 0.36, w: 0, h: rowH - 0.26,
        line: { color: DS.glowAmber, width: 1.2, dashType: 'dash' },
      });
    }

    // City name
    slide.addText(s.city.toUpperCase(), {
      x: textX, y: sy + 0.02, w: 1.8, h: 0.30,
      align: 'left', fontFace: FONTS.display,
      fontSize: 13, bold: true, charSpacing: 3,
      color: DS.textGold,
    });

    // Date badge
    addPill(slide, textX + 1.85, sy + 0.03, 1.4, 0.26, s.badge);

    // Note
    slide.addText(s.note, {
      x: textX, y: sy + 0.34, w: SW * 0.46, h: 0.38,
      align: 'left', fontFace: FONTS.body,
      fontSize: 12, italic: true, charSpacing: 0,
      color: DS.textSecondary,
    });
  });

  // Stat card bottom right (on photo panel)
  addGlassCard(slide, SW * 0.57, SH - 1.72, SW * 0.40, 1.45, {
    fill: DS.cardBg, border: DS.cardBorderHi, borderAlpha: 0.80
  });
  slide.addText('3 Missionsreisen  ·  13 Briefe im NT', {
    x: SW * 0.59, y: SH - 1.66, w: SW * 0.37, h: 0.38,
    align: 'center', fontFace: FONTS.display,
    fontSize: 13, bold: true, charSpacing: 2,
    color: DS.textGold,
  });
  addAccentLine(slide, SW * 0.59, SH - 1.26, SW * 0.35, 0.025);
  slide.addText('Wahrscheinlich nie Jesus\npersönlich getroffen.', {
    x: SW * 0.59, y: SH - 1.20, w: SW * 0.37, h: 0.80,
    align: 'center', fontFace: FONTS.body,
    fontSize: 12, italic: true, charSpacing: 0,
    color: DS.textSecondary,
  });
}

// ── SLIDE 6: ROMAN PERSECUTION ────────────────────────────────────────────────
// Layout:    Full-bleed dark photo, three floating cards bottom center
// Glow:      Bottom-center (50%, 80%), ember primary; secondary top-right amber
// Key visual: Three persecution cards with large date numerals + Tertullian quote
// Typography: Full-bleed hook quote + card dates in displayLG
// Darkness:  Darkest overall — Colosseum photo at 0.72 overlay
function buildSlide6(pres) {
  const slide = pres.addSlide();

  addDarkBackground(slide,
    { x: 0.50, y: 0.80, r: 0.65, color: DS.glowEmber, opacity: 0.48 },
    { x: 0.82, y: 0.18, r: 0.42, color: DS.glowAmber, opacity: 0.22 }
  );

  addPhotoPanel(slide, 'colosseum.jpg', 0, 0, SW, SH, 0.76);

  addCornerOrnaments(slide, 0.68);

  addPill(slide, SW / 2 - 1.6, 0.22, 3.2, 0.30, 'RÖMISCHE VERFOLGUNG');

  // Hook
  slide.addText('"Wie tötet man eine Religion?', {
    x: 0, y: 0.68, w: SW, h: 0.68,
    align: 'center', fontFace: FONTS.display,
    fontSize: 28, bold: true, italic: true, charSpacing: 2,
    color: DS.textPrimary,
    shadow: shadowObj(12, 0.8, 4),
  });
  slide.addText('Antwort: Man kann nicht."', {
    x: 0, y: 1.30, w: SW, h: 0.68,
    align: 'center', fontFace: FONTS.display,
    fontSize: 28, bold: true, italic: true, charSpacing: 2,
    color: DS.gradStart,
    shadow: shadowObj(12, 0.8, 4),
  });

  addAccentLine(slide, SW * 0.12, 2.08, SW * 0.76, 0.03);

  // Three persecution glass cards
  const events = [
    {
      year:   '64 n. Chr.',
      name:   'NERO',
      text:   'Sündenbock nach dem Brand Roms. Petrus und Paulus sterben. Christen als "Feinde des Menschengeschlechts".',
      badge:  '1. WELLE',
    },
    {
      year:   '250 n. Chr.',
      name:   'DECIUS',
      text:   'Erste reichsweite, systematische Verfolgung. Jeder Bürger muss ein Opferzertifikat vorlegen.',
      badge:  '2. WELLE',
    },
    {
      year:   '303 n. Chr.',
      name:   'DIOKLETIAN',
      text:   'Die schwerste Welle: Schriften verbrannt, Kirchen zerstört, tausende Märtyrer. Dauert 10 Jahre.',
      badge:  '3. WELLE',
    },
  ];

  const cardW = (SW - 0.9) / 3 - 0.05;
  const cardH = 2.62;

  events.forEach((e, i) => {
    const cx = 0.28 + i * (cardW + 0.145);
    const cy = 2.28;

    addGlassCard(slide, cx, cy, cardW, cardH, {
      fill: DS.cardBg, border: DS.cardBorderHi, borderAlpha: 0.85
    });

    // Year — large number
    slide.addText(e.year, {
      x: cx + 0.12, y: cy + 0.14, w: cardW - 0.24, h: 0.58,
      align: 'center', fontFace: FONTS.display,
      fontSize: 22, bold: true, charSpacing: 2,
      color: DS.gradStart,
    });

    // Name + badge
    slide.addText(e.name, {
      x: cx + 0.12, y: cy + 0.72, w: cardW * 0.5, h: 0.36,
      align: 'left', fontFace: FONTS.display,
      fontSize: 13, bold: true, charSpacing: 3,
      color: DS.textPrimary,
    });
    addPill(slide, cx + cardW * 0.52, cy + 0.72, cardW * 0.42, 0.28, e.badge);

    addAccentLine(slide, cx + 0.12, cy + 1.14, cardW - 0.24, 0.025);

    // Body
    slide.addText(e.text, {
      x: cx + 0.12, y: cy + 1.26, w: cardW - 0.24, h: 1.22,
      align: 'left', fontFace: FONTS.body,
      ...TYPE.bodyMD,
      color: DS.textSecondary,
    });
  });

  // Tertullian quote
  addAccentLine(slide, SW * 0.10, SH - 0.88, SW * 0.80, 0.025);
  slide.addText('"Das Blut der Märtyrer ist Same der Kirche."  — Tertullian', {
    x: 0, y: SH - 0.78, w: SW, h: 0.52,
    align: 'center', fontFace: FONTS.display,
    fontSize: 15, italic: true, charSpacing: 1,
    color: DS.textGold,
    shadow: shadowObj(8, 0.6, 3),
  });
}

// ── SLIDE 7: CONSTANTINE'S CONVERSION ────────────────────────────────────────
// Layout:    Left Chi-Rho hero element (symbol + text), right vertical event cards
// Glow:      Center-left (38%, 45%), amber PRIMARY (bright — turning point mood)
// Key visual: Large glowing Chi-Rho, three milestone cards right
// Typography: Bold hook left + year cards right with displayLG year numbers
// Darkness:  Lighter than persecution slides — amber glow at 0.48 (hopeful turn)
function buildSlide7(pres) {
  const slide = pres.addSlide();

  addDarkBackground(slide,
    { x: 0.38, y: 0.45, r: 0.68, color: DS.glowAmber, opacity: 0.48 },
    { x: 0.82, y: 0.72, r: 0.40, color: DS.glowEmber, opacity: 0.22 }
  );

  addPhotoPanel(slide, 'constantine_arch.jpg', SW * 0.52, 0, SW * 0.48, SH, 0.82);

  addCornerOrnaments(slide, 0.68);

  addPill(slide, 0.28, 0.22, 3.0, 0.30, 'KONSTANTINS BEKEHRUNG');

  // Chi-Rho symbol (large, glowing amber)
  const crSvg = chiRhoSvg(3.2, DS.glowHighlight);
  slide.addImage({ data: svgToDataUrl(crSvg), x: 0.18, y: 1.65, w: 3.2, h: 3.2 });

  // Hook left
  slide.addText('312. Ein Kaiser\nhat einen Traum.', {
    x: 0.28, y: 0.65, w: SW * 0.46, h: 1.40,
    align: 'left', fontFace: FONTS.display,
    fontSize: 28, bold: true, charSpacing: 2,
    color: DS.gradStart,
    shadow: shadowObj(14, 0.8, 4),
  });

  slide.addText('Und das ganze Reich wechselt die Religion.', {
    x: 0.28, y: 2.05, w: SW * 0.34, h: 0.62,
    align: 'left', fontFace: FONTS.body,
    fontSize: 14, italic: true, charSpacing: 0,
    color: DS.textSecondary,
  });

  // Footer caption (below chi-rho)
  addAccentLine(slide, 0.28, SH - 0.72, SW * 0.46, 0.03);
  slide.addText('Die Verfolgten sitzen jetzt am Tisch des Kaisers.', {
    x: 0.28, y: SH - 0.64, w: SW * 0.46, h: 0.40,
    align: 'left', fontFace: FONTS.display,
    fontSize: 13, italic: true, charSpacing: 0,
    color: DS.textAmber,
  });

  // Right: three milestone cards
  const events = [
    { year: '312', title: 'MILVISCHE BRÜCKE', text: 'Konstantin besiegt Maxentius unter dem Chi-Rho-Zeichen. Er schreibt den Sieg dem Christengott zu.' },
    { year: '313', title: 'MAILÄNDER EDIKT',  text: 'Religionsfreiheit im ganzen Reich. Konfisziertes Kircheneigentum wird zurückgegeben. Kirche erhält Rechtsstatus.' },
    { year: '325', title: 'KONZIL VON NICÄA', text: 'Erste reichsweite Bischofssynode. Das Nicänische Glaubensbekenntnis entsteht. Kaiser moderiert die Theologie.' },
  ];

  const cardW = SW * 0.445;
  const cardH = 1.72;

  events.forEach((e, i) => {
    const cx = SW * 0.535;
    const cy = 0.20 + i * (cardH + 0.12);

    addGlassCard(slide, cx, cy, cardW, cardH, {
      fill: DS.cardBg, border: DS.cardBorderHi, borderAlpha: 0.82
    });

    // Year badge
    slide.addText(e.year, {
      x: cx + 0.14, y: cy + 0.10, w: 1.10, h: 0.55,
      align: 'left', fontFace: FONTS.display,
      fontSize: 28, bold: true, charSpacing: 2,
      color: DS.gradStart,
    });

    // Event title
    slide.addText(e.title, {
      x: cx + 1.28, y: cy + 0.18, w: cardW - 1.42, h: 0.38,
      align: 'left', fontFace: FONTS.display,
      fontSize: 11, bold: true, charSpacing: 3,
      color: DS.textGold,
    });

    addAccentLine(slide, cx + 0.14, cy + 0.72, cardW - 0.28, 0.025);

    // Body
    slide.addText(e.text, {
      x: cx + 0.14, y: cy + 0.84, w: cardW - 0.28, h: 0.78,
      align: 'left', fontFace: FONTS.body,
      ...TYPE.bodyMD,
      color: DS.textSecondary,
    });
  });
}

// ── SLIDE 8: THE REVERSAL — CHRISTIANS BECOME PERSECUTORS ────────────────────
// Layout:    Two-column: left Hagia Sophia photo panel, right vertical timeline
// Glow:      Left-center (25%, 50%), amber; secondary ember right-bottom
// Key visual: Vertical timeline with darker mood, reversed narrative
// Typography: Hook quote right with striking color inversion language
// Darkness:  Medium-dark, amber glow from left (church architecture)
function buildSlide8(pres) {
  const slide = pres.addSlide();

  addDarkBackground(slide,
    { x: 0.25, y: 0.50, r: 0.55, color: DS.glowAmber, opacity: 0.34 },
    { x: 0.78, y: 0.80, r: 0.40, color: DS.glowEmber, opacity: 0.28 }
  );

  addPhotoPanel(slide, 'hagia_sophia.jpg', 0, 0, SW * 0.40, SH, 0.76);

  addCornerOrnaments(slide, 0.68);

  addPill(slide, SW * 0.44, 0.22, 3.4, 0.30, 'DIE UMKEHRUNG');

  // Hook
  slide.addText('"Plötzlich ist es umgekehrt."', {
    x: SW * 0.42, y: 0.66, w: SW * 0.55, h: 0.65,
    align: 'left', fontFace: FONTS.display,
    fontSize: 22, bold: true, italic: true, charSpacing: 1,
    color: DS.gradStart,
    shadow: shadowObj(10, 0.7, 3),
  });

  slide.addText('Wer NICHT Christ ist, wird verfolgt.', {
    x: SW * 0.42, y: 1.28, w: SW * 0.55, h: 0.52,
    align: 'left', fontFace: FONTS.display,
    fontSize: 17, bold: true, charSpacing: 2,
    color: DS.glowHighlight,
  });

  addAccentLine(slide, SW * 0.42, 1.88, SW * 0.54, 0.03);

  // Timeline
  const events = [
    { year: '380',  text: 'Theodosius macht Christentum zur Staatsreligion.\nAndere Kulte werden illegal.' },
    { year: '391',  text: 'Heidnische Opfer = Hochverrat. Tempel werden geschlossen und verwüstet.' },
    { year: '393',  text: 'Letzte Olympische Spiele der Antike. Sie waren Zeus geweiht. Ende nach 1168 Jahren.' },
    { year: '415',  text: 'Hypatia von Alexandria, Philosophin und Mathematikerin, wird von einer christlichen Menge gelyncht.' },
    { year: '529',  text: 'Justinian schließt die Platonische Akademie in Athen. Nach über 900 Jahren.' },
  ];

  const dotX = SW * 0.42;
  const textX = SW * 0.42 + 0.44;
  const rowH   = 0.96;

  events.forEach((e, i) => {
    const ty = 2.08 + i * rowH;

    // Glowing amber dot
    slide.addShape('ellipse', {
      x: dotX + 0.01, y: ty + 0.08, w: 0.25, h: 0.25,
      fill: { color: DS.glowHighlight },
      shadow: { type: 'outer', color: DS.glowAmber, opacity: 0.7, blur: 5, offset: 0, angle: 0 },
    });

    if (i < events.length - 1) {
      slide.addShape('line', {
        x: dotX + 0.125, y: ty + 0.33, w: 0, h: rowH - 0.25,
        line: { color: DS.glowAmber, width: 1.0, dashType: 'dash' },
      });
    }

    // Year
    slide.addText(e.year, {
      x: textX, y: ty + 0.00, w: 0.72, h: 0.30,
      align: 'left', fontFace: FONTS.display,
      fontSize: 13, bold: true, charSpacing: 2,
      color: DS.textGold,
    });

    // Text
    slide.addText(e.text, {
      x: textX + 0.76, y: ty - 0.04, w: SW * 0.49, h: 0.82,
      align: 'left', fontFace: FONTS.body,
      fontSize: 12, charSpacing: 0,
      color: DS.textSecondary,
    });
  });

  // Footer banner
  slide.addShape('rect', {
    x: 0, y: SH - 0.62, w: SW, h: 0.42,
    fill: { color: DS.glowEmber, transparency: 72 },
  });
  addAccentLine(slide, 0, SH - 0.62, SW, 0.025);
  slide.addText('Die einst Verfolgten wurden zu Verfolgern.', {
    x: 0, y: SH - 0.60, w: SW, h: 0.40,
    align: 'center', fontFace: FONTS.display,
    fontSize: 14, bold: true, italic: true, charSpacing: 2,
    color: DS.textPrimary,
  });
}

// ── SLIDE 9: LEGACY / IMPACT ──────────────────────────────────────────────────
// Layout:    2×3 card grid, centered; hook question spans full width above
// Glow:      Center (50%, 42%), amber medium; secondary ember bottom-right
// Key visual: 6 glass impact cards with medallion + category title + body
// Typography: Hook question bold center + card grid
// Darkness:  Medium (grid cards need legibility — not too dark)
function buildSlide9(pres) {
  const slide = pres.addSlide();

  addDarkBackground(slide,
    { x: 0.50, y: 0.42, r: 0.65, color: DS.glowAmber, opacity: 0.36 },
    { x: 0.82, y: 0.80, r: 0.40, color: DS.glowEmber, opacity: 0.22 }
  );

  addPhotoPanel(slide, 'basilica.jpg', 0, 0, SW, SH, 0.90);

  addCornerOrnaments(slide, 0.68);

  addPill(slide, SW / 2 - 1.8, 0.20, 3.6, 0.30, 'DAS ERBE — 6 KATEGORIEN');

  // Hook
  slide.addText('"Warum ist Sonntag frei? Warum schreiben wir 2026? Warum gibt es Krankenhäuser?"', {
    x: 0.5, y: 0.60, w: SW - 1.0, h: 0.80,
    align: 'center', fontFace: FONTS.display,
    fontSize: 17, bold: true, italic: true, charSpacing: 1,
    color: DS.gradStart,
    shadow: shadowObj(8, 0.6, 3),
  });

  addAccentLine(slide, SW * 0.10, 1.48, SW * 0.80, 0.03);

  // 2×3 grid
  const impacts = [
    { num: 'I',   title: 'ZEIT',      text: 'Sonntag als gesetzlicher Ruhetag. Unser Kalender (vor/nach Chr.) ist christlich geprägt.' },
    { num: 'II',  title: 'SOZIALES',  text: 'Erste Hospize, Waisenhäuser, systematische Armenfürsorge als religiöse Pflicht.' },
    { num: 'III', title: 'BILDUNG',   text: 'Klöster retten antikes Wissen durch das Mittelalter. Erste Universitäten sind kirchlich.' },
    { num: 'IV',  title: 'BAUKUNST',  text: 'Basilika statt Tempel. Kuppelbau, Kirchenfenster, gotische Kathedralen.' },
    { num: 'V',   title: 'ETHIK',     text: 'Nächstenliebe als Pflicht. Würde aller Menschen — auch Sklaven — als theologisches Prinzip.' },
    { num: 'VI',  title: 'FRAUEN',    text: 'Neue Rollen: Witwen, Diakoninnen, Märtyrerinnen. Früher als in der paganen Gesellschaft.' },
  ];

  const cols = 3;
  const gw = (SW - 0.90) / cols - 0.08;
  const gh = (SH - 1.90) / 2 - 0.08;

  impacts.forEach((imp, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = 0.28 + col * (gw + 0.115);
    const cy = 1.68 + row * (gh + 0.10);

    addGlassCard(slide, cx, cy, gw, gh, {
      fill: DS.cardBg, border: DS.cardBorder, borderAlpha: 0.65
    });

    addMedallion(slide, cx + 0.14, cy + 0.14, 0.46, imp.num);

    slide.addText(imp.title, {
      x: cx + 0.68, y: cy + 0.18, w: gw - 0.80, h: 0.34,
      align: 'left', fontFace: FONTS.display,
      fontSize: 12, bold: true, charSpacing: 3,
      color: DS.textGold,
    });

    addAccentLine(slide, cx + 0.14, cy + 0.68, gw - 0.28, 0.025);

    slide.addText(imp.text, {
      x: cx + 0.14, y: cy + 0.80, w: gw - 0.28, h: gh - 0.95,
      align: 'left', fontFace: FONTS.body,
      fontSize: 11, charSpacing: 0,
      color: DS.textSecondary,
    });
  });
}

// ── SLIDE 10: DEEP QUESTION ───────────────────────────────────────────────────
// Layout:    Full-bleed dark hero — single centered typographic composition
// Glow:      Center (50%, 50%), ember primary (heaviest, most dramatic); secondary amber top
// Key visual: The question alone dominates — maximum typographic weight
// Typography: displayXL italic question + follow-up statements descending
// Darkness:  Darkest slide — almost full black, ember glow only at center
function buildSlide10(pres) {
  const slide = pres.addSlide();

  addDarkBackground(slide,
    { x: 0.50, y: 0.52, r: 0.70, color: DS.glowEmber, opacity: 0.55 },
    { x: 0.50, y: 0.20, r: 0.38, color: DS.glowAmber, opacity: 0.28 }
  );

  addCornerOrnaments(slide, 0.72);

  // Kicker pill
  addPill(slide, SW / 2 - 1.5, 0.22, 3.0, 0.32, '— FRAGE AN EUCH —');

  // Thin accent lines framing the question
  addAccentLine(slide, SW * 0.10, 0.72, SW * 0.80, 0.025);

  // THE BIG QUESTION — two lines in different colors for rhythm
  slide.addText('Wofür würdet', {
    x: 0, y: 0.92, w: SW, h: 1.20,
    align: 'center', fontFace: FONTS.display,
    fontSize: 56, bold: true, italic: true, charSpacing: 3,
    color: DS.textPrimary,
    shadow: shadowObj(20, 0.9, 6),
  });
  slide.addText('ihr heute sterben?', {
    x: 0, y: 2.02, w: SW, h: 1.20,
    align: 'center', fontFace: FONTS.display,
    fontSize: 56, bold: true, italic: true, charSpacing: 3,
    color: DS.gradStart,
    shadow: shadowObj(20, 0.9, 6),
  });

  addAccentLine(slide, SW * 0.10, 3.32, SW * 0.80, 0.038);

  // Statement 1
  slide.addText('Die ersten Christen taten es — ohne Aussicht auf Belohnung in diesem Leben.', {
    x: 0.5, y: 3.55, w: SW - 1.0, h: 0.60,
    align: 'center', fontFace: FONTS.display,
    fontSize: 16, italic: true, charSpacing: 1,
    color: DS.textPrimary,
  });

  // Statement 2
  slide.addText('Welche Idee, welcher Mensch, welcher Glaube wäre es euch wert?', {
    x: 0.5, y: 4.22, w: SW - 1.0, h: 0.52,
    align: 'center', fontFace: FONTS.display,
    fontSize: 15, italic: true, charSpacing: 1,
    color: DS.textGold,
  });

  // Statement 3
  slide.addText('Und wenn nichts — was sagt das über unsere Zeit?', {
    x: 0.5, y: 4.82, w: SW - 1.0, h: 0.52,
    align: 'center', fontFace: FONTS.display,
    fontSize: 14, italic: true, charSpacing: 1,
    color: DS.textAmber,
  });

  // Bottom accent
  addAccentLine(slide, SW * 0.22, 5.45, SW * 0.56, 0.025);

  // Roman numerals row (1–10) as a visual coda
  slide.addText('I · II · III · IV · V · VI · VII · VIII · IX · X', {
    x: 0, y: 5.65, w: SW, h: 0.40,
    align: 'center', fontFace: FONTS.display,
    fontSize: 13, bold: false, charSpacing: 4,
    color: DS.textMuted,
  });

  slide.addText('10 Kapitel. Eine Geschichte. Eure Frage.', {
    x: 0, y: 6.08, w: SW, h: 0.38,
    align: 'center', fontFace: FONTS.body,
    fontSize: 12, italic: true, charSpacing: 2,
    color: DS.textMuted,
  });

  // Bottom ember bar
  slide.addShape('rect', {
    x: 0, y: SH - 0.28, w: SW, h: 0.28,
    fill: { color: DS.glowEmber, transparency: 70 },
  });
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_WIDE';
  pres.title   = 'Die Anfänge der Kirche in der Antike';
  pres.subject = 'Geschichte der frühen Christenheit';
  pres.author  = 'Schulpräsentation Oberstufe';

  console.log('Building Amber-Ancient Dark design system presentation...');

  buildSlide1(pres);  console.log('  [1/10] Titel — Hero full-bleed');
  buildSlide2(pres);  console.log('  [2/10] Götterwelt — Two-column + glass cards');
  buildSlide3(pres);  console.log('  [3/10] Griechischer Einfluss — Four-column grid');
  buildSlide4(pres);  console.log('  [4/10] Geburtsstunde — Timeline + ember glow');
  buildSlide5(pres);  console.log('  [5/10] Paulus — Route timeline');
  buildSlide6(pres);  console.log('  [6/10] Verfolgung — Full-bleed + persecution cards');
  buildSlide7(pres);  console.log('  [7/10] Konstantin — Chi-Rho hero + milestone cards');
  buildSlide8(pres);  console.log('  [8/10] Umkehrung — Two-column reversal timeline');
  buildSlide9(pres);  console.log('  [9/10] Erbe — 2×3 impact card grid');
  buildSlide10(pres); console.log('  [10/10] Tiefe Frage — Full-bleed typographic hero');

  const outPath = path.join(__dirname, 'Anfaenge_Kirche_Antike.pptx');
  await pres.writeFile({ fileName: outPath });
  console.log(`\nPresentation saved: ${outPath}`);
  console.log(`File size: ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB`);
}

main().catch(err => { console.error(err); process.exit(1); });
