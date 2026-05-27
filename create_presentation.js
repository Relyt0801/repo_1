#!/usr/bin/env node
'use strict';

const PptxGenJS = require('pptxgenjs');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const COLORS = {
  pompejiRed:    '5C1E16',
  pergamentHell: 'EDDFC2',
  pergamentDark: 'D9C39A',
  tintenBraun:   '2B1810',
  goldDark:      'B8862B',
  goldLight:     'D9A441',
  terrakotta:    'A0421A',
  marmorWhite:   'F5EBD8',
  black:         '000000',
  white:         'FFFFFF',
};

const FONTS = {
  headline: 'Georgia',
  body:     'Calibri',
};

const SW = 13.333; // slide width in inches
const SH = 7.5;   // slide height in inches
const IMGS_DIR = path.join(__dirname, 'images');

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function imgPath(name) {
  const p = path.join(IMGS_DIR, name);
  return fs.existsSync(p) ? p : null;
}

function shadowObj() {
  return { type: 'outer', color: '000000', opacity: 0.6, blur: 8, offset: 3, angle: 45 };
}

// Generate Mäander (Greek key) SVG border
function maeanderSvg(width, height, color, bg) {
  const W = Math.round(width * 96);
  const H = Math.round(height * 96);
  const u = Math.floor(H / 3); // unit size
  const repeat = Math.ceil(W / (u * 4));

  let path = `M 0 ${u} `;
  let x = 0;
  for (let i = 0; i < repeat; i++) {
    path += `h ${u} v -${u} h ${u} v ${u * 2} h -${u} v ${u} h ${u * 2} v -${u * 3} h ${u} v ${u * 3} `;
    x += u * 4;
  }
  path += `H ${W}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#${bg}"/>
  <path d="${path}" fill="none" stroke="#${color}" stroke-width="${Math.max(1, Math.floor(u / 3))}"/>
</svg>`;
}

// Generate Chi-Rho symbol SVG
function chiRhoSvg(size, color) {
  const S = size * 96;
  const cx = S / 2;
  const cy = S / 2;
  const r = S * 0.38;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#${color}" stroke-width="${S * 0.03}"/>
  <!-- Rho: vertical bar + half circle -->
  <line x1="${cx}" y1="${cy - r * 0.85}" x2="${cx}" y2="${cy + r * 0.85}" stroke="#${color}" stroke-width="${S * 0.06}" stroke-linecap="round"/>
  <path d="M ${cx} ${cy - r * 0.85} Q ${cx + r * 0.55} ${cy - r * 0.85} ${cx + r * 0.55} ${cy - r * 0.35} Q ${cx + r * 0.55} ${cy + r * 0.1} ${cx} ${cy + r * 0.1}" fill="none" stroke="#${color}" stroke-width="${S * 0.06}"/>
  <!-- Chi: X -->
  <line x1="${cx - r * 0.55}" y1="${cy - r * 0.55}" x2="${cx + r * 0.55}" y2="${cy + r * 0.55}" stroke="#${color}" stroke-width="${S * 0.06}" stroke-linecap="round"/>
  <line x1="${cx + r * 0.55}" y1="${cy - r * 0.55}" x2="${cx - r * 0.55}" y2="${cy + r * 0.55}" stroke="#${color}" stroke-width="${S * 0.06}" stroke-linecap="round"/>
  <!-- Rays -->
  ${[0,45,90,135,180,225,270,315].map(a => {
    const rad = a * Math.PI / 180;
    const x1 = cx + Math.cos(rad) * r;
    const y1 = cy + Math.sin(rad) * r;
    const x2 = cx + Math.cos(rad) * (r * 1.18);
    const y2 = cy + Math.sin(rad) * (r * 1.18);
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#${color}" stroke-width="${S * 0.025}" opacity="0.7"/>`;
  }).join('\n  ')}
</svg>`;
}

// Generate Ichthys fish SVG
function ichthysSvg(w, h, color) {
  const W = w * 96;
  const H = h * 96;
  const cx = W * 0.42;
  const cy = H / 2;
  const rx = W * 0.38;
  const ry = H * 0.38;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <path d="M ${cx - rx} ${cy} Q ${cx} ${cy - ry * 1.3} ${cx + rx} ${cy} Q ${cx} ${cy + ry * 1.3} ${cx - rx} ${cy} Z"
        fill="none" stroke="#${color}" stroke-width="${H * 0.07}"/>
  <path d="M ${cx + rx * 0.8} ${cy - ry * 0.55} L ${W * 0.97} ${cy - ry * 0.75} M ${cx + rx * 0.8} ${cy + ry * 0.55} L ${W * 0.97} ${cy + ry * 0.75}"
        fill="none" stroke="#${color}" stroke-width="${H * 0.06}" stroke-linecap="round"/>
</svg>`;
}

