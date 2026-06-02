#!/usr/bin/env node
'use strict';

// Generate atmospheric "Amber-Dark Proxima" style backgrounds
// Dark base + volumetric amber glow + grid overlay + architectural silhouettes

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const W = 1920;
const H = 1080;
const OUT = path.join(__dirname, 'images_v2');
fs.mkdirSync(OUT, { recursive: true });

// ─── PALETTE ─────────────────────────────────────────────────────────────────
const P = {
  bg:         '#07050200',   // near black warm
  bgWarm:     '#0D0804',
  amber:      '#C8820A',
  amberBright:'#F5A623',
  amberDim:   '#6B4A0F',
  amberDeep:  '#3A2006',
  ember:      '#A0421A',
  emberBright:'#D45A1A',
  gold:       '#D9A441',
  rust:       '#8B3A10',
  parchment:  '#F5EBD8',
  stone:      '#3D2810',
  dark:       '#0A0603',
};

// ─── SVG PRIMITIVES ──────────────────────────────────────────────────────────

function gridPattern(id, size, color, opacity) {
  return `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">
    <path d="M ${size} 0 L 0 0 0 ${size}" fill="none" stroke="${color}" stroke-width="0.6" opacity="${opacity}"/>
  </pattern>`;
}

function dotGrid(id, spacing, r, color, opacity) {
  return `<pattern id="${id}" width="${spacing}" height="${spacing}" patternUnits="userSpaceOnUse">
    <circle cx="${spacing/2}" cy="${spacing/2}" r="${r}" fill="${color}" opacity="${opacity}"/>
  </pattern>`;
}

function radialGlow(id, cx, cy, r, color, maxOpacity) {
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}" gradientUnits="objectBoundingBox">
    <stop offset="0%" stop-color="${color}" stop-opacity="${maxOpacity}"/>
    <stop offset="35%" stop-color="${color}" stop-opacity="${maxOpacity * 0.55}"/>
    <stop offset="65%" stop-color="${color}" stop-opacity="${maxOpacity * 0.2}"/>
    <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
  </radialGradient>`;
}

function vignette(id) {
  return `<radialGradient id="${id}" cx="50%" cy="50%" r="75%" gradientUnits="userSpaceOnUse" fx="960" fy="540">
    <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
    <stop offset="60%" stop-color="#000000" stop-opacity="0.35"/>
    <stop offset="100%" stop-color="#000000" stop-opacity="0.88"/>
  </radialGradient>`;
}

function linGrad(id, x1, y1, x2, y2, stops) {
  const s = stops.map(([off, c, o]) => `<stop offset="${off}%" stop-color="${c}" stop-opacity="${o}"/>`).join('');
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" gradientUnits="objectBoundingBox">${s}</linearGradient>`;
}

// Horizontal glow band (like the bottom glow in Proxima)
function horizBand(id, cy, spread, color, opacity) {
  return `<radialGradient id="${id}" cx="50%" cy="${cy}%" r="${spread}%" gradientUnits="userSpaceOnUse" fx="960" fy="${(cy/100*H).toFixed(0)}">
    <stop offset="0%" stop-color="${color}" stop-opacity="${opacity}"/>
    <stop offset="40%" stop-color="${color}" stop-opacity="${opacity * 0.4}"/>
    <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
  </radialGradient>`;
}

// Architectural silhouette helpers
function column(x, y, w, h, flutes = 6) {
  let g = `<g>
    <rect x="${x}" y="${y + h*0.04}" width="${w}" height="${h*0.9}" fill="currentColor"/>
    <rect x="${x - w*0.15}" y="${y}" width="${w*1.3}" height="${h*0.06}" rx="1" fill="currentColor" opacity="0.9"/>
    <rect x="${x - w*0.12}" y="${y + h*0.94}" width="${w*1.24}" height="${h*0.06}" rx="1" fill="currentColor"/>`;
  for (let i = 1; i < flutes; i++) {
    const fx = x + w * i / flutes;
    g += `<line x1="${fx}" y1="${y + h*0.08}" x2="${fx - w*0.04}" y2="${y + h*0.92}" stroke="#000000" stroke-width="1" opacity="0.18"/>`;
  }
  g += '</g>';
  return g;
}

function colonnade(x, y, w, h, n, color, entH = 0.08) {
  const cw = w * 0.6 / n;
  const gap = w / n;
  return `<g fill="${color}">
    <rect x="${x}" y="${y}" width="${w}" height="${h * entH}" rx="2"/>
    <rect x="${x}" y="${y + h*(1-entH*0.7)}" width="${w}" height="${h * entH * 0.7}" rx="1"/>
    ${Array.from({length: n}, (_, i) => {
      const cx = x + gap * i + (gap - cw) / 2;
      return `<rect x="${cx}" y="${y + h*entH}" width="${cw}" height="${h*(1-entH*1.7)}" rx="1"/>`;
    }).join('')}
  </g>`;
}

