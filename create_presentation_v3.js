#!/usr/bin/env node
'use strict';

// PPTX v3 — "Die Anfänge der Kirche in der Antike"
// 8 Folien (von 10 auf 8 gekürzt)
// — Folien 2+3 zusammengefasst: Antike Welt + Griechen als bekanntestes Beispiel
// — Folien 9+10 zusammengefasst: Erbe + Abschlussfrage
// Hintergründe: images_v3/ (keine sichtbaren Lichtquellen, räumliche Tiefe)

const PptxGenJS = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

const SW = 13.333;
const SH = 7.5;
const IMGS = path.join(__dirname, 'images_v3');

// ─── FARBEN ──────────────────────────────────────────────────────────────────
const C = {
  bgDeep:     '030201',
  bgWarm:     '0D0804',
  bgCard:     '0F0B07',
  amber:      'C8820A',
  amberBright:'F5A623',
  amberDim:   '6B4A0F',
  gold:       'D9A441',
  goldLight:  'F0C060',
  goldDim:    'A07828',
  ember:      'A0421A',
  emberBright:'D45A1A',
  rust:       '8B3A10',
  textPrimary:'F5EBD8',
  textSecond: 'C4A882',
  textDim:    '8A7055',
  borderAmber:'C8820A',
  borderDim:  '4A3018',
};

const F = { display: 'Georgia', ui: 'Calibri' };

// ─── SVG HELFER ───────────────────────────────────────────────────────────────
function svgUrl(svg) {
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
}
function imgExists(name) {
  const p = path.join(IMGS, name);
  return fs.existsSync(p) ? p : null;
}

function pillBadge(w, h, text, bgColor, textColor, glowColor) {
  const W = Math.round(w * 96), H = Math.round(h * 96);
  const r = H / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect x="1" y="1" width="${W-2}" height="${H-2}" rx="${r}" fill="#${bgColor}" fill-opacity="0.22" stroke="#${glowColor}" stroke-width="1.2" stroke-opacity="0.65"/>
  <text x="${W/2}" y="${H/2 + 4.5}" text-anchor="middle" font-size="${H*0.46}" font-family="Calibri, sans-serif" fill="#${textColor}" letter-spacing="3" font-weight="600">${text}</text>
</svg>`;
}

function glowLine(w, h, color, opacity = 1) {
  const W = Math.round(w * 96), H = Math.max(3, Math.round(h * 96));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="lg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#${color}" stop-opacity="0"/>
      <stop offset="20%"  stop-color="#${color}" stop-opacity="${opacity}"/>
      <stop offset="80%"  stop-color="#${color}" stop-opacity="${opacity}"/>
      <stop offset="100%" stop-color="#${color}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#lg)"/>
</svg>`;
}

function accentBar(h, color) {
  const H = Math.round(h * 96);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="4" height="${H}" viewBox="0 0 4 ${H}">
  <defs>
    <linearGradient id="vg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#${color}" stop-opacity="0"/>
      <stop offset="30%"  stop-color="#${color}" stop-opacity="1"/>
      <stop offset="70%"  stop-color="#${color}" stop-opacity="1"/>
      <stop offset="100%" stop-color="#${color}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="4" height="${H}" fill="url(#vg)"/>
</svg>`;
}

function timelineCircle(r, fillColor, glowColor) {
  const S = Math.round(r * 2 * 96);
  const cx = S / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <circle cx="${cx}" cy="${cx}" r="${cx*0.55}" fill="#${fillColor}"/>
  <circle cx="${cx}" cy="${cx}" r="${cx*0.78}" fill="none" stroke="#${glowColor}" stroke-width="1.5" opacity="0.6"/>
  <circle cx="${cx}" cy="${cx}" r="${cx*0.95}" fill="none" stroke="#${glowColor}" stroke-width="0.8" opacity="0.22"/>
</svg>`;
}

function separator(w, color) {
  const W = Math.round(w * 96), H = 20, cx = W / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="sg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#${color}" stop-opacity="0"/>
      <stop offset="45%"  stop-color="#${color}" stop-opacity="0.8"/>
      <stop offset="55%"  stop-color="#${color}" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#${color}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <line x1="0" y1="${H/2}" x2="${W}" y2="${H/2}" stroke="url(#sg)" stroke-width="1"/>
  <polygon points="${cx},${H*0.15} ${cx+H*0.45},${H/2} ${cx},${H*0.85} ${cx-H*0.45},${H/2}" fill="#${color}" opacity="0.9"/>
</svg>`;
}

function romanCircle(num, size, fillColor, textColor) {
  const S = Math.round(size * 96), cx = S / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <circle cx="${cx}" cy="${cx}" r="${cx*0.9}" fill="#${fillColor}" opacity="0.9"/>
  <circle cx="${cx}" cy="${cx}" r="${cx*0.9}" fill="none" stroke="#${textColor}" stroke-width="1" opacity="0.38"/>
  <text x="${cx}" y="${cx + S*0.085}" text-anchor="middle" font-size="${S*0.34}" font-family="Georgia" fill="#${textColor}" font-weight="bold">${num}</text>
</svg>`;
}

function gridOverlay(w, h, color, opacity) {
  const W = Math.round(w * 96), H = Math.round(h * 96);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <pattern id="g" width="55" height="55" patternUnits="userSpaceOnUse">
      <path d="M 55 0 L 0 0 0 55" fill="none" stroke="#${color}" stroke-width="0.5" opacity="${opacity}"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
</svg>`;
}

function ambientGlow(w, h, cx_pct, cy_pct, r_pct, color, opacity) {
  const W = Math.round(w * 96), H = Math.round(h * 96);
  const cx = W * cx_pct / 100, cy = H * cy_pct / 100;
  const rx = W * r_pct / 100, ry = rx * 0.56;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="g" cx="${cx_pct}%" cy="${cy_pct}%" r="${r_pct}%" gradientUnits="userSpaceOnUse" fx="${cx}" fy="${cy}">
      <stop offset="0%"   stop-color="#${color}" stop-opacity="${opacity}"/>
      <stop offset="30%"  stop-color="#${color}" stop-opacity="${(opacity*0.55).toFixed(3)}"/>
      <stop offset="60%"  stop-color="#${color}" stop-opacity="${(opacity*0.18).toFixed(3)}"/>
      <stop offset="100%" stop-color="#${color}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#g)"/>
</svg>`;
}

// ─── FOLIENPRIMITIVE ──────────────────────────────────────────────────────────

function addBg(slide, imgFile) {
  const img = imgExists(imgFile);
  if (img) {
    slide.addImage({ path: img, x: 0, y: 0, w: SW, h: SH, sizing: { type: 'cover', w: SW, h: SH } });
  } else {
    slide.addShape('rect', { x: 0, y: 0, w: SW, h: SH, fill: { color: C.bgDeep } });
  }
}

// For real photos: add a dark overlay so text stays readable
function addBgPhoto(slide, imgFile, darknessTransparency = 60) {
  addBg(slide, imgFile);
  slide.addShape('rect', {
    x: 0, y: 0, w: SW, h: SH,
    fill: { color: '000000', transparency: darknessTransparency },
    line: { color: '000000', width: 0, transparency: 100 },
  });
}

function addGrid(slide) {
  slide.addImage({ data: svgUrl(gridOverlay(SW, SH, C.amber, 0.048)), x: 0, y: 0, w: SW, h: SH });
}

function addGlow(slide, cx_pct, cy_pct, r_pct, color, opacity, w = SW, h = SH) {
  slide.addImage({ data: svgUrl(ambientGlow(w, h, cx_pct, cy_pct, r_pct, color, opacity)), x: 0, y: 0, w: w, h: h });
}

function addLine(slide, x, y, w, color = C.gold, opacity = 1, h = 0.035) {
  slide.addImage({ data: svgUrl(glowLine(w, h, color, opacity)), x, y, w, h });
}

function addPill(slide, x, y, w, h, text, bgColor = C.amber, textColor = C.goldLight, glowColor = C.gold) {
  slide.addImage({ data: svgUrl(pillBadge(w, h, text, bgColor, textColor, glowColor)), x, y, w, h });
}

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
    shapeOpts.shadow = { type: 'outer', color: C.amber, opacity: 0.15, blur: 18, offset: 0, angle: 0 };
  }
  slide.addShape('rect', shapeOpts);
  if (opts.highlight !== false) {
    slide.addShape('rect', { x, y, w, h: 0.02, fill: { color: borderColor, transparency: 50 } });
  }
}