// Golden horizontal line SVG
function goldLineSvg(w, thick, color) {
  const W = Math.round(w * 96);
  const H = Math.max(4, Math.round(thick * 96));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#${color}"/>
</svg>`;
}

// Column card SVG (decorative column top)
function columnCapitalSvg(w, h, bg, accent) {
  const W = Math.round(w * 96);
  const H = Math.round(h * 96);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" rx="4" fill="#${bg}"/>
  <rect x="0" y="0" width="${W}" height="${Math.round(H * 0.08)}" fill="#${accent}"/>
  <rect x="${Math.round(W * 0.1)}" y="${Math.round(H * 0.08)}" width="${Math.round(W * 0.8)}" height="${Math.round(H * 0.06)}" fill="#${accent}" opacity="0.6"/>
</svg>`;
}

function svgToDataUrl(svg) {
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}

// Write SVG to temp file and return path (for pptxgenjs addImage)
function writeTempSvg(svg, name) {
  const p = path.join('/tmp', name);
  fs.writeFileSync(p, svg);
  return p;
}

// Add slide borders (Mäander top + bottom)
function addBorders(slide, bgColor, accentColor) {
  const topSvg = maeanderSvg(SW, 0.28, accentColor, bgColor);
  const botSvg = maeanderSvg(SW, 0.28, accentColor, bgColor);
  slide.addImage({ data: svgToDataUrl(topSvg), x: 0, y: 0, w: SW, h: 0.28 });
  slide.addImage({ data: svgToDataUrl(botSvg), x: 0, y: SH - 0.28, w: SW, h: 0.28 });
}

// Add gold horizontal separator line
function addGoldLine(slide, x, y, w, h = 0.03) {
  const svg = goldLineSvg(w, h, COLORS.goldDark);
  slide.addImage({ data: svgToDataUrl(svg), x, y, w, h });
}

// Add a styled text box
function addText(slide, text, opts) {
  slide.addText(text, opts);
}

// Add dark image overlay
function addImageWithOverlay(slide, imgFile, overlayColor, overlayOpacity, x, y, w, h) {
  const img = imgPath(imgFile);
  if (img) {
    slide.addImage({ path: img, x, y, w, h, sizing: { type: 'cover', w, h } });
  } else {
    // Fallback: colored rectangle
    slide.addShape('rect', { x, y, w, h, fill: { color: COLORS.pompejiRed } });
  }
  // Dark overlay
  slide.addShape('rect', {
    x, y, w, h,
    fill: { color: overlayColor, transparency: Math.round((1 - overlayOpacity) * 100) },
  });
}

// Roman numeral helper
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

// ─── SLIDES ──────────────────────────────────────────────────────────────────

function buildSlide1(pres) {
  const slide = pres.addSlide();
  // Full background image with red overlay
  addImageWithOverlay(slide, 'pantheon.jpg', COLORS.pompejiRed, 0.35, 0, 0, SW, SH);

  // Top line small text
  slide.addText('EINE GESCHICHTE IN 10 KAPITELN', {
    x: 0, y: 0.9, w: SW, h: 0.35,
    align: 'center', fontFace: FONTS.headline, fontSize: 11,
    color: COLORS.goldDark, italic: true, charSpacing: 6,
  });

  // Gold separator
  addGoldLine(slide, SW * 0.2, 1.32, SW * 0.6, 0.04);

  // Main title
  slide.addText('DIE ANFÄNGE DER KIRCHE', {
    x: 0, y: 1.5, w: SW, h: 1.6,
    align: 'center', fontFace: FONTS.headline, fontSize: 58,
    color: COLORS.goldLight, bold: true, charSpacing: 5,
    shadow: shadowObj(),
  });

  // Subtitle
  slide.addText('IN DER ANTIKE', {
    x: 0, y: 3.05, w: SW, h: 0.7,
    align: 'center', fontFace: FONTS.headline, fontSize: 28,
    color: COLORS.marmorWhite, charSpacing: 8,
    shadow: shadowObj(),
  });

  // Gold line
  addGoldLine(slide, SW * 0.15, 3.85, SW * 0.7, 0.04);

  // Teaser
  slide.addText('Aus 12 Männern wurde die größte Religion der Welt. Wie?', {
    x: 0, y: 4.1, w: SW, h: 0.6,
    align: 'center', fontFace: FONTS.headline, fontSize: 16,
    color: COLORS.goldDark, italic: true,
    shadow: shadowObj(),
  });

  // Bottom decorative border
  slide.addShape('rect', { x: 0, y: SH - 0.18, w: SW, h: 0.18, fill: { color: COLORS.goldDark, transparency: 40 } });
}