function arch(x, y, w, h, color) {
  const hw = w/2, aw = w*0.5, ah = h*0.7, aTop = y + h - ah;
  return `<g fill="${color}">
    <rect x="${x}" y="${y + h*0.3}" width="${w}" height="${h*0.7}"/>
    <path d="M ${x + hw - aw/2} ${y+h} L ${x+hw-aw/2} ${aTop+aw*0.5} Q ${x+hw-aw/2} ${aTop} ${x+hw} ${aTop} Q ${x+hw+aw/2} ${aTop} ${x+hw+aw/2} ${aTop+aw*0.5} L ${x+hw+aw/2} ${y+h} Z" fill="#000000" opacity="0.7"/>
    <rect x="${x}" y="${y+h*0.27}" width="${w}" height="${h*0.06}" opacity="0.8"/>
    <rect x="${x}" y="${y+h*0.22}" width="${w}" height="${h*0.06}" opacity="0.5"/>
  </g>`;
}

function dome(cx, cy, r, color) {
  return `<g fill="${color}">
    <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r*0.5}"/>
    <rect x="${cx-r}" y="${cy}" width="${r*2}" height="${r*0.55}"/>
    <rect x="${cx-r*1.08}" y="${cy+r*0.5}" width="${r*2.16}" height="${r*0.12}" rx="2"/>
    ${colonnade(cx-r*0.85, cy+r*0.55, r*1.7, r*0.55, 10, color)}
    <circle cx="${cx}" cy="${cy-r*0.1}" r="${r*0.07}" fill="#000000" opacity="0.5"/>
  </g>`;
}

function colosseumSilhouette(x, y, w, h, color) {
  const levels = [
    { yFrac: 0.08, hFrac: 0.28, nArch: 10 },
    { yFrac: 0.36, hFrac: 0.25, nArch: 9 },
    { yFrac: 0.61, hFrac: 0.22, nArch: 8 },
    { yFrac: 0.83, hFrac: 0.17, nArch: 0 },
  ];
  let g = `<g>`;
  // Ground ellipse
  g += `<ellipse cx="${x+w/2}" cy="${y+h*0.98}" rx="${w*0.52}" ry="${h*0.06}" fill="${color}" opacity="0.3"/>`;
  levels.forEach(({ yFrac, hFrac, nArch }) => {
    const ly = y + h * yFrac;
    const lh = h * hFrac;
    g += `<rect x="${x}" y="${ly}" width="${w}" height="${lh}" fill="${color}" opacity="0.85"/>`;
    if (nArch > 0) {
      const aw = w / nArch;
      Array.from({length: nArch}, (_, i) => {
        const ax = x + aw*i + aw*0.15;
        const aWidth = aw * 0.7;
        const archRad = aWidth/2;
        g += `<path d="M ${ax} ${ly+lh} L ${ax} ${ly+lh*0.15+archRad} Q ${ax} ${ly+lh*0.15} ${ax+archRad} ${ly+lh*0.15} Q ${ax+aWidth} ${ly+lh*0.15} ${ax+aWidth} ${ly+lh*0.15+archRad} L ${ax+aWidth} ${ly+lh} Z" fill="#050302" opacity="0.7"/>`;
      });
    }
  });
  g += '</g>';
  return g;
}

// ─── SCENE GENERATOR ─────────────────────────────────────────────────────────