function addFeatureCard(slide, x, y, w, h, numeral, title, text) {
  addCard(slide, x, y, w, h, { alpha: 15 });
  const barSvg = accentBar(h * 0.7, C.amber);
  slide.addImage({ data: svgUrl(barSvg), x: x + 0.06, y: y + h * 0.15, w: 0.04, h: h * 0.7 });
  const rcSvg = romanCircle(numeral, 0.36, C.amberDim, C.goldLight);
  slide.addImage({ data: svgUrl(rcSvg), x: x + 0.16, y: y + 0.14, w: 0.36, h: 0.36 });
  slide.addText(title, {
    x: x + 0.60, y: y + 0.13, w: w - 0.70, h: 0.32,
    fontFace: F.display, fontSize: 10, color: C.amber, bold: true, charSpacing: 2,
  });
  slide.addText(text, {
    x: x + 0.60, y: y + 0.48, w: w - 0.70, h: h - 0.60,
    fontFace: F.ui, fontSize: 11.5, color: C.textSecond, lineSpacingMultiple: 1.35,
  });
}

// ─── FOLIE 1: HERO ───────────────────────────────────────────────────────────

function slide01(pres) {
  const s = pres.addSlide();
  addBg(s, 'forum.jpg');
  addGrid(s);

  // Uplighting from below — no visible hotspot
  addGlow(s, 50, 100, 110, C.amber, 0.22);

  s.addText('DIE ANFÄNGE', {
    x: 0, y: 0.9, w: SW, h: 1.1,
    align: 'center', fontFace: F.display, fontSize: 68,
    color: C.textPrimary, bold: true, charSpacing: 10,
    shadow: { type: 'outer', color: C.amber, opacity: 0.55, blur: 22, offset: 0, angle: 0 },
  });
  s.addText('DER KIRCHE IN DER ANTIKE', {
    x: 0, y: 1.95, w: SW, h: 0.75,
    align: 'center', fontFace: F.display, fontSize: 26,
    color: C.gold, charSpacing: 8,
    shadow: { type: 'outer', color: C.amber, opacity: 0.45, blur: 10, offset: 0, angle: 0 },
  });

  addLine(s, SW*0.15, 2.82, SW*0.7);

  s.addText('Wie 12 Fischer aus Galiläa in 300 Jahren die größte\nReligion der Welt begründeten — und dabei das Römische\nReich überlebten.', {
    x: SW*0.12, y: 3.05, w: SW*0.76, h: 1.1,
    align: 'center', fontFace: F.ui, fontSize: 15,
    color: C.textSecond, lineSpacingMultiple: 1.4,
  });

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
      shadow: { type: 'outer', color: C.amber, opacity: 0.38, blur: 8, offset: 0, angle: 0 },
    });
    s.addText(st.label, {
      x: sx, y: 4.85, w: sw, h: 0.3,
      align: 'center', fontFace: F.ui, fontSize: 11,
      color: C.textDim, charSpacing: 1,
    });
  });

  s.addText('EINE SCHULPRÄSENTATION — KLASSE 11/12', {
    x: 0, y: SH - 0.4, w: SW, h: 0.28,
    align: 'center', fontFace: F.ui, fontSize: 9,
    color: C.textDim, charSpacing: 3,
  });
}

// ─── FOLIE 2: DIE ANTIKE WELT + GRIECHEN ALS BEKANNTESTES BEISPIEL ───────────