function buildSlide2(pres) {
  const slide = pres.addSlide();
  // Pergament background
  slide.addShape('rect', { x: 0, y: 0, w: SW, h: SH, fill: { color: COLORS.pergamentHell } });

  // Left half: Forum Romanum image
  addImageWithOverlay(slide, 'forum.jpg', COLORS.pergamentDark, 0.45, 0, 0, SW * 0.42, SH);

  // Mäander borders
  addBorders(slide, COLORS.pergamentHell, COLORS.goldDark);

  // Hook text (left area, on image)
  slide.addText('"Stell dir vor:\n10.000 Götter."', {
    x: 0.15, y: 0.8, w: SW * 0.38, h: 2.2,
    align: 'left', fontFace: FONTS.headline, fontSize: 22,
    color: COLORS.marmorWhite, bold: true, italic: true,
    shadow: shadowObj(),
  });

  // Right: 3 cards
  const cards = [
    { num: 'I', title: 'POLYTHEISMUS', text: 'Für jeden Bach.\nJedes Tor. Jeden Beruf.' },
    { num: 'II', title: 'STAATSKULT', text: 'Den Kaiser anzubeten war Pflicht.\nReligion = Politik.' },
    { num: 'III', title: 'MYSTERIENKULTE', text: 'Geheimreligionen wie Mithras\nversprechen Erlösung.' },
  ];

  cards.forEach((c, i) => {
    const cx = SW * 0.46;
    const cy = 0.55 + i * 1.78;
    const cw = SW * 0.51;
    const ch = 1.55;

    // Card background
    slide.addShape('rect', {
      x: cx, y: cy, w: cw, h: ch,
      fill: { color: COLORS.pergamentDark },
      line: { color: COLORS.goldDark, width: 1.5 },
      shadow: shadowObj(),
    });

    // Gold top bar
    slide.addShape('rect', { x: cx, y: cy, w: cw, h: 0.08, fill: { color: COLORS.goldDark } });

    // Roman numeral in gold circle
    slide.addShape('ellipse', {
      x: cx + 0.15, y: cy + 0.12, w: 0.42, h: 0.42,
      fill: { color: COLORS.goldDark },
    });
    slide.addText(c.num, {
      x: cx + 0.15, y: cy + 0.13, w: 0.42, h: 0.4,
      align: 'center', fontFace: FONTS.headline, fontSize: 12,
      color: COLORS.marmorWhite, bold: true,
    });

    // Title
    slide.addText(c.title, {
      x: cx + 0.65, y: cy + 0.12, w: cw - 0.8, h: 0.42,
      align: 'left', fontFace: FONTS.headline, fontSize: 13,
      color: COLORS.pompejiRed, bold: true, charSpacing: 3,
    });

    // Body text
    slide.addText(c.text, {
      x: cx + 0.15, y: cy + 0.62, w: cw - 0.3, h: 0.8,
      align: 'left', fontFace: FONTS.body, fontSize: 13,
      color: COLORS.tintenBraun,
    });
  });

  // Footer quote
  slide.addShape('rect', { x: 0, y: SH - 0.82, w: SW, h: 0.54, fill: { color: COLORS.terrakotta, transparency: 15 } });
  slide.addText('"Glaube als persönliche Beziehung — diese Idee gab es nicht."', {
    x: 0.3, y: SH - 0.78, w: SW - 0.6, h: 0.46,
    align: 'center', fontFace: FONTS.headline, fontSize: 14,
    color: COLORS.marmorWhite, italic: true,
  });
}

function buildSlide3(pres) {
  const slide = pres.addSlide();
  // Pergament bg
  slide.addShape('rect', { x: 0, y: 0, w: SW, h: SH, fill: { color: COLORS.pergamentHell } });

  // Background: Parthenon photo left
  addImageWithOverlay(slide, 'parthenon.jpg', COLORS.pergamentHell, 0.3, 0, 0, SW, SH);

  addBorders(slide, COLORS.pergamentHell, COLORS.goldDark);

  // Hook
  slide.addText('"Ohne Alexander den Großen\nkein Paulus in Athen."', {
    x: 0.4, y: 0.45, w: SW - 0.8, h: 1.2,
    align: 'center', fontFace: FONTS.headline, fontSize: 24,
    color: COLORS.pompejiRed, bold: true, italic: true,
    shadow: shadowObj(),
  });

  addGoldLine(slide, 0.5, 1.7, SW - 1.0, 0.04);

  // 4 column cards
  const cols = [
    { num: 'I', title: 'SPRACHE', text: 'Koine-Griechisch. Sprache des halben Imperiums. Das NT wird auf Griechisch geschrieben.' },
    { num: 'II', title: 'BIBEL', text: 'Septuaginta (~250 v. Chr.). Juden lesen ihre eigene Schrift bereits griechisch.' },
    { num: 'III', title: 'PHILOSOPHIE', text: '"Im Anfang war der Logos" — Johannes klaut Platon.' },
    { num: 'IV', title: 'STÄDTE', text: 'Alexander hinterlässt ein Städte-Netz. Paulus\' Missionsrouten existieren bereits.' },
  ];

  const colW = (SW - 0.9) / 4;
  cols.forEach((c, i) => {
    const cx = 0.3 + i * (colW + 0.1);
    const cy = 1.85;
    const ch = 4.7;

    // Column card with capital accent
    const capSvg = columnCapitalSvg(colW, ch, COLORS.pergamentDark, COLORS.goldDark);
    slide.addImage({ data: svgToDataUrl(capSvg), x: cx, y: cy, w: colW, h: ch });

    // Gold circle numeral
    slide.addShape('ellipse', {
      x: cx + colW / 2 - 0.25, y: cy + 0.2, w: 0.5, h: 0.5,
      fill: { color: COLORS.goldDark },
    });
    slide.addText(c.num, {
      x: cx + colW / 2 - 0.25, y: cy + 0.21, w: 0.5, h: 0.48,
      align: 'center', fontFace: FONTS.headline, fontSize: 14,
      color: COLORS.marmorWhite, bold: true,
    });

    // Title
    slide.addText(c.title, {
      x: cx + 0.08, y: cy + 0.82, w: colW - 0.16, h: 0.5,
      align: 'center', fontFace: FONTS.headline, fontSize: 12,
      color: COLORS.pompejiRed, bold: true, charSpacing: 2,
    });

    // Gold separator
    addGoldLine(slide, cx + 0.1, cy + 1.38, colW - 0.2, 0.025);

    // Body text
    slide.addText(c.text, {
      x: cx + 0.1, y: cy + 1.52, w: colW - 0.2, h: 3.0,
      align: 'center', fontFace: FONTS.body, fontSize: 11.5,
      color: COLORS.tintenBraun,
    });
  });
}