function scene(defs, bg, layers, glow) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    ${defs}
    ${gridPattern('mainGrid', 55, P.amber, 0.045)}
    ${dotGrid('dots', 28, 0.9, P.amber, 0.06)}
    ${vignette('vig')}
  </defs>
  <!-- Base background -->
  ${bg}
  <!-- Grid overlay -->
  <rect width="${W}" height="${H}" fill="url(#mainGrid)"/>
  <!-- Content layers -->
  ${layers}
  <!-- Glows -->
  ${glow}
  <!-- Vignette -->
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
</svg>`;
}

// ─── INDIVIDUAL SCENES ───────────────────────────────────────────────────────

function makePantheon() {
  const defs = `
    ${linGrad('bg', '0', '0', '0', '1', [
      [0, P.dark, 1], [40, P.bgWarm, 1], [100, '#050302', 1]
    ])}
    ${radialGlow('glow1', '50%', '52%', '55%', P.amber, 0.45)}
    ${radialGlow('glow2', '50%', '52%', '30%', P.amberBright, 0.25)}
    ${horizBand('hband', 72, 60, P.amber, 0.2)}
  `;
  const bg = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
  const sil = `<g fill="${P.stone}" opacity="0.7">
    ${dome(W*0.5, H*0.3, 210, P.stone)}
  </g>`;
  const layers = `
    ${sil}
    <!-- Ground plane -->
    <rect x="0" y="${H*0.82}" width="${W}" height="${H*0.18}" fill="${P.amberDeep}" opacity="0.6"/>
    <rect x="0" y="${H*0.78}" width="${W}" height="${H*0.04}" fill="${P.amber}" opacity="0.08"/>
    <!-- Stars -->
    ${Array.from({length:80}, () => {
      const sx=Math.floor(Math.random()*W), sy=Math.floor(Math.random()*(H*0.55));
      const r=(Math.random()*1.2+0.4).toFixed(1);
      const o=(Math.random()*0.5+0.15).toFixed(2);
      return `<circle cx="${sx}" cy="${sy}" r="${r}" fill="${P.parchment}" opacity="${o}"/>`;
    }).join('')}
    <!-- Horizontal glow band at bottom of arch -->
    <rect width="${W}" height="${H}" fill="url(#hband)"/>
  `;
  const glow = `
    <rect width="${W}" height="${H}" fill="url(#glow1)"/>
    <rect width="${W}" height="${H}" fill="url(#glow2)"/>
  `;
  return scene(defs, bg, layers, glow);
}

function makeForum() {
  const defs = `
    ${linGrad('bg', '0', '0', '0', '1', [
      [0, '#080402', 1], [100, '#0E0804', 1]
    ])}
    ${radialGlow('glow1', '62%', '48%', '50%', P.amber, 0.5)}
    ${radialGlow('glow2', '62%', '48%', '25%', P.amberBright, 0.3)}
    ${radialGlow('glowL', '15%', '70%', '30%', P.ember, 0.18)}
  `;
  const bg = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
  const silColor = '#1A0E06';
  const layers = `
    <!-- Sky atmosphere -->
    ${Array.from({length:50}, () => {
      const sx=Math.floor(Math.random()*W), sy=Math.floor(Math.random()*(H*0.45));
      const r=(Math.random()*1.5+0.3).toFixed(1);
      const o=(Math.random()*0.4+0.1).toFixed(2);
      return `<circle cx="${sx}" cy="${sy}" r="${r}" fill="${P.parchment}" opacity="${o}"/>`;
    }).join('')}
    <!-- Ground -->
    <rect x="0" y="${H*0.75}" width="${W}" height="${H*0.25}" fill="${silColor}"/>
    <!-- Temple left -->
    <g fill="${silColor}" opacity="0.95">
      ${colonnade(W*0.02, H*0.22, W*0.22, H*0.55, 7, silColor)}
    </g>
    <!-- Arch center -->
    <g fill="${silColor}" opacity="0.9">
      ${arch(W*0.35, H*0.15, W*0.3, H*0.65, silColor)}
    </g>
    <!-- Temple right  -->
    <g fill="${silColor}" opacity="0.85">
      ${colonnade(W*0.72, H*0.3, W*0.24, H*0.5, 6, silColor)}
    </g>
    <!-- Ground texture line -->
    <rect x="0" y="${H*0.75}" width="${W}" height="2" fill="${P.amber}" opacity="0.12"/>
  `;
  const glow = `
    <rect width="${W}" height="${H}" fill="url(#glow1)"/>
    <rect width="${W}" height="${H}" fill="url(#glow2)"/>
    <rect width="${W}" height="${H}" fill="url(#glowL)"/>
  `;
  return scene(defs, bg, layers, glow);
}

function makeParthenon() {
  const defs = `
    ${linGrad('bg', '0', '0', '0', '1', [
      [0, '#06080A', 1], [45, '#0C1015', 1], [100, '#080604', 1]
    ])}
    ${radialGlow('glow1', '50%', '40%', '55%', '#8A6520', 0.55)}
    ${radialGlow('glow2', '50%', '35%', '30%', P.amberBright, 0.3)}
  `;
  const bg = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
  const silColor = '#0F1218';
  const mCol = '#C8A878';
  const layers = `
    <!-- Rock formation (Acropolis) -->
    <path d="M 0 ${H*0.72} Q ${W*0.12} ${H*0.6} ${W*0.25} ${H*0.62} Q ${W*0.42} ${H*0.52} ${W*0.5} ${H*0.54} Q ${W*0.62} ${H*0.52} ${W*0.75} ${H*0.58} Q ${W*0.88} ${H*0.62} ${W} ${H*0.66} L ${W} ${H} L 0 ${H} Z" fill="${silColor}"/>
    <!-- Parthenon structure -->
    <g opacity="0.9">
      <!-- Pediment -->
      <polygon points="${W*0.18},${H*0.24} ${W*0.5},${H*0.04} ${W*0.82},${H*0.24}" fill="${silColor}"/>
      <polygon points="${W*0.2},${H*0.245} ${W*0.5},${H*0.07} ${W*0.8},${H*0.245}" fill="${mCol}" opacity="0.08"/>
      <!-- Colonnade -->
      ${colonnade(W*0.18, H*0.24, W*0.64, H*0.32, 12, silColor)}
    </g>
    <!-- Ground brightness -->
    <rect x="${W*0.1}" y="${H*0.5}" width="${W*0.8}" height="3" fill="${P.amber}" opacity="0.15"/>
  `;
  const glow = `
    <rect width="${W}" height="${H}" fill="url(#glow1)"/>
    <rect width="${W}" height="${H}" fill="url(#glow2)"/>
  `;
  return scene(defs, bg, layers, glow);
}

function makeCatacombs() {
  const defs = `
    ${linGrad('bg', '0', '0', '0', '1', [[0, '#030201', 1], [100, '#070503', 1]])}
    ${radialGlow('glow1', '50%', '50%', '45%', P.amber, 0.65)}
    ${radialGlow('glow2', '50%', '50%', '20%', P.amberBright, 0.45)}
    ${radialGlow('glowFar', '50%', '15%', '25%', P.ember, 0.2)}
  `;
  const bg = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
  const sc = '#0A0604';
  const layers = `
    <!-- Stone texture walls -->
    <rect x="0" y="0" width="${W*0.18}" height="${H}" fill="${sc}"/>
    <rect x="${W*0.82}" y="0" width="${W*0.18}" height="${H}" fill="${sc}"/>
    <!-- Ceiling -->
    <rect x="0" y="0" width="${W}" height="${H*0.12}" fill="${sc}"/>
    <!-- Floor -->
    <rect x="0" y="${H*0.82}" width="${W}" height="${H*0.18}" fill="${sc}" opacity="0.8"/>
    <!-- Main tunnel arch -->
    <path d="M ${W*0.15} ${H} L ${W*0.15} ${H*0.38} Q ${W*0.5} ${H*0.04} ${W*0.85} ${H*0.38} L ${W*0.85} ${H} Z" fill="none" stroke="${P.amberDim}" stroke-width="4" opacity="0.3"/>
    <!-- Inner arch (deeper tunnel) -->
    <path d="M ${W*0.28} ${H} L ${W*0.28} ${H*0.42} Q ${W*0.5} ${H*0.12} ${W*0.72} ${H*0.42} L ${W*0.72} ${H} Z" fill="${sc}" opacity="0.75"/>
    <!-- Ancient wall inscriptions (abstract horizontal lines) -->
    ${Array.from({length:8}, (_, i) => `
      <rect x="${W*0.19}" y="${H*(0.3 + i*0.065)}" width="${W*0.07}" height="2" fill="${P.amber}" opacity="${0.08 + i*0.01}"/>
      <rect x="${W*0.74}" y="${H*(0.32 + i*0.065)}" width="${W*0.06}" height="2" fill="${P.amber}" opacity="0.06"/>
    `).join('')}
    <!-- Shepherd figure (highly stylized, amber glow) -->
    <g opacity="0.35" fill="${P.gold}">
      <circle cx="${W*0.46}" cy="${H*0.36}" r="${W*0.022}"/>
      <rect x="${W*0.447}" y="${H*0.39}" width="${W*0.026}" height="${H*0.14}" rx="5"/>
      <path d="M ${W*0.447} ${H*0.43} L ${W*0.42} ${H*0.5}" stroke="${P.gold}" stroke-width="8" stroke-linecap="round" fill="none"/>
      <path d="M ${W*0.473} ${H*0.43} L ${W*0.5} ${H*0.48}" stroke="${P.gold}" stroke-width="8" stroke-linecap="round" fill="none"/>
    </g>
    <!-- Torch flame -->
    <radialGradient id="flame" cx="50%" cy="100%" r="100%">
      <stop offset="0%" stop-color="${P.amberBright}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${P.amber}" stop-opacity="0"/>
    </radialGradient>
    <ellipse cx="${W*0.5}" cy="${H*0.78}" rx="${W*0.015}" ry="${H*0.055}" fill="url(#flame)"/>
    <line x1="${W*0.5}" y1="${H*0.78}" x2="${W*0.5}" y2="${H*0.82}" stroke="${P.amberDim}" stroke-width="4"/>
  `;
  const glow = `
    <rect width="${W}" height="${H}" fill="url(#glow1)"/>
    <rect width="${W}" height="${H}" fill="url(#glow2)"/>
    <rect width="${W}" height="${H}" fill="url(#glowFar)"/>
  `;
  return scene(defs, bg, layers, glow);
}

function makeOstia() {
  const defs = `
    ${linGrad('bg', '0', '0', '0', '1', [[0, '#040608', 1], [50, '#060408', 1], [100, '#0A0704', 1]])}
    ${radialGlow('glow1', '30%', '35%', '45%', P.amber, 0.5)}
    ${radialGlow('glow2', '30%', '35%', '20%', P.amberBright, 0.3)}
    ${radialGlow('glowR', '80%', '55%', '35%', P.ember, 0.25)}
  `;
  const bg = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
  const sc = '#08060300';
  const sk = '#07060402';
  const layers = `
    <!-- Stars -->
    ${Array.from({length:60}, () => {
      const sx=Math.floor(Math.random()*W), sy=Math.floor(Math.random()*(H*0.5));
      const r=(Math.random()*1.4+0.3).toFixed(1);
      return `<circle cx="${sx}" cy="${sy}" r="${r}" fill="${P.parchment}" opacity="${(Math.random()*0.5+0.1).toFixed(2)}"/>`;
    }).join('')}
    <!-- Water reflection plane -->
    <rect x="0" y="${H*0.58}" width="${W}" height="${H*0.42}" fill="#030508" opacity="0.9"/>
    <!-- Horizon line -->
    <rect x="0" y="${H*0.56}" width="${W}" height="3" fill="${P.amber}" opacity="0.12"/>
    <!-- Water shimmer lines -->
    ${Array.from({length:18}, (_, i) =>
      `<line x1="${W*0.05}" y1="${H*(0.6 + i*0.022)}" x2="${W*0.95}" y2="${H*(0.6 + i*0.022)}" stroke="${P.amber}" stroke-width="1.2" opacity="${0.04 + Math.sin(i)*0.02}"/>`
    ).join('')}
    <!-- Ground / harbor wall -->
    <rect x="0" y="${H*0.72}" width="${W}" height="${H*0.28}" fill="#050302" opacity="0.85"/>
    <!-- Lighthouse center-left -->
    <rect x="${W*0.26}" y="${H*0.1}" width="${W*0.05}" height="${H*0.62}" fill="#0C0806" opacity="0.9"/>
    <polygon points="${W*0.255},${H*0.1} ${W*0.285},${H*0.04} ${W*0.315},${H*0.1}" fill="#0C0806" opacity="0.9"/>
    <!-- Lighthouse beacon -->
    <radialGradient id="beacon" cx="28.5%" cy="5%" r="20%" gradientUnits="userSpaceOnUse" fx="${W*0.285}" fy="${H*0.05}">
      <stop offset="0%" stop-color="${P.amberBright}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${P.amber}" stop-opacity="0"/>
    </radialGradient>
    <rect width="${W}" height="${H}" fill="url(#beacon)"/>
    <!-- Left colonnade -->
    ${colonnade(W*0.03, H*0.25, W*0.18, H*0.5, 5, '#0C0806')}
    <!-- Ships (dark silhouettes) -->
    <path d="M ${W*0.55} ${H*0.64} Q ${W*0.62} ${H*0.6} ${W*0.69} ${H*0.64} L ${W*0.69} ${H*0.72} L ${W*0.55} ${H*0.72} Z" fill="#050302" opacity="0.85"/>
    <line x1="${W*0.62}" y1="${H*0.6}" x2="${W*0.62}" y2="${H*0.48}" stroke="#050302" stroke-width="4" opacity="0.8"/>
    <!-- Reflection of lighthouse in water -->
    <line x1="${W*0.285}" y1="${H*0.58}" x2="${W*0.285}" y2="${H*0.82}" stroke="${P.amber}" stroke-width="2" opacity="0.08"/>
  `;
  const glow = `
    <rect width="${W}" height="${H}" fill="url(#glow1)"/>
    <rect width="${W}" height="${H}" fill="url(#glow2)"/>
    <rect width="${W}" height="${H}" fill="url(#glowR)"/>
  `;
  return scene(defs, bg, layers, glow);
}

function makeColosseum() {
  const defs = `
    ${linGrad('bg', '0', '0', '0', '1', [[0, '#020100', 1], [100, '#060402', 1]])}
    ${radialGlow('glow1', '50%', '58%', '55%', P.amber, 0.55)}
    ${radialGlow('glow2', '50%', '58%', '28%', P.amberBright, 0.35)}
    ${radialGlow('glowTop', '50%', '22%', '40%', P.ember, 0.2)}
  `;
  const bg = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
  const sc = '#0D0803';
  const layers = `
    <!-- Stars with moon glow -->
    ${Array.from({length:65}, () => {
      const sx=Math.floor(Math.random()*W), sy=Math.floor(Math.random()*(H*0.5));
      const r=(Math.random()*1.8+0.4).toFixed(1);
      return `<circle cx="${sx}" cy="${sy}" r="${r}" fill="${P.parchment}" opacity="${(Math.random()*0.6+0.1).toFixed(2)}"/>`;
    }).join('')}
    <!-- Moon top right -->
    <radialGradient id="moon" cx="78%" cy="12%" r="10%" gradientUnits="userSpaceOnUse" fx="${W*0.78}" fy="${H*0.12}">
      <stop offset="0%" stop-color="${P.parchment}" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="${P.gold}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${P.amber}" stop-opacity="0"/>
    </radialGradient>
    <rect width="${W}" height="${H}" fill="url(#moon)"/>
    <!-- Ground / piazza -->
    <rect x="0" y="${H*0.8}" width="${W}" height="${H*0.2}" fill="${sc}" opacity="0.9"/>
    <!-- Colosseum main structure -->
    ${colosseumSilhouette(W*0.06, H*0.04, W*0.88, H*0.8, sc)}
    <!-- Interior fire glow -->
    <radialGradient id="fire" cx="50%" cy="62%" r="20%">
      <stop offset="0%" stop-color="${P.amberBright}" stop-opacity="0.5"/>
      <stop offset="50%" stop-color="${P.ember}" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="${P.ember}" stop-opacity="0"/>
    </radialGradient>
    <rect width="${W}" height="${H}" fill="url(#fire)"/>
    <!-- Shadow sides -->
    ${linGrad('shadowL', '0', '0', '1', '0', [[0,'#000000', 0.6],[30,'#000000',0],[100,'#000000',0]])}
    ${linGrad('shadowR', '0', '0', '1', '0', [[0,'#000000', 0],[70,'#000000',0],[100,'#000000',0.6]])}
    <rect width="${W}" height="${H}" fill="url(#shadowL)"/>
    <rect width="${W}" height="${H}" fill="url(#shadowR)"/>
  `;
  const glow = `
    <rect width="${W}" height="${H}" fill="url(#glow1)"/>
    <rect width="${W}" height="${H}" fill="url(#glow2)"/>
    <rect width="${W}" height="${H}" fill="url(#glowTop)"/>
  `;
  return scene(defs, bg, layers, glow);
}

function makeConstantineArch() {
  const defs = `
    ${linGrad('bg', '0', '0', '0', '1', [[0,'#030105',1],[50,'#080408',1],[100,'#050302',1]])}
    ${radialGlow('glow1', '50%', '38%', '55%', P.gold, 0.6)}
    ${radialGlow('glow2', '50%', '30%', '28%', '#FFCC44', 0.4)}
    ${radialGlow('glowL', '18%', '60%', '30%', P.amber, 0.2)}
    ${radialGlow('glowR', '82%', '60%', '30%', P.amber, 0.2)}
  `;
  const bg = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
  const sc = '#0E0908';
  const layers = `
    <!-- Stars -->
    ${Array.from({length:55}, () => {
      const sx=Math.floor(Math.random()*W), sy=Math.floor(Math.random()*(H*0.5));
      const r=(Math.random()*1.4+0.4).toFixed(1);
      return `<circle cx="${sx}" cy="${sy}" r="${r}" fill="${P.parchment}" opacity="${(Math.random()*0.6+0.15).toFixed(2)}"/>`;
    }).join('')}
    <!-- Ground -->
    <rect x="0" y="${H*0.82}" width="${W}" height="${H*0.18}" fill="${sc}"/>
    <!-- Main triumphal arch -->
    ${arch(W*0.3, H*0.08, W*0.4, H*0.78, sc)}
    <!-- Side arches (smaller) -->
    ${arch(W*0.07, H*0.32, W*0.23, H*0.54, sc)}
    ${arch(W*0.7, H*0.32, W*0.23, H*0.54, sc)}
    <!-- Divine rays from above (god-rays) -->
    ${Array.from({length:12}, (_, i) => {
      const a = (i * 30 - 30) * Math.PI / 180;
      const len = 320;
      const ox = W*0.5, oy = H*0.28;
      const ex = ox + Math.cos(a)*len, ey = oy + Math.sin(a)*len;
      return `<line x1="${ox}" y1="${oy}" x2="${ex.toFixed(0)}" y2="${ey.toFixed(0)}" stroke="${P.gold}" stroke-width="1.5" opacity="${(0.06 + Math.abs(Math.cos(a))*0.08).toFixed(3)}"/>`;
    }).join('')}
    <!-- Chi-Rho glow point in arch -->
    <radialGradient id="chiGlow" cx="50%" cy="28%" r="12%" gradientUnits="userSpaceOnUse" fx="${W*0.5}" fy="${H*0.28}">
      <stop offset="0%" stop-color="#FFDD66" stop-opacity="0.95"/>
      <stop offset="40%" stop-color="${P.gold}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${P.amber}" stop-opacity="0"/>
    </radialGradient>
    <rect width="${W}" height="${H}" fill="url(#chiGlow)"/>
    <!-- Ground line glow -->
    <rect x="0" y="${H*0.82}" width="${W}" height="3" fill="${P.amber}" opacity="0.15"/>
  `;
  const glow = `
    <rect width="${W}" height="${H}" fill="url(#glow1)"/>
    <rect width="${W}" height="${H}" fill="url(#glow2)"/>
    <rect width="${W}" height="${H}" fill="url(#glowL)"/>
    <rect width="${W}" height="${H}" fill="url(#glowR)"/>
  `;
  return scene(defs, bg, layers, glow);
}

function makeHagiaSophia() {
  const defs = `
    ${linGrad('bg', '0', '0', '0', '1', [[0,'#050302',1],[100,'#0A0705',1]])}
    ${radialGlow('glow1', '50%', '18%', '55%', P.gold, 0.7)}
    ${radialGlow('glow2', '50%', '18%', '25%', '#FFD060', 0.55)}
    ${radialGlow('glowB', '50%', '85%', '40%', P.amber, 0.25)}
  `;
  const bg = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
  const sc = '#0C0805';
  const layers = `
    <!-- Interior stone walls -->
    <rect x="0" y="0" width="${W*0.16}" height="${H}" fill="${sc}"/>
    <rect x="${W*0.84}" y="0" width="${W*0.16}" height="${H}" fill="${sc}"/>
    <!-- Ceiling -->
    <rect x="0" y="0" width="${W}" height="${H*0.08}" fill="${sc}"/>
    <!-- Floor -->
    <rect x="0" y="${H*0.84}" width="${W}" height="${H*0.16}" fill="${sc}" opacity="0.9"/>
    <!-- Main dome arch -->
    <path d="M ${W*0.12} ${H} L ${W*0.12} ${H*0.4} Q ${W*0.5} ${H*0.0} ${W*0.88} ${H*0.4} L ${W*0.88} ${H} Z" fill="${sc}" opacity="0.8"/>
    <!-- Oculus circle (bright center) -->
    <radialGradient id="oculus" cx="50%" cy="8%" r="15%" gradientUnits="userSpaceOnUse" fx="${W*0.5}" fy="${H*0.08}">
      <stop offset="0%" stop-color="#FFEE88" stop-opacity="1"/>
      <stop offset="30%" stop-color="${P.gold}" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="${P.amber}" stop-opacity="0"/>
    </radialGradient>
    <circle cx="${W*0.5}" cy="${H*0.08}" r="${W*0.065}" fill="url(#oculus)"/>
    <!-- Window rings (circles of light at dome base) -->
    ${Array.from({length:14}, (_, i) => {
      const angle = i * (360/14) * Math.PI / 180;
      const cx = W*0.5 + Math.cos(angle) * W*0.34;
      const cy = H*0.33 + Math.sin(angle) * H*0.055;
      const o = (0.5 + Math.cos(angle + Math.PI/4) * 0.3).toFixed(2);
      return `<ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="18" ry="24" fill="${P.gold}" opacity="${o}"/>`;
    }).join('')}
    <!-- Side colonnade (golden shafts) -->
    ${colonnade(W*0.12, H*0.5, W*0.18, H*0.35, 6, '#1A1008')}
    ${colonnade(W*0.7, H*0.5, W*0.18, H*0.35, 6, '#1A1008')}
    <!-- Floor reflection -->
    <radialGradient id="fRefl" cx="50%" cy="88%" r="40%" gradientUnits="userSpaceOnUse" fx="${W*0.5}" fy="${H*0.88}">
      <stop offset="0%" stop-color="${P.gold}" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="${P.gold}" stop-opacity="0"/>
    </radialGradient>
    <rect width="${W}" height="${H}" fill="url(#fRefl)"/>
    <!-- Suspended chandelier suggestion -->
    <line x1="${W*0.5}" y1="${H*0.08}" x2="${W*0.5}" y2="${H*0.48}" stroke="${P.gold}" stroke-width="1.5" opacity="0.2"/>
    <circle cx="${W*0.5}" cy="${H*0.48}" r="12" fill="${P.gold}" opacity="0.35"/>
  `;
  const glow = `
    <rect width="${W}" height="${H}" fill="url(#glow1)"/>
    <rect width="${W}" height="${H}" fill="url(#glow2)"/>
    <rect width="${W}" height="${H}" fill="url(#glowB)"/>
  `;
  return scene(defs, bg, layers, glow);
}

function makeBasilica() {
  const defs = `
    ${linGrad('bg', '0', '0', '0', '1', [[0,'#040302',1],[100,'#080604',1]])}
    ${radialGlow('glow1', '50%', '10%', '50%', P.gold, 0.7)}
    ${radialGlow('glow2', '50%', '10%', '22%', '#FFDD44', 0.55)}
    ${radialGlow('glowB', '50%', '85%', '35%', P.amberDim, 0.2)}
  `;
  const bg = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
  const sc = '#0C0805';
  const layers = `
    <!-- Stone walls with perspective -->
    <!-- Left wall -->
    <polygon points="${W*0.06},0 ${W*0.22},${H*0.12} ${W*0.22},${H} ${W*0.06},${H}" fill="${sc}" opacity="0.9"/>
    <!-- Right wall -->
    <polygon points="${W*0.94},0 ${W*0.78},${H*0.12} ${W*0.78},${H} ${W*0.94},${H}" fill="${sc}" opacity="0.9"/>
    <!-- Ceiling -->
    <polygon points="${W*0.06},0 ${W*0.94},0 ${W*0.78},${H*0.12} ${W*0.22},${H*0.12}" fill="${sc}" opacity="0.85"/>
    <!-- Floor -->
    <rect x="0" y="${H*0.85}" width="${W}" height="${H*0.15}" fill="${sc}"/>
    <!-- Nave colonnade perspective (5 column pairs, getting smaller) -->
    ${Array.from({length:5}, (_, i) => {
      const d = i * 0.08;
      const lx = W*(0.22 + d*0.4);
      const rx = W*(0.78 - d*0.4);
      const ty = H*(0.14 + d*0.12);
      const cw = 20 - i*2;
      const ch = H*(0.68 - d*0.1);
      const op = 0.85 - i*0.12;
      return `
        <rect x="${lx}" y="${ty}" width="${cw}" height="${ch}" fill="${P.amberDeep}" opacity="${op}"/>
        <ellipse cx="${lx + cw/2}" cy="${ty}" rx="${cw*0.8}" ry="${cw*0.5}" fill="${P.gold}" opacity="${op*0.4}"/>
        <rect x="${rx - cw}" y="${ty}" width="${cw}" height="${ch}" fill="${P.amberDeep}" opacity="${op}"/>
        <ellipse cx="${rx - cw/2}" cy="${ty}" rx="${cw*0.8}" ry="${cw*0.5}" fill="${P.gold}" opacity="${op*0.4}"/>
      `;
    }).join('')}
    <!-- Apse golden glow at far end -->
    <radialGradient id="apse" cx="50%" cy="12%" r="30%" gradientUnits="userSpaceOnUse" fx="${W*0.5}" fy="${H*0.12}">
      <stop offset="0%" stop-color="#FFE060" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="${P.gold}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${P.amber}" stop-opacity="0"/>
    </radialGradient>
    <rect width="${W}" height="${H}" fill="url(#apse)"/>
    <!-- Cross at altar -->
    <rect x="${W*0.487}" y="${H*0.28}" width="${W*0.026}" height="${H*0.25}" fill="${P.gold}" opacity="0.6"/>
    <rect x="${W*0.462}" y="${H*0.33}" width="${W*0.076}" height="${H*0.065}" fill="${P.gold}" opacity="0.6"/>
    <!-- Candle lights floor level -->
    ${[0.3, 0.4, 0.5, 0.6, 0.7].map(px =>
      `<radialGradient id="c${Math.round(px*10)}" cx="${px*100}%" cy="83%" r="5%"><stop offset="0%" stop-color="${P.amberBright}" stop-opacity="0.7"/><stop offset="100%" stop-color="${P.amber}" stop-opacity="0"/></radialGradient><rect width="${W}" height="${H}" fill="url(#c${Math.round(px*10)})"/>`
    ).join('')}
    <!-- Floor reflection -->
    <line x1="${W*0.5}" y1="${H*0.85}" x2="${W*0.5}" y2="${H}" stroke="${P.gold}" stroke-width="60" opacity="0.04"/>
  `;
  const glow = `
    <rect width="${W}" height="${H}" fill="url(#glow1)"/>
    <rect width="${W}" height="${H}" fill="url(#glow2)"/>
    <rect width="${W}" height="${H}" fill="url(#glowB)"/>
  `;
  return scene(defs, bg, layers, glow);
}

// ─── GENERATE ────────────────────────────────────────────────────────────────
const scenes = [
  { name: 'pantheon',         fn: makePantheon },
  { name: 'forum',            fn: makeForum },
  { name: 'parthenon',        fn: makeParthenon },
  { name: 'catacombs',        fn: makeCatacombs },
  { name: 'ostia',            fn: makeOstia },
  { name: 'colosseum',        fn: makeColosseum },
  { name: 'constantine_arch', fn: makeConstantineArch },
  { name: 'hagia_sophia',     fn: makeHagiaSophia },
  { name: 'basilica',         fn: makeBasilica },
];

async function main() {
  for (const s of scenes) {
    const svg = s.fn();
    const out = path.join(OUT, `${s.name}.jpg`);
    await sharp(Buffer.from(svg))
      .jpeg({ quality: 92, mozjpeg: true })
      .toFile(out);
    const kb = (fs.statSync(out).size / 1024).toFixed(0);
    console.log(`  [OK] ${s.name}.jpg — ${kb} KB`);
  }
  console.log(`\nAll v2 backgrounds → ${OUT}`);
}
main().catch(e => { console.error(e); process.exit(1); });