function slide02(pres) {
  const s = pres.addSlide();
  addBgPhoto(s, 'parthenon_real.jpg', 52);  // Echtes Foto: griechischer Tempel bei Nacht
  addGrid(s);
  // Uplighting von unten — keine sichtbare Lichtquelle
  addGlow(s, 50, 100, 120, C.amber, 0.18);

  addPill(s, 0.3, 0.26, 2.8, 0.27, 'I — ANTIKE WELT & GRIECHENLAND');

  // ── Linke Spalte: Antike Welt (Roman context compact) ─────────────────────
  const lw = SW * 0.43;

  s.addText('In welcher Welt entstand das Christentum?', {
    x: 0.3, y: 0.65, w: lw, h: 0.65,
    fontFace: F.display, fontSize: 20, color: C.textPrimary, bold: true,
    shadow: { type: 'outer', color: C.amber, opacity: 0.45, blur: 14, offset: 0, angle: 0 },
  });

  s.addText('50 Millionen Menschen, tausende Götter — und kein Platz für persönlichen Glauben. Das Christentum betrat eine Welt voller religiöser Pflicht, nicht religiöser Freiheit.', {
    x: 0.3, y: 1.32, w: lw, h: 0.85,
    fontFace: F.ui, fontSize: 12.5, color: C.textSecond, lineSpacingMultiple: 1.42,
  });

  const roman = [
    {
      num: 'I', title: 'POLYTHEISMUS',
      text: '10.000 Götter — für jeden Bach, Beruf und jede Stadt. Glaube war öffentliche Pflicht, keine persönliche Wahl.',
    },
    {
      num: 'II', title: 'KAISERKULT',
      text: 'Den Kaiser als Gott zu verehren war Gesetz. Pontifex Maximus — oberster Priester und Herrscher in einem.',
    },
    {
      num: 'III', title: 'PAX ROMANA & INFRASTRUKTUR',
      text: '5.000 km Straßen, eine Amtssprache, offene Grenzen. Was für Legionen gebaut wurde, nutzten Missionare.',
    },
  ];

  roman.forEach((r, i) => {
    const ry = 2.28 + i * 1.52;
    const rh = 1.36;
    addCard(s, 0.3, ry, lw, rh, { alpha: 12, borderAlpha: 68 });

    addPill(s, 0.44, ry + 0.14, 0.52, 0.24, r.num, C.amberDim, C.goldLight, C.amber);

    s.addText(r.title, {
      x: 1.04, y: ry + 0.12, w: lw - 1.18, h: 0.28,
      fontFace: F.display, fontSize: 10.5, color: C.amber, bold: true, charSpacing: 2,
    });
    addLine(s, 0.44, ry + 0.46, lw - 0.28, C.amberDim, 0.75, 0.022);
    s.addText(r.text, {
      x: 0.44, y: ry + 0.58, w: lw - 0.28, h: 0.72,
      fontFace: F.ui, fontSize: 11.5, color: C.textSecond, lineSpacingMultiple: 1.38,
    });
  });

  // ── Vertikaler Trenner ─────────────────────────────────────────────────────
  s.addShape('line', {
    x: SW * 0.455, y: 0.26, w: 0, h: SH - 0.52,
    line: { color: C.amberDim, width: 0.8, transparency: 40 },
  });

  // ── Rechte Spalte: GRIECHEN — DAS BEKANNTESTE BEISPIEL ────────────────────
  const rx = SW * 0.472;
  const rw = SW - rx - 0.28;

  // Amber-Highlight-Band: Griechen sind DAS bekannteste Beispiel
  s.addShape('rect', {
    x: rx, y: 0.26, w: rw, h: 0.4,
    fill: { color: C.amber, transparency: 72 },
    line: { color: C.amber, width: 0.8, transparency: 35 },
  });
  s.addText('GRIECHEN — DAS BEKANNTESTE BEISPIEL', {
    x: rx + 0.1, y: 0.28, w: rw - 0.2, h: 0.36,
    align: 'center', fontFace: F.display, fontSize: 10.5,
    color: C.goldLight, bold: true, charSpacing: 2,
  });

  s.addText('"Ohne Alexander den Großen hätte Paulus in Athen\neinen Dolmetscher gebraucht."', {
    x: rx, y: 0.76, w: rw, h: 0.88,
    align: 'center', fontFace: F.display, fontSize: 14,
    color: C.textPrimary, italic: true, lineSpacingMultiple: 1.35,
    shadow: { type: 'outer', color: C.amber, opacity: 0.4, blur: 10, offset: 0, angle: 0 },
  });

  addLine(s, rx, 1.72, rw, C.gold, 0.8);

  // 4 griechische Einflüsse — 2×2 Gitter
  const greek = [
    {
      num: 'I', title: 'KOINE-GRIECHISCH',
      text: 'Alexander (323 v.Chr.) hinterlässt eine Weltsprache. Das NT wird auf Griechisch verfasst — nicht auf Jesu Aramäisch.',
    },
    {
      num: 'II', title: 'SEPTUAGINTA',
      text: '~250 v.Chr.: Das AT auf Griechisch. Das theologische Fundament des NT existiert schon Jahrhunderte vor Christus.',
    },
    {
      num: 'III', title: 'DAS STÄDTENETZ',
      text: 'Antiochia · Ephesus · Alexandria. Alexanders Handelsstädte werden Paulus’ Missionsstützpunkte.',
    },
    {
      num: 'IV', title: 'DER LOGOS-BEGRIFF',
      text: 'Platon & die Stoa: "Logos" = göttliches Vernunftprinzip. Johannes übernimmt es: "Im Anfang war das Wort." (Joh 1,1)',
    },
  ];

  const gw = (rw - 0.16) / 2;
  const gh = 2.28;

  greek.forEach((g, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const gx = rx + col * (gw + 0.16);
    const gy = 1.9 + row * (gh + 0.16);

    addCard(s, gx, gy, gw, gh, { alpha: 8, glow: false, borderAlpha: 60 });
    s.addShape('rect', { x: gx, y: gy, w: gw, h: 0.048, fill: { color: C.gold, transparency: 25 } });

    const rcSvg = romanCircle(g.num, 0.38, C.amberDim, C.goldLight);
    s.addImage({ data: svgUrl(rcSvg), x: gx + gw/2 - 0.19, y: gy + 0.12, w: 0.38, h: 0.38 });

    s.addText(g.title, {
      x: gx + 0.08, y: gy + 0.60, w: gw - 0.16, h: 0.36,
      fontFace: F.display, fontSize: 9.5, color: C.amber,
      bold: true, charSpacing: 1.5, align: 'center',
    });
    addLine(s, gx + 0.14, gy + 1.02, gw - 0.28, C.amberDim, 0.65, 0.02);
    s.addText(g.text, {
      x: gx + 0.1, y: gy + 1.14, w: gw - 0.2, h: gh - 1.26,
      fontFace: F.ui, fontSize: 11, color: C.textSecond,
      lineSpacingMultiple: 1.42, align: 'center',
    });
  });
}

// ─── FOLIE 3: DIE GEBURT ─────────────────────────────────────────────────────