function buildSlide4(pres) {
  const slide = pres.addSlide();
  slide.addShape('rect', { x: 0, y: 0, w: SW, h: SH, fill: { color: COLORS.pergamentHell } });

  // Catacomb fresco on left
  addImageWithOverlay(slide, 'catacombs.jpg', COLORS.tintenBraun, 0.3, 0, 0, SW * 0.36, SH);

  addBorders(slide, COLORS.pergamentHell, COLORS.goldDark);

  // Hook (right side)
  slide.addText('30 n. Chr.\nEin Wanderprediger\nwird hingerichtet.', {
    x: SW * 0.38, y: 0.42, w: SW * 0.59, h: 1.8,
    align: 'left', fontFace: FONTS.headline, fontSize: 22,
    color: COLORS.pompejiRed, bold: true,
    shadow: shadowObj(),
  });

  slide.addText('50 Tage später behaupten seine Anhänger, er sei zurück.', {
    x: SW * 0.38, y: 2.22, w: SW * 0.59, h: 0.7,
    align: 'left', fontFace: FONTS.body, fontSize: 14,
    color: COLORS.terrakotta, italic: true,
  });

  addGoldLine(slide, SW * 0.38, 3.02, SW * 0.58, 0.04);

  // Timeline (right)
  const events = [
    { year: '~30 n. Chr.', text: 'Tod Jesu. Gekreuzigt unter Pontius Pilatus.' },
    { year: 'Pfingsten', text: '~120 Anhänger. Eine Erfahrung, die alles ändert.' },
    { year: '30–50 n. Chr.', text: 'Erste Gemeinden. Leben in Gütergemeinschaft. Noch als Juden.' },
  ];

  events.forEach((e, i) => {
    const ty = 3.25 + i * 1.0;
    const tx = SW * 0.38;

    // Gold dot
    slide.addShape('ellipse', {
      x: tx, y: ty + 0.05, w: 0.28, h: 0.28,
      fill: { color: COLORS.goldDark },
    });
    // Connector line
    if (i < events.length - 1) {
      slide.addShape('line', {
        x: tx + 0.13, y: ty + 0.33, w: 0, h: 0.7,
        line: { color: COLORS.goldDark, width: 1.5 },
      });
    }

    slide.addText(e.year, {
      x: tx + 0.42, y: ty, w: 2.2, h: 0.32,
      align: 'left', fontFace: FONTS.headline, fontSize: 12,
      color: COLORS.goldDark, bold: true,
    });
    slide.addText(e.text, {
      x: tx + 0.42, y: ty + 0.3, w: SW * 0.57, h: 0.55,
      align: 'left', fontFace: FONTS.body, fontSize: 12.5,
      color: COLORS.tintenBraun,
    });
  });

  // Ichthys fish + caption
  const fishSvg = ichthysSvg(1.2, 0.55, COLORS.goldDark);
  slide.addImage({ data: svgToDataUrl(fishSvg), x: 0.1, y: SH - 1.1, w: 1.2, h: 0.55 });
  slide.addText('ΙΧΘΥΣ — "Jesus Christus Gottes Sohn Retter"', {
    x: 1.4, y: SH - 1.05, w: SW * 0.35, h: 0.45,
    align: 'left', fontFace: FONTS.headline, fontSize: 10,
    color: COLORS.goldDark, italic: true,
  });
}

