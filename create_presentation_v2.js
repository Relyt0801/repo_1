#!/usr/bin/env node
'use strict';

// PPTX Presentation — "Die Anfänge der Kirche in der Antike"
// Visual style: Proxima-inspired dark UI + amber volumetric glow
// Layout: floating glass cards, grid overlay, modern editorial

const PptxGenJS = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

const SW = 13.333; // inches
const SH = 7.5;
const IMGS = path.join(__dirname, 'images_v2');

// ─── COLOR SYSTEM ────────────────────────────────────────────────────────────
const C = {
  // Backgrounds
  bgDeep:     '030201',  // near black
  bgWarm:     '0D0804',  // dark warm
  bgCard:     '0F0B07',  // card background
  bgCardHi:   '1A1208',  // highlighted card

  // Amber/Gold spectrum
  amber:      'C8820A',  // primary glow
  amberBright:'F5A623',  // bright accent
  amberDim:   '6B4A0F',  // dark amber
  gold:       'D9A441',  // antique gold
  goldLight:  'F0C060',  // bright gold text
  goldDim:    'A07828',  // dim gold

  // Warm accents
  ember:      'A0421A',  // terracotta ember
  emberBright:'D45A1A',  // bright ember
  rust:       '8B3A10',

  // Text
  textPrimary:'F5EBD8',  // warm white (parchment)
  textSecond: 'C4A882',  // muted parchment
  textDim:    '8A7055',  // very muted

  // Borders/Lines
  borderAmber:'C8820A',  // amber border (used with transparency)
  borderDim:  '4A3018',  // very dim border

  // Overlays
  darkOver:   '000000',
  glowOver:   'C8820A',
};

const F = {
  display: 'Georgia',    // serif for impact
  ui:      'Calibri',    // clean for body
};

// ─── SVG HELPERS ─────────────────────────────────────────────────────────────