function slide03(pres) {
  const s = pres.addSlide();
  addBgPhoto(s, 'ark_jesus.jpg', 50);  // Bundeslade: jüdische Wurzeln → christliche Botschaft
  addGrid(s);
  addGlow(s, 50, 100, 115, C.amber, 0.22);

  addPill(s, 0.3, 0.28, 2.2, 0.27, 'II — JESUS VON NAZARETH');

  s.addText('~30 n. Chr.', {
    x: 0.32, y: 0.7, w: SW*0.47, h: 0.52, fontFace: F.display, fontSize: 14,
    color: C.gold, bold: true, charSpacing: 3,
    shadow: { type: 'outer', color: C.amber, opacity: 0.4, blur: 8, offset: 0, angle: 0 },
  });
  s.addText('Ein Wanderprediger\naus Galiläa wird\nhingerichtet.', {
    x: 0.32, y: 1.22, w: SW*0.48, h: 1.45,
    fontFace: F.display, fontSize: 30, color: C.textPrimary, bold: true,
    shadow: { type: 'outer', color: C.amber, opacity: 0.4, blur: 14, offset: 0, angle: 0 },
  });

  addLine(s, 0.32, 2.82, SW*0.44, C.ember, 0.85);

  s.addText('50 Tage später behaupten seine Anhänger: Er ist zurück.\nDiese Behauptung verändert die Weltgeschichte.', {
    x: 0.32, y: 2.98, w: SW*0.46, h: 0.85,
    fontFace: F.ui, fontSize: 13.5, color: C.textSecond, lineSpacingMultiple: 1.42,
  });

  addCard(s, 0.32, 3.9, SW*0.44, 1.25, { alpha: 10, borderAlpha: 58 });
  s.addText('HISTORISCH GESICHERT', {
    x: 0.46, y: 3.97, w: SW*0.4, h: 0.26,
    fontFace: F.ui, fontSize: 9.5, color: C.amber, bold: true, charSpacing: 1.5,
  });
  s.addText('Die Kreuzigung ist historisch gut belegt (Tacitus Ann. 15,44 · Josephus Ant. 18,3). Die Auferstehung ist Glaubensfrage — historisch können wir nur sagen: etwas hat die Jünger so überzeugt, dass sie dafür ihr Leben riskierten.', {
    x: 0.46, y: 4.27, w: SW*0.4, h: 0.8,
    fontFace: F.ui, fontSize: 11.5, color: C.textSecond, lineSpacingMultiple: 1.35,
  });

  // Rechts: Wie die erste Gemeinde lebte
  const cx = SW * 0.5;
  s.addText('DIE ERSTE GEMEINDE', {
    x: cx, y: 0.28, w: SW - cx - 0.3, h: 0.35,
    fontFace: F.ui, fontSize: 10, color: C.amber, bold: true, charSpacing: 2.5,
  });

  const community = [
    { num: '1', title: 'JERUSALEM, ca. 33–40 n. Chr.', text: 'Apostel als Zeugen. Gemeinschaft aus ~120 Anhängern (Apg 1,15). Gütergemeinschaft — ein radikales soziales Experiment.' },
    { num: '2', title: 'GRIECHISCHE DIASPORA', text: 'Stephanus, der erste Märtyrer (Apg 7), gehört zur griechischsprachigen Gruppe. Spannungen entstehen — die Kirche ist von Anfang an divers.' },
    { num: '3', title: 'ANTIOCHIEN, ca. 43 n. Chr.', text: 'Hier werden die Anhänger Jesu erstmals "Christen" genannt. Der Name bleibt — und mit ihm die Mission.' },
    { num: '4', title: 'DAS APOSTELKONZIL, 48/49 n. Chr.', text: 'Schicksalsfrage: Muss man erst Jude werden, um Christ sein zu können? Paulus setzt sich durch: Nein. Das Christentum öffnet sich der Welt.' },
  ];

  community.forEach((c, i) => {
    const cy = 0.72 + i * 1.66;
    const ch = 1.52;
    addCard(s, cx, cy, SW - cx - 0.3, ch, { alpha: 10, borderAlpha: 65 });

    s.addText(c.title, {
      x: cx + 0.15, y: cy + 0.1, w: SW - cx - 0.5, h: 0.3,
      fontFace: F.display, fontSize: 10.5, color: C.gold, bold: true, charSpacing: 1,
    });
    addLine(s, cx + 0.15, cy + 0.44, SW - cx - 0.5, C.amberDim, 0.65, 0.02);
    s.addText(c.text, {
      x: cx + 0.15, y: cy + 0.56, w: SW - cx - 0.45, h: 0.9,
      fontFace: F.ui, fontSize: 11.5, color: C.textSecond, lineSpacingMultiple: 1.35,
    });
  });
}

// ─── FOLIE 4: PAULUS ─────────────────────────────────────────────────────────

function slide04(pres) {
  const s = pres.addSlide();
  addBgPhoto(s, 'desert_paulus.jpg', 55);  // Wüste bei Nacht: Paulus wandert durch die antike Welt
  addGrid(s);
  addGlow(s, 50, 100, 116, C.amber, 0.18);

  addPill(s, 0.3, 0.28, 2.4, 0.27, 'III — PAULUS & DIE WELTMISSION');

  s.addText('Der Architekt.', {
    x: 0.32, y: 0.68, w: SW*0.45, h: 0.58,
    fontFace: F.display, fontSize: 36, color: C.textPrimary, bold: true, italic: true,
    shadow: { type: 'outer', color: C.amber, opacity: 0.5, blur: 16, offset: 0, angle: 0 },
  });

  addLine(s, 0.32, 1.35, SW*0.44);

  s.addText('Saulus von Tarsus (ca. 5–67 n. Chr.) — gebildeter Jude, römischer Bürger, zunächst Christenverfolger. Nach einer Vision auf dem Weg nach Damaskus (ca. 35 n. Chr.) schreibt er 13 NT-Bücher und bereist das halbe Mittelmeer. Ohne je Jesus persönlich getroffen zu haben.', {
    x: 0.32, y: 1.48, w: SW*0.44, h: 1.05,
    fontFace: F.ui, fontSize: 12, color: C.textSecond, lineSpacingMultiple: 1.4,
  });

  s.addText('3 Missionsreisen · 13 NT-Briefe · nie Jesus persönlich getroffen', {
    x: 0.32, y: 2.65, w: SW*0.44, h: 0.32,
    fontFace: F.display, fontSize: 12, color: C.gold, italic: true, align: 'center',
  });

  addCard(s, 0.32, 3.05, SW*0.44, 1.28, { alpha: 10, borderAlpha: 60 });
  s.addText('WARUM PAULUS ENTSCHEIDEND WAR', {
    x: 0.45, y: 3.12, w: SW*0.4, h: 0.26,
    fontFace: F.ui, fontSize: 9.5, color: C.amber, bold: true, charSpacing: 1.5,
  });
  s.addText('Vor Paulus: Christentum = jüdische Sekte in Judäa.\nNach Paulus: Weltweite Bewegung mit Gemeinden von Jerusalem bis Rom.\nAreopag-Rede in Athen: Er zitiert griechische Dichter, um Griechen zu erreichen — Inkulturation als Methode.', {
    x: 0.45, y: 3.42, w: SW*0.41, h: 0.84,
    fontFace: F.ui, fontSize: 11.5, color: C.textSecond, lineSpacingMultiple: 1.35,
  });

  const cx = SW * 0.5;
  s.addText('PAULUS’ MISSIONSSTATIONEN (45–67 n. Chr.)', {
    x: cx, y: 0.28, w: SW - cx - 0.3, h: 0.35,
    fontFace: F.ui, fontSize: 10, color: C.amber, bold: true, charSpacing: 1.5,
  });

  const stations = [
    { city: 'ANTIOCHIA', note: 'Hier werden Anhänger Jesu erstmals "Christen" genannt (~45 n. Chr.).' },
    { city: 'ATHEN', note: 'Areopag-Rede: zitiert Epimenides & Aratos. Trifft Philosophen auf ihrem eigenen Terrain.' },
    { city: 'KORINTH', note: '18 Monate. Wichtigste Handelsstadt. Brief an die Korinther folgt Jahre später.' },
    { city: 'EPHESUS', note: '3 Jahre Mission gegen den Artemis-Kult. Beinahe-Aufstand der Silberschmiede.' },
    { city: 'ROM', note: 'Stirbt dort ~67 n. Chr. unter Kaiser Nero. Sein Grab: unter dem Petersdom.' },
  ];

  stations.forEach((st, i) => {
    const sy = 0.72 + i * 1.24;
    const cSvg = timelineCircle(0.18, C.ember, C.emberBright);
    s.addImage({ data: svgUrl(cSvg), x: cx + 0.08, y: sy + 0.06, w: 0.36, h: 0.36 });
    if (i < stations.length - 1) {
      s.addShape('line', {
        x: cx + 0.26, y: sy + 0.42, w: 0, h: 0.84,
        line: { color: C.amberDim, width: 1, dashType: 'dash' },
      });
    }
    s.addText(st.city, {
      x: cx + 0.55, y: sy + 0.04, w: 2.5, h: 0.30,
      fontFace: F.display, fontSize: 12.5, color: C.textPrimary, bold: true, charSpacing: 1.5,
    });
    s.addText(st.note, {
      x: cx + 0.55, y: sy + 0.34, w: SW - cx - 0.85, h: 0.78,
      fontFace: F.ui, fontSize: 11.5, color: C.textSecond, lineSpacingMultiple: 1.32,
    });
  });
}