function buildSlide5(pres) {
  const slide = pres.addSlide();
  slide.addShape('rect', { x: 0, y: 0, w: SW, h: SH, fill: { color: COLORS.pergamentHell } });

  // Right: Ostia/Paul image
  addImageWithOverlay(slide, 'ostia.jpg', COLORS.pergamentDark, 0.35, SW * 0.52, 0, SW * 0.48, SH);

  addBorders(slide, COLORS.pergamentHell, COLORS.goldDark);

  // Hook
  slide.addText('"Der Mann, der Christen jagte,\nwurde ihr wichtigster Missionar."', {
    x: 0.35, y: 0.42, w: SW * 0.5, h: 1.5,
    align: 'left', fontFace: FONTS.headline, fontSize: 20,
    color: COLORS.pompejiRed, bold: true, italic: true,
    shadow: shadowObj(),
  });

  addGoldLine(slide, 0.35, 2.0, SW * 0.5, 0.04);

  // Stations
  const stations = [
    { city: 'Antiochia', note: 'Hier nennt man sie zum ersten Mal "Christen"' },
    { city: 'Korinth', note: '18 Monate. Wichtigste Handelsstadt des Ostens.' },
    { city: 'Athen', note: 'Areopag-Rede. Zitiert griechische Dichter.' },
    { city: 'Ephesus', note: 'Gegen den Artemis-Kult. Beinahe-Aufstand.' },
    { city: 'Rom', note: 'Tod unter Nero, ~64 n. Chr.' },
  ];

  stations.forEach((s, i) => {
    const sy = 2.2 + i * 0.82;
    // Gold marker
    slide.addShape('ellipse', {
      x: 0.35, y: sy + 0.06, w: 0.26, h: 0.26,
      fill: { color: COLORS.goldDark },
    });
    // Connector
    if (i < stations.length - 1) {
      slide.addShape('line', {
        x: 0.46, y: sy + 0.32, w: 0, h: 0.52,
        line: { color: COLORS.goldDark, width: 1.2 },
      });
    }

    slide.addText(s.city.toUpperCase(), {
      x: 0.75, y: sy, w: 2.2, h: 0.3,
      align: 'left', fontFace: FONTS.headline, fontSize: 13,
      color: COLORS.tintenBraun, bold: true, charSpacing: 2,
    });
    slide.addText(s.note, {
      x: 0.75, y: sy + 0.28, w: SW * 0.47, h: 0.36,
      align: 'left', fontFace: FONTS.body, fontSize: 12,
      color: COLORS.terrakotta, italic: true,
    });
  });

  // Footer box
  slide.addShape('rect', { x: 0, y: SH - 0.88, w: SW, h: 0.6, fill: { color: COLORS.terrakotta, transparency: 20 } });
  slide.addText('3 Missionsreisen. 13 Briefe im NT. Wahrscheinlich nie Jesus persönlich getroffen.', {
    x: 0.3, y: SH - 0.86, w: SW - 0.6, h: 0.56,
    align: 'center', fontFace: FONTS.headline, fontSize: 13,
    color: COLORS.marmorWhite, italic: true,
  });
}

function buildSlide6(pres) {
  const slide = pres.addSlide();
  // Full-bleed Colosseum with dark overlay
  addImageWithOverlay(slide, 'colosseum.jpg', '000000', 0.65, 0, 0, SW, SH);

  addBorders(slide, '000000', COLORS.goldDark);

  // Hook
  slide.addText('"Wie tötet man eine Religion?\nAntwort: Man kann nicht."', {
    x: 0, y: 0.5, w: SW, h: 1.6,
    align: 'center', fontFace: FONTS.headline, fontSize: 30,
    color: COLORS.marmorWhite, bold: true, italic: true,
    shadow: shadowObj(),
  });

  addGoldLine(slide, SW * 0.1, 2.2, SW * 0.8, 0.04);

  // Three persecution cards
  const events = [
    { year: '64', name: 'NERO', text: 'Sündenbock nach dem Brand Roms.\nPetrus und Paulus sterben.' },
    { year: '250', name: 'DECIUS', text: 'Erste reichsweite Verfolgung.\nOpferzettel für jeden Bürger.' },
    { year: '303', name: 'DIOKLETIAN', text: 'Die schwerste Welle.\nSchriften verbrannt, tausende Tote.' },
  ];

  const cardW = (SW - 0.9) / 3;
  events.forEach((e, i) => {
    const cx = 0.3 + i * (cardW + 0.15);
    const cy = 2.45;
    const ch = 2.5;

    slide.addShape('rect', {
      x: cx, y: cy, w: cardW, h: ch,
      fill: { color: COLORS.pompejiRed, transparency: 20 },
      line: { color: COLORS.goldDark, width: 1.5 },
    });

    slide.addShape('rect', { x: cx, y: cy, w: cardW, h: 0.07, fill: { color: COLORS.goldDark } });

    slide.addText(e.year, {
      x: cx + 0.1, y: cy + 0.15, w: cardW - 0.2, h: 0.5,
      align: 'center', fontFace: FONTS.headline, fontSize: 26,
      color: COLORS.goldLight, bold: true,
    });

    slide.addText(e.name, {
      x: cx + 0.1, y: cy + 0.68, w: cardW - 0.2, h: 0.4,
      align: 'center', fontFace: FONTS.headline, fontSize: 13,
      color: COLORS.marmorWhite, bold: true, charSpacing: 3,
    });

    addGoldLine(slide, cx + 0.2, cy + 1.12, cardW - 0.4, 0.025);

    slide.addText(e.text, {
      x: cx + 0.12, y: cy + 1.22, w: cardW - 0.24, h: 1.1,
      align: 'center', fontFace: FONTS.body, fontSize: 12,
      color: COLORS.marmorWhite,
    });
  });

  // Tertullian quote
  addGoldLine(slide, SW * 0.1, 5.12, SW * 0.8, 0.04);
  slide.addText('"Das Blut der Märtyrer ist Same der Kirche."', {
    x: 0, y: 5.22, w: SW, h: 0.7,
    align: 'center', fontFace: FONTS.headline, fontSize: 17,
    color: COLORS.goldLight, italic: true,
    shadow: shadowObj(),
  });
  slide.addText('— Tertullian', {
    x: 0, y: 5.88, w: SW, h: 0.35,
    align: 'center', fontFace: FONTS.headline, fontSize: 12,
    color: COLORS.goldDark, italic: true,
  });
}