function svgUrl(svg) {
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

function imgExists(name) {
  const p = path.join(IMGS, name);
  return fs.existsSync(p) ? p : null;
}

// Pill badge SVG (like Proxima "New" badge)
function pillBadge(w, h, text, bgColor, textColor, glowColor) {
  const W = Math.round(w * 96), H = Math.round(h * 96);
  const r = H / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  <rect x="1" y="1" width="${W-2}" height="${H-2}" rx="${r}" fill="#${bgColor}" fill-opacity="0.25" stroke="#${glowColor}" stroke-width="1.2" stroke-opacity="0.7"/>
  <text x="${W/2}" y="${H/2 + 4.5}" text-anchor="middle" font-size="${H*0.48}" font-family="Calibri, sans-serif" fill="#${textColor}" letter-spacing="3" font-weight="600">${text}</text>
</svg>`;
}

// Horizontal glow line
function glowLine(w, h, color, opacity = 1) {
  const W = Math.round(w * 96), H = Math.max(3, Math.round(h * 96));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="lg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#${color}" stop-opacity="0"/>
      <stop offset="20%" stop-color="#${color}" stop-opacity="${opacity}"/>
      <stop offset="80%" stop-color="#${color}" stop-opacity="${opacity}"/>
      <stop offset="100%" stop-color="#${color}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#lg)"/>
  <rect x="${W*0.1}" y="0" width="${W*0.8}" height="${Math.max(1, Math.round(H*0.3))}" fill="url(#lg)" opacity="0.4"/>
</svg>`;
}

// Vertical accent bar
function accentBar(h, color) {
  const H = Math.round(h * 96);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="4" height="${H}" viewBox="0 0 4 ${H}">
  <defs>
    <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#${color}" stop-opacity="0"/>
      <stop offset="30%" stop-color="#${color}" stop-opacity="1"/>
      <stop offset="70%" stop-color="#${color}" stop-opacity="1"/>
      <stop offset="100%" stop-color="#${color}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="4" height="${H}" fill="url(#vg)"/>
  <rect width="1" height="${H}" fill="url(#vg)" opacity="0.5"/>
</svg>`;
}

// Timeline circle marker
function timelineCircle(r, fillColor, glowColor) {
  const S = Math.round(r * 2 * 96);
  const cx = S / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <circle cx="${cx}" cy="${cx}" r="${cx*0.55}" fill="#${fillColor}"/>
  <circle cx="${cx}" cy="${cx}" r="${cx*0.78}" fill="none" stroke="#${glowColor}" stroke-width="1.5" opacity="0.6"/>
  <circle cx="${cx}" cy="${cx}" r="${cx*0.95}" fill="none" stroke="#${glowColor}" stroke-width="0.8" opacity="0.25"/>
</svg>`;
}

// Horizontal decorative separator with center diamond
function separator(w, color) {
  const W = Math.round(w * 96);
  const H = 20;
  const cx = W / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="sg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#${color}" stop-opacity="0"/>
      <stop offset="45%" stop-color="#${color}" stop-opacity="0.8"/>
      <stop offset="55%" stop-color="#${color}" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#${color}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <line x1="0" y1="${H/2}" x2="${W}" y2="${H/2}" stroke="url(#sg)" stroke-width="1"/>
  <polygon points="${cx},${H*0.15} ${cx + H*0.45},${H/2} ${cx},${H*0.85} ${cx - H*0.45},${H/2}" fill="#${color}" opacity="0.9"/>
</svg>`;
}

// Roman numeral circle (for feature grid)
function romanCircle(num, size, fillColor, textColor) {
  const S = Math.round(size * 96);
  const cx = S/2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <circle cx="${cx}" cy="${cx}" r="${cx*0.9}" fill="#${fillColor}" opacity="0.9"/>
  <circle cx="${cx}" cy="${cx}" r="${cx*0.9}" fill="none" stroke="#${textColor}" stroke-width="1" opacity="0.4"/>
  <text x="${cx}" y="${cx + S*0.085}" text-anchor="middle" font-size="${S*0.35}" font-family="Georgia" fill="#${textColor}" font-weight="bold">${num}</text>
</svg>`;
}

// Grid overlay SVG for slide
function gridOverlay(w, h, color, opacity) {
  const W = Math.round(w * 96), H = Math.round(h * 96);
  const gs = 55;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <pattern id="g" width="${gs}" height="${gs}" patternUnits="userSpaceOnUse">
      <path d="M ${gs} 0 L 0 0 0 ${gs}" fill="none" stroke="#${color}" stroke-width="0.5" opacity="${opacity}"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
</svg>`;
}

// Ambient glow blob (like the Proxima center glow)
function ambientGlow(w, h, cx_pct, cy_pct, r_pct, color, opacity) {
  const W = Math.round(w * 96), H = Math.round(h * 96);
  const cx = W * cx_pct / 100;
  const cy = H * cy_pct / 100;
  const rx = W * r_pct / 100;
  const ry = rx * 0.55;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="g" cx="${cx_pct}%" cy="${cy_pct}%" r="${r_pct}%" gradientUnits="userSpaceOnUse" fx="${cx}" fy="${cy}">
      <stop offset="0%" stop-color="#${color}" stop-opacity="${opacity}"/>
      <stop offset="40%" stop-color="#${color}" stop-opacity="${opacity*0.45}"/>
      <stop offset="75%" stop-color="#${color}" stop-opacity="${opacity*0.12}"/>
      <stop offset="100%" stop-color="#${color}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#g)"/>
</svg>`;
}

// ─── SLIDE PRIMITIVES ────────────────────────────────────────────────────────

function addBg(slide, imgFile) {
  const img = imgExists(imgFile);
  if (img) {
    slide.addImage({ path: img, x: 0, y: 0, w: SW, h: SH, sizing: { type: 'cover', w: SW, h: SH } });
  } else {
    slide.addShape('rect', { x: 0, y: 0, w: SW, h: SH, fill: { color: C.bgDeep } });
  }
}

function addGrid(slide) {
  const svg = gridOverlay(SW, SH, C.amber, 0.055);
  slide.addImage({ data: svgUrl(svg), x: 0, y: 0, w: SW, h: SH });
}

function addGlow(slide, cx_pct, cy_pct, r_pct, color, opacity, w = SW, h = SH) {
  const svg = ambientGlow(w, h, cx_pct, cy_pct, r_pct, color, opacity);
  slide.addImage({ data: svgUrl(svg), x: 0, y: 0, w: w, h: h });
}

function addLine(slide, x, y, w, color = C.gold, opacity = 1, h = 0.035) {
  const svg = glowLine(w, h, color, opacity);
  slide.addImage({ data: svgUrl(svg), x, y, w, h });
}

function addPill(slide, x, y, w, h, text, bgColor = C.amber, textColor = C.goldLight, glowColor = C.gold) {
  const svg = pillBadge(w, h, text, bgColor, textColor, glowColor);
  slide.addImage({ data: svgUrl(svg), x, y, w, h });
}

function addTitle(slide, text, x, y, w, h, size, color = C.textPrimary, opts = {}) {
  const textOpts = {
    x, y, w, h,
    fontFace: F.display, fontSize: size, color,
    bold: opts.bold !== false,
    italic: opts.italic || false,
    align: opts.align || 'left',
    charSpacing: opts.charSpacing || 0,
    lineSpacingMultiple: opts.lineSpacingMultiple || 1.2,
  };
  if (opts.shadow) {
    textOpts.shadow = { type: 'outer', color: C.amber, opacity: 0.5, blur: 12, offset: 0, angle: 0 };
  }
  slide.addText(text, textOpts);
}

function addBody(slide, text, x, y, w, h, size, color = C.textSecond, opts = {}) {
  const textOpts = {
    x, y, w, h,
    fontFace: F.ui, fontSize: size, color,
    align: opts.align || 'left',
    lineSpacingMultiple: opts.lineSpacingMultiple || 1.0,
    italic: opts.italic || false,
    bold: opts.bold || false,
    charSpacing: opts.charSpacing || 0,
  };
  slide.addText(text, textOpts);
}

// Glass card (dark semi-transparent with amber border)
function addCard(slide, x, y, w, h, opts = {}) {
  const alpha = opts.alpha || 20;
  const borderColor = opts.borderColor || C.borderAmber;
  const borderAlpha = opts.borderAlpha || 75;

  const shapeOpts = {
    x, y, w, h,
    fill: { color: C.bgCard, transparency: alpha },
    line: { color: borderColor, width: opts.borderW || 0.8, transparency: borderAlpha },
  };
  if (opts.glow) {
    shapeOpts.shadow = { type: 'outer', color: C.amber, opacity: 0.18, blur: 20, offset: 0, angle: 0 };
  }
  slide.addShape('rect', shapeOpts);

  // Subtle top highlight line
  if (opts.highlight !== false) {
    slide.addShape('rect', {
      x, y, w, h: 0.02,
      fill: { color: borderColor, transparency: 50 },
    });
  }
}

// Timeline event (circle + vertical line + content)
function addTimelineEvent(slide, x, y, year, text, isLast = false) {
  const dotR = 0.22;
  const dotY = y + 0.04;
  const lineH = isLast ? 0 : 0.72;

  // Glow circle
  const circleSvg = timelineCircle(dotR, C.amber, C.gold);
  slide.addImage({ data: svgUrl(circleSvg), x: x, y: dotY, w: dotR * 2, h: dotR * 2 });

  // Connector line
  if (!isLast) {
    slide.addShape('line', {
      x: x + dotR, y: dotY + dotR * 2, w: 0, h: lineH,
      line: { color: C.amberDim, width: 1, dashType: 'dash' },
    });
  }

  // Year label
  slide.addText(year, {
    x: x + dotR * 2 + 0.15, y: dotY, w: 1.4, h: 0.3,
    fontFace: F.display, fontSize: 12, color: C.gold,
    bold: true, charSpacing: 1,
  });

  // Content (capped at SW*0.38 to maintain 0.5in right safe zone)
  slide.addText(text, {
    x: x + dotR * 2 + 0.15, y: dotY + 0.28, w: SW * 0.38, h: 0.45,
    fontFace: F.ui, fontSize: 11.5, color: C.textSecond,
  });
}

// Roman numeral feature card
function addFeatureCard(slide, x, y, w, h, numeral, title, text) {
  addCard(slide, x, y, w, h, { alpha: 15, glow: false });

  // Accent bar left
  const barSvg = accentBar(h * 0.7, C.amber);
  slide.addImage({ data: svgUrl(barSvg), x: x + 0.06, y: y + h * 0.15, w: 0.04, h: h * 0.7 });

  // Roman numeral circle
  const rcSvg = romanCircle(numeral, 0.38, C.amberDim, C.goldLight);
  slide.addImage({ data: svgUrl(rcSvg), x: x + 0.16, y: y + 0.15, w: 0.38, h: 0.38 });

  // Title
  slide.addText(title, {
    x: x + 0.62, y: y + 0.14, w: w - 0.72, h: 0.35,
    fontFace: F.display, fontSize: 10.5, color: C.amber,
    bold: true, charSpacing: 2,
  });

  // Body
  slide.addText(text, {
    x: x + 0.16, y: y + 0.58, w: w - 0.26, h: h - 0.72,
    fontFace: F.ui, fontSize: 10.5, color: C.textSecond,
  });
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

// ─── SLIDE BUILDERS ──────────────────────────────────────────────────────────

function slide01(pres) {
  const s = pres.addSlide();
  addBg(s, 'pantheon.jpg');
  addGrid(s);

  // Strong central glow (matching Proxima's center light bloom)
  addGlow(s, 50, 55, 55, C.amber, 0.48);
  addGlow(s, 50, 55, 28, C.goldLight, 0.28);

  // Top pill badge
  addPill(s, SW/2 - 1.5, 0.48, 3.0, 0.28, 'GESCHICHTE • RELIGION • ANTIKE');

  // Main headline
  s.addText('DIE ANFÄNGE', {
    x: 0, y: 0.9, w: SW, h: 1.1,
    align: 'center', fontFace: F.display, fontSize: 68,
    color: C.textPrimary, bold: true, charSpacing: 10,
    shadow: { type: 'outer', color: C.amber, opacity: 0.65, blur: 25, offset: 0, angle: 0 },
  });
  s.addText('DER KIRCHE IN DER ANTIKE', {
    x: 0, y: 1.95, w: SW, h: 0.75,
    align: 'center', fontFace: F.display, fontSize: 26,
    color: C.gold, charSpacing: 8,
    shadow: { type: 'outer', color: C.amber, opacity: 0.5, blur: 12, offset: 0, angle: 0 },
  });

  // Glowing separator
  addLine(s, SW*0.15, 2.82, SW*0.7);

  // Subheadline
  s.addText('Wie 12 Fischer aus Galiläa in 300 Jahren die größte\nReligion der Welt begründeten — und dabei das Römische\nReich überlebten.', {
    x: SW*0.12, y: 3.05, w: SW*0.76, h: 1.1,
    align: 'center', fontFace: F.ui, fontSize: 15,
    color: C.textSecond, lineSpacingMultiple: 1.4,
  });

  // Three stats (like the Proxima hero stats)
  addLine(s, SW*0.15, 4.25, SW*0.7, C.amberDim, 0.6);
  const stats = [
    { val: '~30 n. Chr.', label: 'Beginn in Jerusalem' },
    { val: '313 n. Chr.', label: 'Religionsfreiheit' },
    { val: '380 n. Chr.', label: 'Staatsreligion' },
  ];
  stats.forEach((st, i) => {
    const sx = SW*0.15 + i * (SW*0.7/3);
    const sw = SW*0.7/3;
    s.addText(st.val, {
      x: sx, y: 4.4, w: sw, h: 0.45,
      align: 'center', fontFace: F.display, fontSize: 18,
      color: C.goldLight, bold: true,
      shadow: { type: 'outer', color: C.amber, opacity: 0.4, blur: 8, offset: 0, angle: 0 },
    });
    s.addText(st.label, {
      x: sx, y: 4.85, w: sw, h: 0.3,
      align: 'center', fontFace: F.ui, fontSize: 11,
      color: C.textDim, charSpacing: 1,
    });
  });

  // Bottom disclaimer
  s.addText('EINE SCHULPRÄSENTATION — KLASSE 11/12', {
    x: 0, y: SH - 0.4, w: SW, h: 0.28,
    align: 'center', fontFace: F.ui, fontSize: 9,
    color: C.textDim, charSpacing: 3,
  });
}

function slide02(pres) {
  const s = pres.addSlide();
  addBg(s, 'forum.jpg');
  addGrid(s);
  addGlow(s, 65, 45, 50, C.amber, 0.42);
  addGlow(s, 65, 45, 22, C.amberBright, 0.22);

  addPill(s, 0.3, 0.28, 1.6, 0.27, 'FOLIE I — KONTEXT');

  addTitle(s, 'Die Welt\nvor dem\nChristentum', 0.32, 0.68, SW*0.42, 2.2, 38,
    C.textPrimary, { shadow: true, charSpacing: 1 });

  addLine(s, 0.32, 2.95, SW*0.4);

  s.addText('Bevor die Kirche entstand, lebten über 50 Millionen Menschen im Römischen Reich — in einer Welt mit tausenden Göttern, strikter Hierarchie und Staatsreligion.', {
    x: 0.32, y: 3.12, w: SW*0.42, h: 1.1,
    fontFace: F.ui, fontSize: 13, color: C.textSecond, lineSpacingMultiple: 1.45,
  });

  // Right: 3 context cards
  const cards = [
    {
      num: 'I', title: 'POLYTHEISMUS',
      text: '10.000 Götter. Für jeden Bach, jeden Beruf, jede Stadt einen eigenen. Religion war keine persönliche Überzeugung — sondern öffentliche Pflicht.',
      glow: C.amber,
    },
    {
      num: 'II', title: 'KAISERKULT',
      text: 'Den Kaiser anzubeten war keine Wahl. Er war Pontifex Maximus — oberster Priester. Religion und Staat waren untrennbar.',
      glow: C.ember,
    },
    {
      num: 'III', title: 'MYSTERIENKULTE',
      text: 'Geheimreligionen wie Mithras und Isis versprachen persönliche Erlösung — genau das, was der Staatskult nicht bot. Eine Sehnsucht wuchs.',
      glow: C.gold,
    },
  ];

  const cx = SW*0.47;
  const cw = SW - cx - 0.3;
  cards.forEach((c, i) => {
    const cy = 0.38 + i * 2.22;
    const ch = 2.02;
    addCard(s, cx, cy, cw, ch, { alpha: 12, glow: true, borderAlpha: 65 });

    // Pill numeral
    addPill(s, cx + 0.15, cy + 0.14, 0.55, 0.25, c.num, C.amberDim, C.goldLight, C.amber);

    s.addText(c.title, {
      x: cx + 0.8, y: cy + 0.13, w: cw - 0.95, h: 0.3,
      fontFace: F.display, fontSize: 11.5, color: C.amber,
      bold: true, charSpacing: 2,
    });

    addLine(s, cx + 0.15, cy + 0.5, cw - 0.3, C.amberDim, 0.8, 0.025);

    s.addText(c.text, {
      x: cx + 0.15, y: cy + 0.62, w: cw - 0.3, h: 1.28,
      fontFace: F.ui, fontSize: 12, color: C.textSecond, lineSpacingMultiple: 1.4,
    });
  });

  // Footer hint
  addLine(s, 0.3, SH - 0.48, SW - 0.6, C.amberDim, 0.5, 0.02);
  s.addText('"Glaube als persönliche Beziehung? Diese Idee gab es im Jahr 30 n. Chr. noch nicht."', {
    x: 0.3, y: SH - 0.42, w: SW - 0.6, h: 0.35,
    fontFace: F.display, fontSize: 12, color: C.gold, italic: true, align: 'center',
  });
}

function slide03(pres) {
  const s = pres.addSlide();
  addBg(s, 'parthenon.jpg');
  addGrid(s);
  addGlow(s, 50, 38, 55, C.amber, 0.5);
  addGlow(s, 50, 30, 24, C.amberBright, 0.3);

  addPill(s, SW/2 - 1.5, 0.28, 3.0, 0.27, 'FOLIE II — DER GRIECHISCHE EINFLUSS');

  addTitle(s, '"Ohne Alexander den Großen\nkein Paulus in Athen."', 0, 0.68, SW, 1.45, 26,
    C.textPrimary, { align: 'center', shadow: true, italic: true, bold: false });

  addLine(s, SW*0.18, 2.22, SW*0.64);

  s.addText('Alexander der Große (356–323 v. Chr.) eroberte die halbe Welt — und hinterließ etwas Wichtigeres als Territorien: eine gemeinsame Sprache und Kultur. Das Christentum nutzte beides.', {
    x: SW*0.1, y: 2.38, w: SW*0.8, h: 0.8,
    fontFace: F.ui, fontSize: 13.5, color: C.textSecond, align: 'center', lineSpacingMultiple: 1.45,
  });

  // 4 columns (Greek inheritance)
  const cols = [
    { num: 'I', title: 'GRIECHISCHE SPRACHE', text: 'Koine-Griechisch war die Verkehrssprache des ganzen Ostens. Das Neue Testament wird auf Griechisch geschrieben — damit alle es lesen können.' },
    { num: 'II', title: 'DIE BIBEL AUF GRIECHISCH', text: 'Die Septuaginta (~250 v. Chr.): Jüdische Schriften werden ins Griechische übersetzt. Das Fundament für das NT existiert schon Jahrhunderte früher.' },
    { num: 'III', title: 'PHILOSOPHIE & LOGOS', text: 'Platon und die Stoa sprechen vom "Logos" — dem göttlichen Vernunftprinzip. Johannes greift es auf: "Im Anfang war der Logos." (Joh 1,1)' },
    { num: 'IV', title: 'STÄDTENETZ', text: 'Alexander hinterlässt ein Netz aus Handelsstädten: Antiochia, Ephesus, Alexandria. Genau auf diesen Routen reist Paulus 300 Jahre später.' },
  ];

  const cw = (SW - 0.8) / 4;
  cols.forEach((c, i) => {
    const cx = 0.3 + i * (cw + 0.067);
    const cy = 3.42;
    const ch = 3.52;
    addCard(s, cx, cy, cw, ch, { alpha: 10, glow: false, borderAlpha: 70 });

    // Top amber accent bar
    s.addShape('rect', { x: cx, y: cy, w: cw, h: 0.05, fill: { color: C.amber, transparency: 30 } });

    const rcSvg = romanCircle(c.num, 0.42, C.amberDim, C.goldLight);
    s.addImage({ data: svgUrl(rcSvg), x: cx + cw/2 - 0.21, y: cy + 0.12, w: 0.42, h: 0.42 });

    s.addText(c.title, {
      x: cx + 0.08, y: cy + 0.64, w: cw - 0.16, h: 0.42,
      fontFace: F.display, fontSize: 9.5, color: C.amber,
      bold: true, charSpacing: 1.5, align: 'center',
    });

    addLine(s, cx + 0.15, cy + 1.1, cw - 0.3, C.amberDim, 0.7, 0.02);

    s.addText(c.text, {
      x: cx + 0.1, y: cy + 1.22, w: cw - 0.2, h: 2.12,
      fontFace: F.ui, fontSize: 11, color: C.textSecond, lineSpacingMultiple: 1.45, align: 'center',
    });
  });
}

function slide04(pres) {
  const s = pres.addSlide();
  addBg(s, 'catacombs.jpg');
  addGrid(s);
  addGlow(s, 50, 50, 50, C.amber, 0.55);
  addGlow(s, 50, 50, 22, C.amberBright, 0.32);

  addPill(s, 0.3, 0.28, 1.8, 0.27, 'FOLIE III — DIE GEBURT');

  // Left: powerful hook
  addTitle(s, '~30 n. Chr.', 0.32, 0.7, SW*0.48, 0.65, 14,
    C.gold, { bold: true, charSpacing: 3, shadow: true });
  addTitle(s, 'Ein Wanderprediger\naus Galiläa wird\nhingerichtet.', 0.32, 1.28, SW*0.48, 1.5, 30,
    C.textPrimary, { shadow: true, charSpacing: 0.5 });

  addLine(s, 0.32, 2.92, SW*0.45, C.ember, 0.9);

  s.addText('50 Tage später behaupten seine Anhänger:\nEr ist zurück. Diese Behauptung verändert die Weltgeschichte.', {
    x: 0.32, y: 3.08, w: SW*0.46, h: 0.9,
    fontFace: F.display, fontSize: 14, color: C.textSecond, italic: true, lineSpacingMultiple: 1.5,
  });

  // Key info box
  addCard(s, 0.32, 4.08, SW*0.46, 0.98, { alpha: 10, borderAlpha: 60 });
  s.addText('WER WAR JESUS? — KURZ ERKLÄRT', {
    x: 0.45, y: 4.15, w: SW*0.42, h: 0.28,
    fontFace: F.ui, fontSize: 10, color: C.amber, bold: true, charSpacing: 1.5,
  });
  s.addText('Jüdischer Wanderprediger, ca. 4 v. Chr.–30 n. Chr., aus Nazareth (Galiläa). Predigte Nächstenliebe, Vergebung und die Nähe Gottes. Wurde als Staatsfeind unter Pontius Pilatus gekreuzigt.', {
    x: 0.45, y: 4.46, w: SW*0.42, h: 0.52,
    fontFace: F.ui, fontSize: 11.5, color: C.textSecond, lineSpacingMultiple: 1.35,
  });

  // Right: Timeline
  const cx = SW*0.52;
  addTitle(s, 'DIE ERSTEN SCHRITTE', cx, 0.28, SW*0.46, 0.38, 11,
    C.amber, { charSpacing: 3, bold: true });

  const events = [
    { year: '~30 n. Chr.', text: 'Kreuzigung. Grab drei Tage später leer — laut Berichten der Jünger.' },
    { year: 'Pfingsten (30)', text: 'Ersterfahrung des Heiligen Geistes. ~120 Anhänger in Jerusalem.' },
    { year: '30–50 n. Chr.', text: 'Erste Gemeinden. Gütergemeinschaft. Sehen sich noch als Juden.' },
    { year: '~50 n. Chr.', text: 'Paulus beginnt zu schreiben. Älteste NT-Texte entstehen.' },
    { year: '~70 n. Chr.', text: 'Zerstörung des Tempels in Jerusalem. Christentum trennt sich vom Judentum.' },
  ];

  events.forEach((e, i) => {
    addTimelineEvent(s, cx + 0.1, 0.72 + i * 1.2, e.year, e.text, i === events.length - 1);
  });
}

function slide05(pres) {
  const s = pres.addSlide();
  addBg(s, 'ostia.jpg');
  addGrid(s);
  addGlow(s, 28, 38, 48, C.amber, 0.5);
  addGlow(s, 28, 38, 20, C.amberBright, 0.3);
  addGlow(s, 80, 55, 38, C.ember, 0.22);

  addPill(s, 0.3, 0.28, 1.6, 0.27, 'FOLIE IV — PAULUS');

  addTitle(s, '"Der Mann, der\nChristen jagte,\nwurde ihr wichtigster\nMissionar."', 0.32, 0.68, SW*0.44, 2.4, 24,
    C.textPrimary, { shadow: true, italic: true, bold: false });

  addLine(s, 0.32, 3.2, SW*0.42);

  // Paulus facts
  addCard(s, 0.32, 3.38, SW*0.44, 1.12, { alpha: 12, borderAlpha: 60 });
  s.addText('WER WAR PAULUS? — KURZ ERKLÄRT', {
    x: 0.45, y: 3.45, w: SW*0.4, h: 0.28,
    fontFace: F.ui, fontSize: 10, color: C.amber, bold: true, charSpacing: 1.5,
  });
  s.addText('Saulus von Tarsus (ca. 5–67 n. Chr.), gebildeter Jude und römischer Bürger. Verfolgte zunächst Christen — bis er auf dem Weg nach Damaskus eine Vision hatte (ca. 35 n. Chr.). Schrieb danach 13 der 27 NT-Bücher und bereiste das halbe Mittelmeer.', {
    x: 0.45, y: 3.76, w: SW*0.42, h: 0.65,
    fontFace: F.ui, fontSize: 11.5, color: C.textSecond, lineSpacingMultiple: 1.35,
  });

  s.addText('3 Missionsreisen · 13 NT-Briefe · Nie Jesus persönlich getroffen', {
    x: 0.32, y: 4.6, w: SW*0.44, h: 0.32,
    fontFace: F.display, fontSize: 12, color: C.gold, italic: true, align: 'center',
  });

  // Right: Stations
  const cx = SW*0.5;
  addTitle(s, 'SEINE STATIONEN', cx, 0.28, SW*0.48, 0.38, 11,
    C.amber, { charSpacing: 3, bold: true });

  const stations = [
    { city: 'Antiochia', note: 'Hier werden Anhänger Jesu zum ersten Mal "Christen" genannt (~45 n. Chr.)' },
    { city: 'Korinth', note: '18 Monate. Wichtigste Handelsstadt des Ostens. Wichtige Gemeinde entsteht.' },
    { city: 'Athen', note: 'Areopag-Rede: Er zitiert griechische Dichter und trifft Philosophen auf ihrem Boden.' },
    { city: 'Ephesus', note: '3 Jahre. Missioniert gegen den Artemis-Kult. Beinahe-Aufstand der Silberschmiede.' },
    { city: 'Rom', note: 'Stirbt dort ~67 n. Chr. unter Kaiser Nero. Heute steht dort sein Grab.' },
  ];

  stations.forEach((st, i) => {
    const sy = 0.72 + i * 1.22;
    // Dot
    const cSvg = timelineCircle(0.18, C.ember, C.emberBright);
    s.addImage({ data: svgUrl(cSvg), x: cx + 0.08, y: sy + 0.06, w: 0.36, h: 0.36 });
    if (i < stations.length - 1) {
      s.addShape('line', {
        x: cx + 0.26, y: sy + 0.42, w: 0, h: 0.82,
        line: { color: C.amberDim, width: 1, dashType: 'dash' },
      });
    }
    s.addText(st.city.toUpperCase(), {
      x: cx + 0.55, y: sy + 0.04, w: 2.5, h: 0.32,
      fontFace: F.display, fontSize: 13, color: C.textPrimary, bold: true, charSpacing: 1.5,
    });
    s.addText(st.note, {
      x: cx + 0.55, y: sy + 0.35, w: SW - cx - 0.95, h: 0.75,
      fontFace: F.ui, fontSize: 11.5, color: C.textSecond, lineSpacingMultiple: 1.35,
    });
  });
}

function slide06(pres) {
  const s = pres.addSlide();
  addBg(s, 'colosseum.jpg');
  addGrid(s);
  addGlow(s, 50, 60, 52, C.amber, 0.5);
  addGlow(s, 50, 60, 25, C.amberBright, 0.3);
  addGlow(s, 50, 18, 38, C.ember, 0.22);

  addPill(s, SW/2 - 1.2, 0.28, 2.4, 0.27, 'FOLIE V — DIE VERFOLGUNG');

  addTitle(s, '"Wie tötet man eine Religion?\nAntwort: Man kann nicht."', 0, 0.68, SW, 1.3, 28,
    C.textPrimary, { align: 'center', shadow: true, italic: true, bold: false });

  addLine(s, SW*0.12, 2.1, SW*0.76);

  s.addText('Die Christen weigerten sich, den Kaiser zu verehren. Das war politische Subversion.\nDrei Mal versuchte Rom, sie zu vernichten. Drei Mal scheiterte es.', {
    x: SW*0.08, y: 2.25, w: SW*0.84, h: 0.72,
    fontFace: F.ui, fontSize: 13.5, color: C.textSecond, align: 'center', lineSpacingMultiple: 1.4,
  });

  // Three persecution cards
  const events = [
    {
      year: '64 n. Chr.',
      name: 'NERO',
      sub: 'Der erste Angriff',
      text: 'Nach dem Brand Roms macht Nero die Christen zum Sündenbock. Petrus und Paulus sterben. Erstmals werden Christen im Kolosseum hingerichtet.',
    },
    {
      year: '250 n. Chr.',
      name: 'DECIUS',
      sub: 'Die erste Reichsverfolgung',
      text: 'Jeder Bürger muss dem Kaiser opfern und einen Zettel als Beweis vorweisen. Wer sich weigert, stirbt. Erste staatsorganisierte Christenverfolgung im gesamten Reich.',
    },
    {
      year: '303 n. Chr.',
      name: 'DIOKLETIAN',
      sub: 'Die schwerste Welle',
      text: 'Kirchen werden zerstört, Schriften verbrannt, tausende getötet. Die härteste Verfolgung — ausgelöst kurz bevor Konstantin alles ändern wird.',
    },
  ];

  const cw = (SW - 0.9) / 3;
  events.forEach((e, i) => {
    const cx = 0.3 + i * (cw + 0.15);
    const cy = 3.12;
    const ch = 3.72;
    addCard(s, cx, cy, cw, ch, { alpha: 10, glow: true, borderAlpha: 55 });

    s.addShape('rect', { x: cx, y: cy, w: cw, h: 0.06, fill: { color: C.ember, transparency: 20 } });

    s.addText(e.year, {
      x: cx + 0.15, y: cy + 0.14, w: cw - 0.3, h: 0.42,
      fontFace: F.display, fontSize: 20, color: C.goldLight, bold: true,
      shadow: { type: 'outer', color: C.amber, opacity: 0.5, blur: 10, offset: 0, angle: 0 },
    });

    s.addText(e.name, {
      x: cx + 0.15, y: cy + 0.56, w: cw - 0.3, h: 0.32,
      fontFace: F.display, fontSize: 14, color: C.amber, bold: true, charSpacing: 2,
    });

    s.addText(e.sub, {
      x: cx + 0.15, y: cy + 0.88, w: cw - 0.3, h: 0.3,
      fontFace: F.ui, fontSize: 11, color: C.textDim, italic: true,
    });

    addLine(s, cx + 0.15, cy + 1.22, cw - 0.3, C.amberDim, 0.7, 0.02);

    s.addText(e.text, {
      x: cx + 0.15, y: cy + 1.35, w: cw - 0.3, h: 2.2,
      fontFace: F.ui, fontSize: 12, color: C.textSecond, lineSpacingMultiple: 1.4,
    });
  });

  // Tertullian quote
  s.addText('"Das Blut der Märtyrer ist Same der Kirche." — Tertullian, ~200 n. Chr.', {
    x: 0, y: SH - 0.38, w: SW, h: 0.3,
    fontFace: F.display, fontSize: 12, color: C.gold, italic: true, align: 'center',
    shadow: { type: 'outer', color: C.amber, opacity: 0.4, blur: 8, offset: 0, angle: 0 },
  });
}

function slide07(pres) {
  const s = pres.addSlide();
  addBg(s, 'constantine_arch.jpg');
  addGrid(s);
  addGlow(s, 50, 30, 55, C.gold, 0.62);
  addGlow(s, 50, 22, 26, C.goldLight, 0.45);
  addGlow(s, 20, 65, 35, C.amber, 0.2);

  addPill(s, 0.3, 0.28, 1.8, 0.27, 'FOLIE VI — KONSTANTIN');

  addTitle(s, '312 n. Chr.\nEin Kaiser\nhat einen Traum.', 0.32, 0.68, SW*0.44, 1.8, 30,
    C.textPrimary, { shadow: true, charSpacing: 0.5 });

  s.addText('Und 350 Jahre Christenverfolgung\nenden innerhalb weniger Monate.', {
    x: 0.32, y: 2.55, w: SW*0.44, h: 0.8,
    fontFace: F.display, fontSize: 15, color: C.gold, italic: true, lineSpacingMultiple: 1.4,
  });

  // Explainer box
  addCard(s, 0.32, 3.45, SW*0.44, 1.32, { alpha: 10, borderAlpha: 60 });
  s.addText('WAS GENAU PASSIERTE?', {
    x: 0.45, y: 3.52, w: SW*0.4, h: 0.28,
    fontFace: F.ui, fontSize: 10, color: C.amber, bold: true, charSpacing: 1.5,
  });
  s.addText('Vor der Schlacht an der Milvischen Brücke (312) sah Konstantin ein Kreuz-Symbol am Himmel mit der Botschaft "In diesem Zeichen wirst du siegen." Er ließ das Chi-Rho-Symbol (☧) auf seine Schilder malen — und gewann. Ob Vision oder politisches Kalkül: Die Folgen waren real.', {
    x: 0.45, y: 3.83, w: SW*0.42, h: 0.85,
    fontFace: F.ui, fontSize: 11.5, color: C.textSecond, lineSpacingMultiple: 1.38,
  });

  // Right: three milestone cards
  const cx = SW*0.52;
  addTitle(s, 'DIE DREI MEILENSTEINE', cx, 0.28, SW*0.46, 0.38, 11,
    C.amber, { charSpacing: 3, bold: true });

  const milestones = [
    {
      year: '312 n. Chr.', title: 'MILVISCHE BRÜCKE',
      text: 'Konstantin siegt unter dem Chi-Rho. Er schreibt den Sieg dem christlichen Gott zu.',
    },
    {
      year: '313 n. Chr.', title: 'MAILÄNDER VEREINBARUNG',
      text: 'Religionsfreiheit für alle. Kirchen werden zurückgegeben. Christen dürfen offen leben.',
    },
    {
      year: '325 n. Chr.', title: 'KONZIL VON NICÄA',
      text: 'Erste Reichssynode. Glaubensbekenntnis entsteht. Bis heute in vielen Kirchen gesprochen.',
    },
  ];

  milestones.forEach((m, i) => {
    const my = 0.68 + i * 2.1;
    const mh = 1.92;
    addCard(s, cx, my, SW - cx - 0.3, mh, { alpha: 8, glow: true, borderAlpha: 58 });

    s.addText(m.year, {
      x: cx + 0.15, y: my + 0.12, w: 2.2, h: 0.36,
      fontFace: F.display, fontSize: 18, color: C.goldLight, bold: true,
      shadow: { type: 'outer', color: C.amber, opacity: 0.5, blur: 8, offset: 0, angle: 0 },
    });
    s.addText(m.title, {
      x: cx + 0.15, y: my + 0.5, w: SW - cx - 0.5, h: 0.3,
      fontFace: F.display, fontSize: 11, color: C.amber, bold: true, charSpacing: 1.5,
    });
    addLine(s, cx + 0.15, my + 0.84, SW - cx - 0.5, C.amberDim, 0.7, 0.02);
    s.addText(m.text, {
      x: cx + 0.15, y: my + 0.96, w: SW - cx - 0.45, h: 0.88,
      fontFace: F.ui, fontSize: 12, color: C.textSecond, lineSpacingMultiple: 1.38,
    });
  });

  addLine(s, 0.3, SH - 0.56, SW - 0.6, C.amberDim, 0.5, 0.02);
  s.addText('Die Verfolgten sitzen jetzt am Tisch des Kaisers.', {
    x: 0, y: SH - 0.52, w: SW * 0.65, h: 0.3,
    fontFace: F.display, fontSize: 13, color: C.gold, italic: true, align: 'center',
  });
  // Forward reference — bridges the 325→380 gap the intro promised
  s.addText('→ Folie VII: 55 Jahre später wird das Christentum Staatsreligion.', {
    x: SW * 0.35, y: SH - 0.52, w: SW * 0.62, h: 0.3,
    fontFace: F.ui, fontSize: 11, color: C.amber, align: 'right',
    italic: true,
  });
}

function slide08(pres) {
  const s = pres.addSlide();
  addBg(s, 'hagia_sophia.jpg');
  addGrid(s);
  addGlow(s, 50, 15, 50, C.gold, 0.65);
  addGlow(s, 50, 10, 22, C.goldLight, 0.42);
  addGlow(s, 50, 88, 35, C.amber, 0.2);

  addPill(s, 0.3, 0.28, 1.8, 0.27, 'FOLIE VII — DIE WENDE');

  addTitle(s, '"Plötzlich ist es\numgekehrt."', 0.32, 0.68, SW*0.44, 1.2, 32,
    C.textPrimary, { shadow: true, italic: true, bold: false });
  addTitle(s, 'Wer NICHT Christ ist,\nwird jetzt verfolgt.', 0.32, 1.95, SW*0.46, 0.9, 18,
    C.ember, { charSpacing: 0.5, shadow: true });

  addLine(s, 0.32, 2.95, SW*0.46);

  s.addText('Kaiser Konstantin hatte den Stein ins Rollen gebracht. Aber die Kirche entwickelte schnell politische Macht — und mit Macht kam auch Ausgrenzung.', {
    x: 0.32, y: 3.12, w: SW*0.46, h: 0.85,
    fontFace: F.ui, fontSize: 13, color: C.textSecond, lineSpacingMultiple: 1.4,
  });

  addCard(s, 0.32, 4.05, SW*0.46, 1.22, { alpha: 10, borderAlpha: 60, borderColor: C.ember, borderAlpha: 60 });
  s.addText('WICHTIG ZU VERSTEHEN', {
    x: 0.45, y: 4.12, w: SW*0.42, h: 0.28,
    fontFace: F.ui, fontSize: 10, color: C.ember, bold: true, charSpacing: 1.5,
  });
  s.addText('Die frühe Kirche war selbst Opfer gewesen. Jetzt, mit staatlicher Macht, wurden Teile von ihr zu Tätern. Das ist eine historische Ironie — und eine Warnung, die bis heute gilt.', {
    x: 0.45, y: 4.43, w: SW*0.42, h: 0.75,
    fontFace: F.ui, fontSize: 12, color: C.textSecond, lineSpacingMultiple: 1.38,
  });

  // Right: Timeline of reversal
  const cx = SW * 0.53;
  addTitle(s, 'DIE CHRONOLOGIE DER WENDE', cx, 0.28, SW*0.45, 0.38, 10,
    C.amber, { charSpacing: 3, bold: true });

  const events = [
    { year: '313 n. Chr.', text: 'Religionsfreiheit. Christen dürfen offen existieren.' },
    { year: '321 n. Chr.', text: 'Sonntag wird offizieller Ruhetag im Reich.' },
    { year: '380 n. Chr.', text: 'Theodosius: Christentum wird zur Staatsreligion. Alle anderen sind Ketzer.' },
    { year: '391 n. Chr.', text: 'Heidnische Kulte verboten. Opfer für andere Götter = Hochverrat.' },
    { year: '393 n. Chr.', text: 'Letzte Olympische Spiele der Antike. Zeus-gewidmet, daher verboten.' },
    { year: '415 n. Chr.', text: 'Hypatia, Philosophin in Alexandria, von christlichem Mob getötet.' },
    { year: '529 n. Chr.', text: 'Justinian schließt Platons Akademie in Athen. Ende der antiken Philosophie.' },
  ];

  events.forEach((e, i) => {
    const ey = 0.72 + i * 0.95;
    const dotSvg = timelineCircle(0.17, i <= 1 ? C.amberDim : C.rust, i <= 1 ? C.amber : C.ember);
    s.addImage({ data: svgUrl(dotSvg), x: cx + 0.08, y: ey + 0.05, w: 0.34, h: 0.34 });
    if (i < events.length - 1) {
      s.addShape('line', {
        x: cx + 0.25, y: ey + 0.39, w: 0, h: 0.58,
        line: { color: i <= 1 ? C.amberDim : C.rust, width: 1, dashType: 'dash' },
      });
    }
    s.addText(e.year, {
      x: cx + 0.52, y: ey + 0.02, w: 1.5, h: 0.28,
      fontFace: F.display, fontSize: 10.5, color: i <= 1 ? C.gold : C.ember, bold: true,
    });
    s.addText(e.text, {
      x: cx + 2.08, y: ey + 0.02, w: SW - cx - 2.5, h: 0.85,
      fontFace: F.ui, fontSize: 11, color: C.textSecond, lineSpacingMultiple: 1.3,
    });
  });
}

function slide09(pres) {
  const s = pres.addSlide();
  addBg(s, 'basilica.jpg');
  addGrid(s);
  addGlow(s, 50, 12, 55, C.gold, 0.65);
  addGlow(s, 50, 10, 24, C.goldLight, 0.42);

  addPill(s, SW/2 - 2.0, 0.25, 4.0, 0.27, 'FOLIE VIII — DAS ERBE DES CHRISTENTUMS');

  addTitle(s, '"Warum ist Sonntag frei?\nWarum schreiben wir 2026?\nWarum gibt es Krankenhäuser?"', 0, 0.65, SW, 1.3, 20,
    C.textPrimary, { align: 'center', shadow: true, italic: true, bold: false });

  addLine(s, SW*0.15, 2.05, SW*0.7);

  s.addText('Das frühe Christentum hat unsere Welt geformt — oft ohne dass wir es wissen. Sechs Bereiche, die wir dem frühen Christentum verdanken:', {
    x: SW*0.08, y: 2.18, w: SW*0.84, h: 0.55,
    fontFace: F.ui, fontSize: 13, color: C.textSecond, align: 'center', lineSpacingMultiple: 1.35,
  });

  const impacts = [
    { num: 'I', title: 'KALENDER & ZEIT', text: 'Sonntag als Ruhetag (321 n. Chr.).\nUnser Kalender teilt Zeit in v. Chr. / n. Chr.' },
    { num: 'II', title: 'SOZIALFÜRSORGE', text: 'Erste Hospize & Waisenhäuser (4. Jh.).\nArmenpflege als religiöse Pflicht — eine neue Idee.' },
    { num: 'III', title: 'BILDUNG & WISSEN', text: 'Klöster kopierten antike Texte durch das Mittelalter.\nOhne sie wäre griechische Philosophie verloren.' },
    { num: 'IV', title: 'ARCHITEKTUR', text: 'Basilika-Bauform, Kuppeln, Kirchenfenster.\nRom, Hagia Sophia — weltweit sichtbar.' },
    { num: 'V', title: 'ETHIK & WÜRDE', text: 'Nächstenliebe als Pflicht. Menschenwürde für alle — auch Sklaven. Grundlage der westlichen Ethik.' },
    { num: 'VI', title: 'FRAUEN & NEUE ROLLEN', text: 'Witwen, Diakoninnen, Märtyrerinnen erhielten neue gesellschaftliche Bedeutung.' },
  ];

  const cols = 3, rows = 2;
  const gw = (SW - 0.8) / cols;
  const gh = (SH - 3.0) / rows;

  impacts.forEach((imp, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const cx = 0.3 + col * (gw + 0.1);
    const cy = 2.88 + row * (gh + 0.1);
    addFeatureCard(s, cx, cy, gw, gh, imp.num, imp.title, imp.text);
  });
}

function slide10(pres) {
  const s = pres.addSlide();

  // Full dark with amber glow
  s.addShape('rect', { x: 0, y: 0, w: SW, h: SH, fill: { color: C.bgDeep } });
  addGrid(s);

  // Massive central glow (the dramatic moment)
  addGlow(s, 50, 50, 70, C.amber, 0.38);
  addGlow(s, 50, 50, 38, C.gold, 0.28);
  addGlow(s, 50, 50, 18, C.goldLight, 0.18);

  // Subtle top + bottom amber line (no grid border, just clean lines)
  addLine(s, 0, 0, SW, C.amberDim, 0.6, 0.04);
  addLine(s, 0, SH - 0.04, SW, C.amberDim, 0.6, 0.04);

  // Label
  s.addText('— ABSCHLUSSFRAGE —', {
    x: 0, y: 0.62, w: SW, h: 0.38,
    align: 'center', fontFace: F.ui, fontSize: 12,
    color: C.amberDim, charSpacing: 6, bold: true,
  });

  // THE QUESTION — massive, glowing
  s.addText('Wofür würdet\nihr heute sterben?', {
    x: SW*0.06, y: 1.12, w: SW*0.88, h: 2.8,
    align: 'center', fontFace: F.display, fontSize: 56,
    color: C.textPrimary, bold: true, italic: true,
    shadow: { type: 'outer', color: C.amber, opacity: 0.75, blur: 30, offset: 0, angle: 0 },
  });

  // Elegant separator
  const sepSvg = separator(SW * 0.5, C.gold);
  s.addImage({ data: svgUrl(sepSvg), x: SW*0.25, y: 4.05, w: SW*0.5, h: 0.22 });

  // Three sub-lines, each slightly smaller
  s.addText('Die ersten Christen taten es — ohne Aussicht auf Belohnung in diesem Leben.', {
    x: SW*0.08, y: 4.42, w: SW*0.84, h: 0.55,
    align: 'center', fontFace: F.display, fontSize: 16,
    color: C.textSecond, italic: true,
  });

  s.addText('Welche Idee, welcher Mensch, welcher Glaube wäre es euch wert?', {
    x: SW*0.1, y: 5.02, w: SW*0.8, h: 0.48,
    align: 'center', fontFace: F.display, fontSize: 14,
    color: C.gold, italic: true,
  });

  s.addText('Und wenn nichts — was sagt das über unsere Zeit?', {
    x: SW*0.15, y: 5.55, w: SW*0.7, h: 0.42,
    align: 'center', fontFace: F.display, fontSize: 13,
    color: C.amberDim, italic: true,
  });

  // Bottom: tiny credit
  s.addText('SCHULPRÄSENTATION • OBERSTUFE • 2026', {
    x: 0, y: SH - 0.35, w: SW, h: 0.28,
    align: 'center', fontFace: F.ui, fontSize: 9,
    color: C.amberDim, charSpacing: 3,
  });
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_WIDE';
  pres.title = 'Die Anfänge der Kirche in der Antike';
  pres.subject = 'Geschichte • Religion • Antike';
  pres.author = 'Schulpräsentation Oberstufe 2026';

  console.log('Building v2 presentation (Amber-Dark Proxima style)...');
  slide01(pres); console.log('  [1/10] Hero — Titel');
  slide02(pres); console.log('  [2/10] Kontext — Götterwelt');
  slide03(pres); console.log('  [3/10] Griechischer Einfluss');
  slide04(pres); console.log('  [4/10] Die Geburt');
  slide05(pres); console.log('  [5/10] Paulus');
  slide06(pres); console.log('  [6/10] Verfolgung');
  slide07(pres); console.log('  [7/10] Konstantin');
  slide08(pres); console.log('  [8/10] Die Wende');
  slide09(pres); console.log('  [9/10] Erbe');
  slide10(pres); console.log('  [10/10] Abschlussfrage');

  // ── SPEAKER NOTES ──────────────────────────────────────────────────────────
  const slides = pres.slides;
  const notes = [
    // Slide 1
    `EINSTIEG (2–3 Min.)\n• Einstiegsfrage: "Was wisst ihr über das frühe Christentum?" — Antworten sammeln.\n• Kontext: Im Jahr 30 n. Chr. war Christentum eine winzige jüdische Randgruppe. 350 Jahre später: Staatsreligion des Römischen Reiches.\n• Die drei Daten auf der Folie (30 / 313 / 380) sind die drei Akte der Geschichte — durch die Präsentation führen wir euch Schritt für Schritt durch.`,

    // Slide 2
    `KONTEXT — DIE ANTIKE WELT (3–4 Min.)\n• Wichtig: Polytheismus war NORMAL. Es waren die Christen, die als seltsam galten.\n• Frage an Klasse: "Kennt ihr moderne Beispiele von Staatsreligion?" (Iran, Saudi-Arabien, historisch England).\n• Betonung: Persönlicher Glaube als private Gewissenssache — diese Idee ist 2.000 Jahre alt und stammt aus dem Christentum.`,

    // Slide 3
    `GRIECHENLAND — GRUNDLAGE (3 Min.)\n• Die Pointe: Das Christentum konnte sich nur deshalb so schnell ausbreiten, weil Alexander 300 Jahre früher die Infrastruktur geschaffen hatte.\n• Konkret: Paulus brauchte keinen Dolmetscher. Er sprach Griechisch, alle verstanden ihn.\n• Interessant: Das NT ist auf Griechisch — nicht auf Aramäisch (Jesu Muttersprache) oder Hebräisch (Sprache der Bibel).`,

    // Slide 4
    `DIE GEBURT — DIE ERSTE GEMEINDE (4 Min.)\n• Historischer Kern: Die Kreuzigung Jesu ist historisch gut belegt (Tacitus, Josephus). Die Auferstehung ist Glaubensfrage — als Historiker können wir nur sagen: etwas hat die Jünger so überzeugt, dass sie dafür ihr Leben riskierten.\n• Diskussionsfrage: "Was würde euch so überzeugen, dass ihr alles aufgebt?"\n• Die frühen Christen lebten in Gütergemeinschaft — radikales soziales Experiment.`,

    // Slide 5
    `PAULUS — DER ARCHITEKT (3–4 Min.)\n• Pointe: Paulus hat nie Jesus persönlich getroffen — trotzdem schrieb er fast die Hälfte des NT.\n• Sein Brief an die Römer (ca. 57 n. Chr.) ist das älteste systematische Glaubensdokument des Christentums.\n• Areopag-Rede in Athen (Apg 17): Musterstück der Inkulturation — er zitiert griechische Dichter, um Griechen zu erreichen.\n• Historiographisch: Ohne Paulus wäre Christentum möglicherweise eine jüdische Sekte geblieben.`,

    // Slide 6
    `VERFOLGUNG — WARUM SCHEITERTE ROM? (3–4 Min.)\n• Tertullian-Zitat ist ein Schlüsselsatz: Märtyrer wirkten als lebende Werbung. Wer stirbt, ohne zu widerrufen, muss etwas Echtes glauben.\n• Nero-Verfolgung: Relativ begrenzt, lokal auf Rom. Aber Petrus und Paulus starben dort.\n• Diokletian-Verfolgung: Die härteste — und nur 10 Jahre vor Konstantins Wende. Fast zu spät.\n• Frage: "Warum kann man eine Idee nicht mit Gewalt töten?"\n• Historiographische Debatte: Wie viele Christen starben wirklich? Zahlen sind umstritten.`,

    // Slide 7
    `KONSTANTIN — WENDEPUNKT (4 Min.)\n• WICHTIG: Ob Konstantin wirklich Christ wurde oder ob es politisches Kalkül war, ist bis heute umstritten.\n• Argument für echt: Er bewahrte den Glauben bis zum Lebensende, ließ sich kurz vor dem Tod taufen.\n• Argument für politisch: Das Christentum war die am schnellsten wachsende Religion — gute Wette.\n• Konzil von Nicäa (325): Hier entstand das Nizänische Glaubensbekenntnis — bis heute in katholischen/evangelischen Gottesdiensten.\n• BRÜCKE zu Folie 8: "Konstantin öffnet die Tür — aber was passiert, wenn die Kirche durch diese Tür geht?"`,

    // Slide 8
    `DIE WENDE — OPFER WERDEN TÄTER (4 Min.)\n• Das ist die unbequeme Wahrheit der Kirchengeschichte — und die wichtigste Lektion.\n• Hypatia (415): Erste bekannte weibliche Mathematikerin und Philosophin der Antike, von christlichem Mob getötet. Symbol für den Konflikt.\n• Olympische Spiele: Verboten wegen Zeus-Kult — erst 1896 wiederbelebt.\n• Diskussionsfrage: "Liegt es in der Natur jeder Macht, andere zu unterdrücken — oder hätte die Kirche es anders machen können?"\n• Verbindung zu heute: Religionsfreiheit als Grundrecht ist direkte Reaktion auf diese Geschichte.`,

    // Slide 9
    `ERBE — WAS BLEIBT (3 Min.)\n• Interaktiv: Für jeden Punkt fragen, ob den Schülern das bewusst war.\n• Sonntag: Kaiser Konstantin 321 n. Chr. — Vorher war Sonntag ein normaler Arbeitstag.\n• Krankenhäuser: Das erste Krankenhaus der Geschichte gründete ein Bischof (Basilius von Cäsarea, ~370 n. Chr.).\n• Universitäten: Viele der ältesten Universitäten (Bologna, Oxford, Paris) aus Klosterschulen entstanden.\n• Ethik: "Menschenwürde gilt für alle" — in der antiken Welt galt das explizit nicht für Sklaven.`,

    // Slide 10
    `ABSCHLUSSDISKUSSION (5–10 Min.)\n• Stille lassen. Die Frage wirken lassen — mindestens 5 Sekunden Pause.\n• Mögliche Einstiegsfragen: "Gibt es heute Menschen, die für ihre Überzeugungen sterben?" (Whistleblower, Aktivisten, Soldaten)\n• "Was unterscheidet 'Wofür man stirbt' von 'Wofür man lebt'?"\n• Rückkopplung: "Was hätten die frühen Christen über uns 2026 gedacht?"\n• Bewertungshinweis: Keine richtigen/falschen Antworten. Ziel ist reflektiertes Denken über Werte und Überzeugungen.`,
  ];

  notes.forEach((note, i) => {
    if (slides[i]) slides[i].addNotes(note);
  });
  console.log('  [OK] Speaker notes added to all 10 slides');

  const out = path.join(__dirname, 'Anfaenge_Kirche_Antike_v2.pptx');
  await pres.writeFile({ fileName: out });
  const kb = (require('fs').statSync(out).size / 1024).toFixed(0);
  console.log(`\nSaved: ${out} (${kb} KB)`);
}

main().catch(e => { console.error(e); process.exit(1); });