// ─── FOLIE 5: VERFOLGUNG ─────────────────────────────────────────────────────

function slide05(pres) {
  const s = pres.addSlide();
  addBgPhoto(s, 'forest_persecution.jpg', 55);  // Wald im Gegenlicht: Geheimgottesdienste
  addGrid(s);
  addGlow(s, 50, 100, 118, C.amber, 0.20);

  addPill(s, SW/2 - 1.8, 0.28, 3.6, 0.27, 'IV — CHRISTEN IN DER VERFOLGUNG');

  s.addText('"Wie tötet man eine Religion?\nAntwort: Man kann nicht."', {
    x: 0, y: 0.68, w: SW, h: 1.3,
    align: 'center', fontFace: F.display, fontSize: 28,
    color: C.textPrimary, italic: true, bold: false,
    shadow: { type: 'outer', color: C.amber, opacity: 0.45, blur: 18, offset: 0, angle: 0 },
  });

  addLine(s, SW*0.12, 2.1, SW*0.76);

  s.addText('Die Christen weigerten sich, den Kaiser zu verehren. Das war politische Subversion.\nDrei Mal versuchte Rom, sie zu vernichten. Drei Mal scheiterte es.', {
    x: SW*0.08, y: 2.25, w: SW*0.84, h: 0.72,
    fontFace: F.ui, fontSize: 13.5, color: C.textSecond, align: 'center', lineSpacingMultiple: 1.4,
  });

  const events = [
    {
      year: '64 n. Chr.', name: 'NERO', sub: 'Der erste Angriff',
      text: 'Brandstiftung als Vorwand. Christen im Kolosseum hingerichtet. Petrus und Paulus sterben in Rom.',
    },
    {
      year: '250 n. Chr.', name: 'DECIUS', sub: 'Erste Reichsverfolgung',
      text: 'Jeder Bürger muss dem Kaiser opfern und einen Nachweis vorlegen. Wer sich weigert, stirbt.',
    },
    {
      year: '303 n. Chr.', name: 'DIOKLETIAN', sub: 'Die schwerste Welle',
      text: 'Kirchen zerstört, Schriften verbrannt, Tausende getötet — kurz bevor Konstantin alles ändert.',
    },
  ];

  const cw = (SW - 0.9) / 3;
  events.forEach((e, i) => {
    const cx = 0.3 + i * (cw + 0.15);
    const cy = 3.1;
    const ch = 3.74;
    addCard(s, cx, cy, cw, ch, { alpha: 10, glow: true, borderAlpha: 55 });
    s.addShape('rect', { x: cx, y: cy, w: cw, h: 0.055, fill: { color: C.ember, transparency: 20 } });

    s.addText(e.year, {
      x: cx + 0.15, y: cy + 0.14, w: cw - 0.3, h: 0.42,
      fontFace: F.display, fontSize: 20, color: C.goldLight, bold: true,
      shadow: { type: 'outer', color: C.amber, opacity: 0.45, blur: 8, offset: 0, angle: 0 },
    });
    s.addText(e.name, {
      x: cx + 0.15, y: cy + 0.56, w: cw - 0.3, h: 0.3,
      fontFace: F.display, fontSize: 14, color: C.amber, bold: true, charSpacing: 2,
    });
    s.addText(e.sub, {
      x: cx + 0.15, y: cy + 0.86, w: cw - 0.3, h: 0.28,
      fontFace: F.ui, fontSize: 11, color: C.textDim, italic: true,
    });
    addLine(s, cx + 0.15, cy + 1.18, cw - 0.3, C.amberDim, 0.65, 0.02);
    s.addText(e.text, {
      x: cx + 0.15, y: cy + 1.3, w: cw - 0.3, h: 2.3,
      fontFace: F.ui, fontSize: 12, color: C.textSecond, lineSpacingMultiple: 1.4,
    });
  });

  s.addText('"Das Blut der Märtyrer ist Same der Kirche." — Tertullian, ~200 n. Chr.', {
    x: 0, y: SH - 0.38, w: SW, h: 0.3,
    fontFace: F.display, fontSize: 12, color: C.gold, italic: true, align: 'center',
    shadow: { type: 'outer', color: C.amber, opacity: 0.35, blur: 6, offset: 0, angle: 0 },
  });
}

// ─── FOLIE 6: KONSTANTIN ─────────────────────────────────────────────────────