function buildSlide7(pres) {
  const slide = pres.addSlide();
  // Dark Pompeji-Red background
  slide.addShape('rect', { x: 0, y: 0, w: SW, h: SH, fill: { color: COLORS.pompejiRed } });

  // Constantine arch photo right
  addImageWithOverlay(slide, 'constantine_arch.jpg', COLORS.pompejiRed, 0.5, SW * 0.52, 0, SW * 0.48, SH);

  addBorders(slide, COLORS.pompejiRed, COLORS.goldDark);

  // Chi-Rho symbol left
  const crSvg = chiRhoSvg(2.8, COLORS.goldDark);
  slide.addImage({ data: svgToDataUrl(crSvg), x: 0.3, y: 1.8, w: 2.8, h: 2.8 });

  // Hook top
  slide.addText('312. Ein Kaiser hat einen Traum.', {
    x: SW * 0.04, y: 0.42, w: SW * 0.52, h: 0.72,
    align: 'left', fontFace: FONTS.headline, fontSize: 24,
    color: COLORS.goldLight, bold: true,
    shadow: shadowObj(),
  });

  slide.addText('Und das ganze Reich wechselt die Religion.', {
    x: SW * 0.04, y: 1.12, w: SW * 0.5, h: 0.55,
    align: 'left', fontFace: FONTS.body, fontSize: 15,
    color: COLORS.marmorWhite, italic: true,
  });

  // Three event cards (stacked right-center)
  const events = [
    { year: '312', text: 'Schlacht an der Milvischen Brücke.\nKonstantin siegt unter dem Chi-Rho.' },
    { year: '313', text: 'Mailänder Vereinbarung. Religionsfreiheit.\nKirchen werden zurückgegeben.' },
    { year: '325', text: 'Konzil von Nicäa. Erste reichsweite Synode.\nGlaubensbekenntnis.' },
  ];

  events.forEach((e, i) => {
    const ex = SW * 0.52;
    const ey = 0.38 + i * 1.5;
    const ew = SW * 0.46;
    const eh = 1.35;

    slide.addShape('rect', {
      x: ex, y: ey, w: ew, h: eh,
      fill: { color: '000000', transparency: 55 },
      line: { color: COLORS.goldDark, width: 1.5 },
    });

    slide.addText(e.year, {
      x: ex + 0.12, y: ey + 0.08, w: 1.0, h: 0.5,
      align: 'left', fontFace: FONTS.headline, fontSize: 26,
      color: COLORS.goldLight, bold: true,
    });

    slide.addText(e.text, {
      x: ex + 0.12, y: ey + 0.58, w: ew - 0.24, h: 0.72,
      align: 'left', fontFace: FONTS.body, fontSize: 12.5,
      color: COLORS.marmorWhite,
    });
  });

  // Footer
  addGoldLine(slide, 0.3, SH - 0.72, SW - 0.6, 0.04);
  slide.addText('Die Verfolgten sitzen jetzt am Tisch des Kaisers.', {
    x: 0, y: SH - 0.65, w: SW, h: 0.4,
    align: 'center', fontFace: FONTS.headline, fontSize: 14,
    color: COLORS.goldDark, italic: true,
  });
}