function slide06(pres) {
  const s = pres.addSlide();
  addBgPhoto(s, 'colosseum_real.jpg', 52);  // Kolosseum bei Nacht: Herz des Reiches, das Konstantin übernahm
  addGrid(s);
  addGlow(s, 50, 100, 118, C.gold, 0.22);

  addPill(s, 0.3, 0.28, 2.8, 0.27, 'V — KAISER KONSTANTIN 312–325 n. Chr.');

  s.addText('312 n. Chr.\nEin Kaiser\nhat einen Traum.', {
    x: 0.32, y: 0.68, w: SW*0.44, h: 1.8,
    fontFace: F.display, fontSize: 30, color: C.textPrimary, bold: true,
    shadow: { type: 'outer', color: C.amber, opacity: 0.45, blur: 14, offset: 0, angle: 0 },
  });

  s.addText('Und 350 Jahre Christenverfolgung\nenden innerhalb weniger Monate.', {
    x: 0.32, y: 2.55, w: SW*0.44, h: 0.8,
    fontFace: F.display, fontSize: 15, color: C.gold, italic: true, lineSpacingMultiple: 1.4,
  });

  addCard(s, 0.32, 3.45, SW*0.44, 1.32, { alpha: 10, borderAlpha: 60 });
  s.addText('WAS GENAU PASSIERTE?', {
    x: 0.45, y: 3.52, w: SW*0.4, h: 0.28,
    fontFace: F.ui, fontSize: 10, color: C.amber, bold: true, charSpacing: 1.5,
  });
  s.addText('Vor der Milvischen Brücke (312) soll Konstantin ein Kreuz-Symbol am Himmel gesehen haben: "In diesem Zeichen wirst du siegen." Das Chi-Rho-Symbol (☧) auf die Schilder gemalt — und er gewann. Ob echte Vision oder politisches Kalkül: die Folgen waren real.', {
    x: 0.45, y: 3.83, w: SW*0.42, h: 0.85,
    fontFace: F.ui, fontSize: 11.5, color: C.textSecond, lineSpacingMultiple: 1.38,
  });

  const cx = SW * 0.52;
  s.addText('DREI SCHLÜSSELEREIGNISSE (312–325)', {
    x: cx, y: 0.28, w: SW - cx - 0.3, h: 0.35,
    fontFace: F.ui, fontSize: 10, color: C.amber, bold: true, charSpacing: 1.5,
  });

  const milestones = [
    { year: '312 n. Chr.', title: 'MILVISCHE BRÜCKE', text: 'Konstantin siegt unter dem Chi-Rho. Er schreibt den Sieg dem christlichen Gott zu.' },
    { year: '313 n. Chr.', title: 'MAILÄNDER VEREINBARUNG', text: 'Religionsfreiheit für alle. Kirchen werden zurückgegeben. Christen dürfen offen leben.' },
    { year: '325 n. Chr.', title: 'KONZIL VON NICÄA', text: 'Erste Reichssynode. Glaubensbekenntnis entsteht — bis heute in vielen Kirchen gesprochen.' },
  ];

  milestones.forEach((m, i) => {
    const my = 0.68 + i * 2.1;
    const mh = 1.92;
    addCard(s, cx, my, SW - cx - 0.3, mh, { alpha: 8, glow: true, borderAlpha: 58 });
    s.addText(m.year, {
      x: cx + 0.15, y: my + 0.12, w: 2.2, h: 0.36,
      fontFace: F.display, fontSize: 18, color: C.goldLight, bold: true,
      shadow: { type: 'outer', color: C.amber, opacity: 0.45, blur: 6, offset: 0, angle: 0 },
    });
    s.addText(m.title, {
      x: cx + 0.15, y: my + 0.5, w: SW - cx - 0.5, h: 0.28,
      fontFace: F.display, fontSize: 11, color: C.amber, bold: true, charSpacing: 1.5,
    });
    addLine(s, cx + 0.15, my + 0.82, SW - cx - 0.5, C.amberDim, 0.65, 0.02);
    s.addText(m.text, {
      x: cx + 0.15, y: my + 0.94, w: SW - cx - 0.45, h: 0.9,
      fontFace: F.ui, fontSize: 12, color: C.textSecond, lineSpacingMultiple: 1.38,
    });
  });

  addLine(s, 0.3, SH - 0.52, SW - 0.6, C.amberDim, 0.5, 0.02);
  s.addText('Die Verfolgten sitzen jetzt am Tisch des Kaisers. → Folie VI: Was passiert, wenn die Kirche die Macht bekommt?', {
    x: 0.3, y: SH - 0.48, w: SW - 0.6, h: 0.32,
    fontFace: F.display, fontSize: 11.5, color: C.gold, italic: true, align: 'center',
  });
}

// ─── FOLIE 7: DIE WENDE ──────────────────────────────────────────────────────

function slide07(pres) {
  const s = pres.addSlide();
  addBgPhoto(s, 'cathedral_wende.jpg', 55);  // Rot-beleuchteter Dom: Kirche gewinnt Staatsmacht — die Wende
  addGrid(s);
  addGlow(s, 50, 100, 120, C.gold, 0.15);

  addPill(s, 0.3, 0.28, 2.8, 0.27, 'VI — VOM VERFOLGTEN ZUM TÄTER');

  s.addText('"Plötzlich ist es umgekehrt."', {
    x: 0.32, y: 0.68, w: SW*0.45, h: 0.85,
    fontFace: F.display, fontSize: 28, color: C.textPrimary, italic: true, bold: false,
    shadow: { type: 'outer', color: C.amber, opacity: 0.4, blur: 12, offset: 0, angle: 0 },
  });
  s.addText('Wer NICHT Christ ist,\nwird jetzt verfolgt.', {
    x: 0.32, y: 1.58, w: SW*0.46, h: 0.88,
    fontFace: F.display, fontSize: 18, color: C.ember, bold: true,
    shadow: { type: 'outer', color: C.ember, opacity: 0.35, blur: 8, offset: 0, angle: 0 },
  });

  addLine(s, 0.32, 2.55, SW*0.46);

  s.addText('Die Kirche war selbst Opfer gewesen. Mit staatlicher Macht wurde ein Teil von ihr zum Täter. Eine historische Ironie — und eine Warnung, die bis heute gilt.', {
    x: 0.32, y: 2.7, w: SW*0.46, h: 0.85,
    fontFace: F.ui, fontSize: 13, color: C.textSecond, lineSpacingMultiple: 1.4,
  });

  addCard(s, 0.32, 3.65, SW*0.46, 1.25, { alpha: 10, borderAlpha: 58, borderColor: C.ember });
  s.addText('WICHTIG ZU VERSTEHEN', {
    x: 0.45, y: 3.72, w: SW*0.42, h: 0.28,
    fontFace: F.ui, fontSize: 9.5, color: C.ember, bold: true, charSpacing: 1.5,
  });
  s.addText('Religionsfreiheit als Grundrecht ist eine direkte Reaktion auf diese Geschichte. Artikel 18 der UN-Menschenrechtserklärung existiert, weil Europa erlebt hat, was passiert, wenn der Staat Religion vorschreibt.', {
    x: 0.45, y: 4.04, w: SW*0.41, h: 0.78,
    fontFace: F.ui, fontSize: 11.5, color: C.textSecond, lineSpacingMultiple: 1.35,
  });

  const cx = SW * 0.52;
  s.addText('CHRONOLOGIE DER MACHTWENDE (313–529)', {
    x: cx, y: 0.28, w: SW*0.46, h: 0.35,
    fontFace: F.ui, fontSize: 10, color: C.amber, bold: true, charSpacing: 1.5,
  });

  const events = [
    { year: '313', text: 'Mailand: Religionsfreiheit. Christen dürfen offen existieren.' },
    { year: '321', text: 'Sonntag wird offizieller Ruhetag im Römischen Reich.' },
    { year: '380', text: 'Theodosius: Christentum = Staatsreligion. Andere Kulte = Ketzerei.' },
    { year: '391', text: 'Heidnische Kulte verboten. Opfer für andere Götter = Hochverrat.' },
    { year: '393', text: 'Letzte antike Olympische Spiele. Zeus-gewidmet — daher verboten.' },
    { year: '415', text: 'Hypatia, erste weibliche Philosophin, in Alexandria getötet.' },
    { year: '529', text: 'Justinian schließt Platons Akademie. Ende der antiken Philosophie.' },
  ];

  events.forEach((e, i) => {
    const ey = 0.72 + i * 0.95;
    const dot = timelineCircle(0.17, i <= 1 ? C.amberDim : C.rust, i <= 1 ? C.amber : C.ember);
    s.addImage({ data: svgUrl(dot), x: cx + 0.08, y: ey + 0.05, w: 0.34, h: 0.34 });
    if (i < events.length - 1) {
      s.addShape('line', {
        x: cx + 0.25, y: ey + 0.39, w: 0, h: 0.58,
        line: { color: i <= 1 ? C.amberDim : C.rust, width: 1, dashType: 'dash' },
      });
    }
    s.addText(e.year + ' n. Chr.', {
      x: cx + 0.52, y: ey + 0.02, w: 1.6, h: 0.28,
      fontFace: F.display, fontSize: 10.5, color: i <= 1 ? C.gold : C.ember, bold: true,
    });
    s.addText(e.text, {
      x: cx + 2.18, y: ey + 0.02, w: SW - cx - 2.5, h: 0.85,
      fontFace: F.ui, fontSize: 11, color: C.textSecond, lineSpacingMultiple: 1.28,
    });
  });
}