function buildSlide8(pres) {
  const slide = pres.addSlide();
  slide.addShape('rect', { x: 0, y: 0, w: SW, h: SH, fill: { color: COLORS.pergamentHell } });

  // Hagia Sophia interior left
  addImageWithOverlay(slide, 'hagia_sophia.jpg', COLORS.pergamentHell, 0.25, 0, 0, SW * 0.42, SH);

  addBorders(slide, COLORS.pergamentHell, COLORS.goldDark);

  // Hook
  slide.addText('"Plötzlich ist es umgekehrt."', {
    x: SW * 0.44, y: 0.42, w: SW * 0.53, h: 0.72,
    align: 'left', fontFace: FONTS.headline, fontSize: 22,
    color: COLORS.pompejiRed, bold: true, italic: true,
    shadow: shadowObj(),
  });

  slide.addText('Wer NICHT Christ ist, wird verfolgt.', {
    x: SW * 0.44, y: 1.1, w: SW * 0.53, h: 0.55,
    align: 'left', fontFace: FONTS.headline, fontSize: 16,
    color: COLORS.terrakotta, bold: true,
  });

  addGoldLine(slide, SW * 0.44, 1.72, SW * 0.52, 0.04);

  // Timeline
  const events = [
    { year: '380', text: 'Theodosius: Christentum wird Staatsreligion.' },
    { year: '391', text: 'Heidnische Kulte verboten. Opfer = Hochverrat.' },
    { year: '393', text: 'Letzte Olympische Spiele. Sie waren Zeus geweiht.' },
    { year: '415', text: 'Hypatia, Philosophin in Alexandria, wird gelyncht.' },
    { year: '529', text: 'Justinian schließt die Platonische Akademie. Nach 1000 Jahren.' },
  ];

  events.forEach((e, i) => {
    const ty = 1.92 + i * 0.88;
    const tx = SW * 0.44;

    slide.addShape('ellipse', {
      x: tx, y: ty + 0.06, w: 0.26, h: 0.26,
      fill: { color: COLORS.goldDark },
    });
    if (i < events.length - 1) {
      slide.addShape('line', {
        x: tx + 0.12, y: ty + 0.32, w: 0, h: 0.58,
        line: { color: COLORS.goldDark, width: 1.5 },
      });
    }

    slide.addText(e.year, {
      x: tx + 0.4, y: ty, w: 1.0, h: 0.32,
      align: 'left', fontFace: FONTS.headline, fontSize: 13,
      color: COLORS.goldDark, bold: true,
    });
    slide.addText(e.text, {
      x: tx + 1.44, y: ty, w: SW * 0.52, h: 0.7,
      align: 'left', fontFace: FONTS.body, fontSize: 12.5,
      color: COLORS.tintenBraun,
    });
  });

  // Footer
  slide.addShape('rect', { x: 0, y: SH - 0.72, w: SW, h: 0.44, fill: { color: COLORS.terrakotta, transparency: 15 } });
  slide.addText('Die einst Verfolgten wurden zu Verfolgern.', {
    x: 0, y: SH - 0.72, w: SW, h: 0.44,
    align: 'center', fontFace: FONTS.headline, fontSize: 14,
    color: COLORS.marmorWhite, bold: true, italic: true,
  });
}

function buildSlide9(pres) {
  const slide = pres.addSlide();
  slide.addShape('rect', { x: 0, y: 0, w: SW, h: SH, fill: { color: COLORS.pergamentHell } });

  // Basilica photo subtle background
  addImageWithOverlay(slide, 'basilica.jpg', COLORS.pergamentHell, 0.18, 0, 0, SW, SH);

  addBorders(slide, COLORS.pergamentHell, COLORS.goldDark);

  // Hook
  slide.addText('"Warum ist Sonntag frei? Warum schreiben wir 2026?\nWarum gibt es Krankenhäuser?"', {
    x: 0.3, y: 0.38, w: SW - 0.6, h: 1.05,
    align: 'center', fontFace: FONTS.headline, fontSize: 18,
    color: COLORS.pompejiRed, bold: true, italic: true,
    shadow: shadowObj(),
  });

  addGoldLine(slide, 0.5, 1.5, SW - 1.0, 0.04);

  // 2×3 grid of impact cards
  const impacts = [
    { num: 'I', title: 'ZEIT', text: 'Sonntag als Ruhetag.\nUnser Kalender (vor/nach Chr.).' },
    { num: 'II', title: 'SOZIALES', text: 'Erste Hospize, Waisenhäuser.\nArmenfürsorge als Pflicht.' },
    { num: 'III', title: 'BILDUNG', text: 'Klöster retten antikes Wissen\ndurchs Mittelalter.' },
    { num: 'IV', title: 'BAUKUNST', text: 'Basilika statt Tempel.\nKuppelbau. Kirchenfenster.' },
    { num: 'V', title: 'ETHIK', text: 'Nächstenliebe als Pflicht.\nWürde aller — auch Sklaven.' },
    { num: 'VI', title: 'FRAUEN', text: 'Witwen, Diakoninnen, Märtyrerinnen.\nNeue Rollen.' },
  ];

  const cols = 3;
  const rows = 2;
  const gw = (SW - 0.8) / cols;
  const gh = (SH - 2.1) / rows;

  impacts.forEach((imp, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = 0.3 + col * (gw + 0.1);
    const cy = 1.68 + row * (gh + 0.1);

    slide.addShape('rect', {
      x: cx, y: cy, w: gw, h: gh,
      fill: { color: COLORS.pergamentDark },
      line: { color: COLORS.goldDark, width: 1.2 },
      shadow: shadowObj(),
    });

    // Gold circle numeral
    slide.addShape('ellipse', {
      x: cx + 0.12, y: cy + 0.12, w: 0.4, h: 0.4,
      fill: { color: COLORS.goldDark },
    });
    slide.addText(imp.num, {
      x: cx + 0.12, y: cy + 0.13, w: 0.4, h: 0.38,
      align: 'center', fontFace: FONTS.headline, fontSize: 12,
      color: COLORS.marmorWhite, bold: true,
    });

    slide.addText(imp.title, {
      x: cx + 0.6, y: cy + 0.12, w: gw - 0.72, h: 0.4,
      align: 'left', fontFace: FONTS.headline, fontSize: 12,
      color: COLORS.pompejiRed, bold: true, charSpacing: 2,
    });

    addGoldLine(slide, cx + 0.12, cy + 0.6, gw - 0.24, 0.025);

    slide.addText(imp.text, {
      x: cx + 0.12, y: cy + 0.72, w: gw - 0.24, h: gh - 0.86,
      align: 'left', fontFace: FONTS.body, fontSize: 11.5,
      color: COLORS.tintenBraun,
    });
  });
}