// ─── FOLIE 8: ERBE & ABSCHLUSSFRAGE (zusammengeführt) ───────────────────────

function slide08(pres) {
  const s = pres.addSlide();
  addBgPhoto(s, 'great_wall_erbe.jpg', 38);  // Chinesische Mauer: das Erbe — was über Jahrhunderte entstand
  addGrid(s);
  addGlow(s, 50, 100, 118, C.gold, 0.15);

  addPill(s, SW/2 - 2.6, 0.25, 5.2, 0.27, 'VII — DAS ERBE DER FRÜHEN KIRCHE');

  // ── Obere Leiste: 4 kompakte Erbe-Punkte ──────────────────────────────────
  addLine(s, 0.3, 0.68, SW - 0.6, C.amberDim, 0.5, 0.02);

  const impacts = [
    { icon: 'I', title: 'SONNTAG', text: 'Konstantin 321 n.Chr. — vorher normaler Arbeitstag' },
    { icon: 'II', title: 'KRANKENHAUS', text: 'Basilius von Cäsarea, ~370 n.Chr. — erste Klinik der Geschichte' },
    { icon: 'III', title: 'MENSCHENWÜRDE', text: 'Paulus, Gal 3,28: "Weder Sklave noch Freier" — für alle' },
    { icon: 'IV', title: 'KALENDER', text: 'v. Chr. / n. Chr. — unser Zeitmaß, weltweit' },
  ];

  const iw = (SW - 0.8) / 4;
  impacts.forEach((imp, i) => {
    const ix = 0.3 + i * (iw + 0.067);
    const iy = 0.78;
    addCard(s, ix, iy, iw, 1.32, { alpha: 12, borderAlpha: 70 });
    s.addShape('rect', { x: ix, y: iy, w: iw, h: 0.04, fill: { color: C.gold, transparency: 30 } });

    const rc = romanCircle(imp.icon, 0.32, C.amberDim, C.goldLight);
    s.addImage({ data: svgUrl(rc), x: ix + iw/2 - 0.16, y: iy + 0.08, w: 0.32, h: 0.32 });

    s.addText(imp.title, {
      x: ix + 0.06, y: iy + 0.5, w: iw - 0.12, h: 0.26,
      fontFace: F.display, fontSize: 9.5, color: C.amber,
      bold: true, charSpacing: 1.5, align: 'center',
    });
    s.addText(imp.text, {
      x: ix + 0.06, y: iy + 0.78, w: iw - 0.12, h: 0.46,
      fontFace: F.ui, fontSize: 10, color: C.textSecond,
      align: 'center', lineSpacingMultiple: 1.28,
    });
  });

  addLine(s, 0.3, 2.2, SW - 0.6, C.amberDim, 0.5, 0.02);

  // ── Abschlussfrage: groß und einprägsam ───────────────────────────────────
  s.addText('— ABSCHLUSSFRAGE —', {
    x: 0, y: 2.34, w: SW, h: 0.36,
    align: 'center', fontFace: F.ui, fontSize: 11,
    color: C.amberDim, charSpacing: 6, bold: true,
  });

  s.addText('Wofür würdet\nihr heute sterben?', {
    x: SW*0.06, y: 2.72, w: SW*0.88, h: 2.2,
    align: 'center', fontFace: F.display, fontSize: 50,
    color: C.textPrimary, bold: true, italic: true,
    shadow: { type: 'outer', color: C.amber, opacity: 0.65, blur: 26, offset: 0, angle: 0 },
  });

  const sepSvg = separator(SW * 0.48, C.gold);
  s.addImage({ data: svgUrl(sepSvg), x: SW*0.26, y: 4.98, w: SW*0.48, h: 0.22 });

  s.addText('Die ersten Christen taten es — ohne Aussicht auf Belohnung in diesem Leben.', {
    x: SW*0.08, y: 5.26, w: SW*0.84, h: 0.48,
    align: 'center', fontFace: F.display, fontSize: 15.5,
    color: C.textSecond, italic: true,
  });
  s.addText('Welche Idee, welcher Mensch, welcher Glaube wäre es euch wert?', {
    x: SW*0.1, y: 5.78, w: SW*0.8, h: 0.42,
    align: 'center', fontFace: F.display, fontSize: 13.5,
    color: C.gold, italic: true,
  });
  s.addText('Und wenn nichts — was sagt das über unsere Zeit?', {
    x: SW*0.15, y: 6.24, w: SW*0.7, h: 0.36,
    align: 'center', fontFace: F.display, fontSize: 12,
    color: C.amberDim, italic: true,
  });

  s.addText('SCHULPRÄSENTATION • OBERSTUFE • 2026', {
    x: 0, y: SH - 0.32, w: SW, h: 0.26,
    align: 'center', fontFace: F.ui, fontSize: 9,
    color: C.amberDim, charSpacing: 3,
  });
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  const pres = new PptxGenJS();
  pres.layout = 'LAYOUT_WIDE';
  pres.title = 'Die Anfänge der Kirche in der Antike';
  pres.subject = 'Geschichte • Religion • Antike';
  pres.author = 'Schulpräsentation Oberstufe 2026';

  console.log('Baue v3 Präsentation (8 Folien, Bilder v3)...');
  slide01(pres); console.log('  [1/8] Hero');
  slide02(pres); console.log('  [2/8] Antike Welt + Griechen (zusammengeführt)');
  slide03(pres); console.log('  [3/8] Die Geburt');
  slide04(pres); console.log('  [4/8] Paulus');
  slide05(pres); console.log('  [5/8] Verfolgung');
  slide06(pres); console.log('  [6/8] Konstantin');
  slide07(pres); console.log('  [7/8] Die Wende');
  slide08(pres); console.log('  [8/8] Erbe & Abschlussfrage (zusammengeführt)');

  // ── SPRECHERNOTIZEN ────────────────────────────────────────────────────────
  const slides = pres.slides;
  const notes = [
    `EINSTIEG (2–3 Min.)\n• Einstiegsfrage: "Was wisst ihr über das frühe Christentum?" — Antworten sammeln.\n• Kontext: 30 n. Chr. = winzige jüdische Randgruppe. 350 Jahre später = Staatsreligion.\n• Die drei Daten (30 / 313 / 380) = die drei Akte — Folie für Folie werden wir sie durchgehen.`,

    `KONTEXT + GRIECHEN (4–5 Min.)\n• Linke Seite: Polytheismus war NORMAL. Es waren die Christen, die als seltsam galten.\n• GRIECHEN als bekanntestes Beispiel — das Bild im Hintergrund (Parthenon) sofort zeigen.\n• Kernbotschaft: "Ohne die Griechen hätte Paulus in Athen einen Dolmetscher gebraucht."\n• Koine-Griechisch: Das NT ist auf Griechisch — nicht auf Aramäisch (Jesu Muttersprache) oder Hebräisch.\n• Septuaginta: Das theologische Fundament existiert 300 Jahre vor Christus — auf Griechisch.\n• Frage an Klasse: "Kennt ihr moderne Beispiele von Staatsreligion?" (Iran, Israel, historisch England).`,

    `DIE GEBURT (4 Min.)\n• Historischer Kern: Kreuzigung ist gut belegt (Tacitus, Josephus). Auferstehung ist Glaubensfrage.\n• Als Historiker sagen wir nur: etwas hat die Jünger so überzeugt, dass sie dafür ihr Leben riskierten.\n• Diskussionsfrage: "Was würde euch so überzeugen, dass ihr alles aufgebt?"\n• Gütergemeinschaft = radikales soziales Experiment — betonen!\n• Apostelkonzil 48/49: Die Schicksalsfrage. Ohne Paulus wäre Christentum eine jüdische Sekte geblieben.`,

    `PAULUS (3–4 Min.)\n• Pointe: Er hat Jesus nie persönlich getroffen — trotzdem schrieb er ~50% des NT.\n• Areopag-Rede: Musterstück der Inkulturation. Er zitiert griechische Dichter, nicht jüdische Schriften.\n• Warum bedeutsam: Vor Paulus = Judäa. Nach Paulus = Mittelmeerraum. Das ist eine Revolution.\n• Frage: "Kann man überzeugend für etwas eintreten, das man nicht aus eigener Erfahrung kennt?"`,

    `VERFOLGUNG (3–4 Min.)\n• Tertullian-Zitat: Märtyrer wirkten als lebende Werbung. Wer stirbt ohne zu widerrufen, muss etwas Echtes glauben.\n• Diokletian-Verfolgung (303): Die härteste — NUR 10 Jahre vor Konstantins Wende.\n• Frage: "Warum kann man eine Idee nicht mit Gewalt töten?"\n• Historiographische Debatte: Wie viele starben wirklich? Zahlen sehr umstritten (früher übertrieben).`,

    `KONSTANTIN (4 Min.)\n• Ob Konstantin wirklich Christ wurde oder es politisches Kalkül war — bis heute umstritten.\n• Argument für echt: Ließ sich kurz vor dem Tod taufen. Hielt am Glauben bis zum Ende.\n• Argument für politisch: Christentum wuchs am schnellsten — gute Wette für einen Kaiser.\n• Konzil von Nicäa: Nizänisches Glaubensbekenntnis — bis heute in Gottesdiensten.\n• BRÜCKE: "Konstantin öffnet die Tür — was passiert, wenn die Kirche hindurchtritt?"`,

    `DIE WENDE (4 Min.)\n• Die unbequeme Wahrheit der Kirchengeschichte.\n• Hypatia (415): Erste bekannte weibliche Mathematikerin der Antike, von christlichem Mob getötet.\n• Olympische Spiele: 393 verboten wegen Zeus-Kult — 1896 wiederbelebt.\n• Diskussionsfrage: "Liegt es in der Natur jeder Macht, andere zu unterdrücken? Hätte es anders gehen können?"\n• Verbindung zu heute: Religionsfreiheit als Grundrecht ist DIREKTE Reaktion auf diese Geschichte.`,

    `ERBE & ABSCHLUSSDISKUSSION (5–10 Min.)\n• Erbe-Punkte kurz interaktiv abfragen: "Wusstet ihr, dass...?" — Schüler oft überrascht vom Sonntag und Krankenhaus.\n• STILLE LASSEN. Die große Frage mindestens 5 Sekunden wirken lassen.\n• Einstieg: "Gibt es heute Menschen, die für ihre Überzeugungen sterben?" (Whistleblower, Aktivisten)\n• "Was unterscheidet 'Wofür man stirbt' von 'Wofür man lebt'?"\n• Keine richtigen/falschen Antworten. Ziel: reflektiertes Denken über Werte und Überzeugungen.`,
  ];

  notes.forEach((note, i) => {
    if (slides[i]) slides[i].addNotes(note);
  });
  console.log('  [OK] Sprechernotizen für alle 8 Folien');

  const out = path.join(__dirname, 'Anfaenge_Kirche_Antike_v3.pptx');
  await pres.writeFile({ fileName: out });
  const kb = (fs.statSync(out).size / 1024).toFixed(0);
  console.log(`\nGespeichert: ${out} (${kb} KB)`);
}

main().catch(e => { console.error(e); process.exit(1); });