function buildSlide10(pres) {
  const slide = pres.addSlide();
  // Dark Pompeji-Red
  slide.addShape('rect', { x: 0, y: 0, w: SW, h: SH, fill: { color: COLORS.pompejiRed } });

  // Subtle texture overlay using pergament
  slide.addShape('rect', {
    x: 0, y: 0, w: SW, h: SH,
    fill: { color: COLORS.tintenBraun, transparency: 50 },
  });

  // Gold banner borders (thick top/bottom)
  slide.addShape('rect', { x: 0, y: 0, w: SW, h: 0.45, fill: { color: COLORS.goldDark, transparency: 25 } });
  slide.addShape('rect', { x: 0, y: SH - 0.45, w: SW, h: 0.45, fill: { color: COLORS.goldDark, transparency: 25 } });

  // Mäander inside the gold banners
  const topBorder = maeanderSvg(SW, 0.45, COLORS.marmorWhite, COLORS.goldDark);
  const botBorder = maeanderSvg(SW, 0.45, COLORS.marmorWhite, COLORS.goldDark);
  slide.addImage({ data: svgToDataUrl(topBorder), x: 0, y: 0, w: SW, h: 0.45 });
  slide.addImage({ data: svgToDataUrl(botBorder), x: 0, y: SH - 0.45, w: SW, h: 0.45 });

  // Preface label
  slide.addText('— FRAGE AN EUCH —', {
    x: 0, y: 0.62, w: SW, h: 0.45,
    align: 'center', fontFace: FONTS.headline, fontSize: 13,
    color: COLORS.goldDark, italic: true, charSpacing: 5,
  });

  // THE BIG QUESTION
  slide.addText('Wofür würdet\nihr heute sterben?', {
    x: 0.5, y: 1.2, w: SW - 1.0, h: 2.6,
    align: 'center', fontFace: FONTS.headline, fontSize: 46,
    color: COLORS.marmorWhite, bold: true, italic: true,
    shadow: { type: 'outer', color: '000000', opacity: 0.8, blur: 12, offset: 4, angle: 45 },
  });

  // Gold separator
  addGoldLine(slide, SW * 0.12, 3.9, SW * 0.76, 0.055);

  // Sub-statements
  slide.addText('Die ersten Christen taten es. Ohne Aussicht auf Belohnung in diesem Leben.', {
    x: 0.4, y: 4.08, w: SW - 0.8, h: 0.65,
    align: 'center', fontFace: FONTS.headline, fontSize: 16,
    color: COLORS.marmorWhite, italic: true,
  });

  slide.addText('Welche Idee, welcher Mensch, welcher Glaube wäre es euch wert?', {
    x: 0.4, y: 4.82, w: SW - 0.8, h: 0.52,
    align: 'center', fontFace: FONTS.headline, fontSize: 14,
    color: COLORS.goldLight, italic: true,
  });

  slide.addText('Und wenn nichts — was sagt das über unsere Zeit?', {
    x: 0.4, y: 5.38, w: SW - 0.8, h: 0.52,
    align: 'center', fontFace: FONTS.headline, fontSize: 13,
    color: COLORS.goldDark, italic: true,
  });
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_WIDE';
  pres.title = 'Die Anfänge der Kirche in der Antike';
  pres.subject = 'Geschichte der frühen Christenheit';
  pres.author = 'Schulpräsentation Oberstufe';

  console.log('Building slides...');

  buildSlide1(pres);  console.log('  [1/10] Titel');
  buildSlide2(pres);  console.log('  [2/10] Götterwelt');
  buildSlide3(pres);  console.log('  [3/10] Die Griechen');
  buildSlide4(pres);  console.log('  [4/10] Die Geburt');
  buildSlide5(pres);  console.log('  [5/10] Paulus');
  buildSlide6(pres);  console.log('  [6/10] Verfolgung');
  buildSlide7(pres);  console.log('  [7/10] Konstantin');
  buildSlide8(pres);  console.log('  [8/10] Zusammenbruch');
  buildSlide9(pres);  console.log('  [9/10] Auswirkungen');
  buildSlide10(pres); console.log('  [10/10] Deep-Frage');

  const outPath = path.join(__dirname, 'Anfaenge_Kirche_Antike.pptx');
  await pres.writeFile({ fileName: outPath });
  console.log(`\nPresentation saved: ${outPath}`);
  console.log(`File size: ${(fs.statSync(outPath).size / 1024).toFixed(1)} KB`);
}

main().catch(err => { console.error(err); process.exit(1); });
