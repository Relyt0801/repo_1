#!/usr/bin/env node
'use strict';

// Generates rich SVG-based background images for each slide
// Uses sharp to render SVG → JPEG

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const W = 1920;
const H = 1080;
const OUT = path.join(__dirname, 'images');
fs.mkdirSync(OUT, { recursive: true });

// ─── SVG BUILDING BLOCKS ─────────────────────────────────────────────────────

const C = {
  pompejiRed:    '#5C1E16',
  pompejiRedDark:'#3A100B',
  pergamentHell: '#EDDFC2',
  pergamentDark: '#D9C39A',
  tintenBraun:   '#2B1810',
  goldDark:      '#B8862B',
  goldLight:     '#D9A441',
  terrakotta:    '#A0421A',
  marmorWhite:   '#F5EBD8',
  skyDark:       '#1A0F08',
  stoneDark:     '#3D2E1E',
  stoneLight:    '#8B7355',
  marble:        '#E8DCC8',
  ash:           '#6B5B45',
};

// Generate stone texture pattern (subtle crosshatch)
function stonePat(id, c1, c2) {
  return `<pattern id="${id}" width="40" height="40" patternUnits="userSpaceOnUse">
    <rect width="40" height="40" fill="${c1}"/>
    <line x1="0" y1="0" x2="40" y2="40" stroke="${c2}" stroke-width="0.4" opacity="0.3"/>
    <line x1="40" y1="0" x2="0" y2="40" stroke="${c2}" stroke-width="0.4" opacity="0.15"/>
    <line x1="20" y1="0" x2="20" y2="40" stroke="${c2}" stroke-width="0.3" opacity="0.1"/>
    <line x1="0" y1="20" x2="40" y2="20" stroke="${c2}" stroke-width="0.3" opacity="0.1"/>
  </pattern>`;
}

// Radial vignette overlay
function vignette(id, dark) {
  return `<radialGradient id="${id}" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
    <stop offset="0%" stop-color="${dark}" stop-opacity="0"/>
    <stop offset="70%" stop-color="${dark}" stop-opacity="0.4"/>
    <stop offset="100%" stop-color="${dark}" stop-opacity="0.85"/>
  </radialGradient>`;
}

// Arch silhouette (Roman triumphal arch)
function romanArch(x, y, w, h, fillColor) {
  const hw = w / 2;
  const archH = h * 0.65;
  const archW = w * 0.45;
  const archTop = y + h - archH;
  const aX = x + hw - archW / 2;
  return `<g>
    <!-- Main structure -->
    <rect x="${x}" y="${y + h * 0.35}" width="${w}" height="${h * 0.65}" fill="${fillColor}"/>
    <!-- Arch opening -->
    <path d="M ${aX} ${y + h} L ${aX} ${archTop + archW * 0.5}
             Q ${aX} ${archTop} ${aX + archW / 2} ${archTop}
             Q ${aX + archW} ${archTop} ${aX + archW} ${archTop + archW * 0.5}
             L ${aX + archW} ${y + h} Z" fill="${C.skyDark}" opacity="0.7"/>
    <!-- Entablature top -->
    <rect x="${x}" y="${y + h * 0.32}" width="${w}" height="${h * 0.05}" fill="${fillColor}" opacity="0.9"/>
    <rect x="${x}" y="${y + h * 0.27}" width="${w}" height="${h * 0.05}" fill="${fillColor}" opacity="0.7"/>
    <!-- Side pillars -->
    <rect x="${x}" y="${y + h * 0.35}" width="${w * 0.12}" height="${h * 0.65}" fill="${fillColor}" opacity="0.5"/>
    <rect x="${x + w - w * 0.12}" y="${y + h * 0.35}" width="${w * 0.12}" height="${h * 0.65}" fill="${fillColor}" opacity="0.5"/>
  </g>`;
}

// Colonnaded row of columns
function colonnade(x, y, w, h, numCols, fillColor, opacity = 1) {
  const colW = w / (numCols * 2.5);
  const spacing = w / numCols;
  const entH = h * 0.1;
  let out = `<g opacity="${opacity}">`;
  // Entablature top
  out += `<rect x="${x}" y="${y}" width="${w}" height="${entH}" fill="${fillColor}"/>`;
  // Stylobate bottom
  out += `<rect x="${x}" y="${y + h - entH * 0.8}" width="${w}" height="${entH * 0.8}" fill="${fillColor}"/>`;
  for (let i = 0; i < numCols; i++) {
    const cx = x + spacing * i + (spacing - colW) / 2;
    // Column shaft with slight taper
    out += `<path d="M ${cx + colW * 0.08} ${y + h - entH * 0.8}
                    L ${cx} ${y + entH}
                    L ${cx + colW} ${y + entH}
                    L ${cx + colW - colW * 0.08} ${y + h - entH * 0.8} Z"
                 fill="${fillColor}" opacity="0.9"/>`;
    // Column capital
    out += `<ellipse cx="${cx + colW / 2}" cy="${y + entH + 5}" rx="${colW * 0.55}" ry="${entH * 0.35}" fill="${fillColor}"/>`;
    // Fluting lines
    for (let f = 1; f < 5; f++) {
      const fx = cx + colW * f / 5;
      out += `<line x1="${fx}" y1="${y + entH + 8}" x2="${fx - colW * 0.04}" y2="${y + h - entH}" stroke="${C.tintenBraun}" stroke-width="0.5" opacity="0.2"/>`;
    }
  }
  out += '</g>';
  return out;
}

// Dome silhouette (Pantheon)
function domeShape(cx, cy, r, fillColor) {
  return `<g>
    <!-- Drum -->
    <rect x="${cx - r}" y="${cy}" width="${r * 2}" height="${r * 0.6}" fill="${fillColor}"/>
    <!-- Dome -->
    <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.55}" fill="${fillColor}"/>
    <!-- Oculus -->
    <circle cx="${cx}" cy="${cy - r * 0.15}" r="${r * 0.08}" fill="${C.skyDark}" opacity="0.6"/>
    <!-- Portico columns -->
    ${colonnade(cx - r * 0.7, cy + r * 0.5, r * 1.4, r * 0.6, 8, C.stoneLight, 0.85)}
  </g>`;
}

// Ruined temple / Parthenon
function parthenon(x, y, w, h) {
  return `<g>
    <!-- Gabled roof -->
    <polygon points="${x},${y + h * 0.25} ${x + w / 2},${y} ${x + w},${y + h * 0.25}" fill="${C.marble}" opacity="0.8"/>
    <!-- Colonnade -->
    ${colonnade(x, y + h * 0.25, w, h * 0.75, 8, C.marble, 0.85)}
    <!-- Broken column section (ruins effect) -->
    <rect x="${x + w * 0.15}" y="${y + h * 0.7}" width="${w * 0.07}" height="${h * 0.1}" fill="${C.ash}" opacity="0.6"/>
    <rect x="${x + w * 0.15}" y="${y + h * 0.85}" width="${w * 0.07}" height="${h * 0.15}" fill="${C.ash}" opacity="0.6"/>
  </g>`;
}

// Colosseum silhouette (multiple arched levels)
function colosseumSilhouette(x, y, w, h, fillColor) {
  const numArches = 8;
  const archW = w / numArches;
  let out = `<g>`;
  // Three levels of arches
  const levels = [0.35, 0.6, 0.82];
  levels.forEach((levelY, li) => {
    const levelH = 0.22;
    const ly = y + h * levelY;
    const lh = h * levelH;
    const numA = numArches - li;
    const aW = w / numA;
    out += `<rect x="${x}" y="${ly}" width="${w}" height="${lh}" fill="${fillColor}" opacity="${0.9 - li * 0.1}"/>`;
    for (let i = 0; i < numA; i++) {
      const ax = x + aW * i + aW * 0.15;
      const aw = aW * 0.7;
      const aTop = ly + lh * 0.1;
      const aBot = ly + lh;
      const archRad = aw / 2;
      out += `<path d="M ${ax} ${aBot} L ${ax} ${aTop + archRad} Q ${ax} ${aTop} ${ax + archRad} ${aTop} Q ${ax + aw} ${aTop} ${ax + aw} ${aTop + archRad} L ${ax + aw} ${aBot} Z" fill="${C.skyDark}" opacity="0.65"/>`;
    }
  });
  // Outer wall
  out += `<rect x="${x}" y="${y}" width="${w}" height="${h * 0.38}" fill="${fillColor}" opacity="0.7"/>`;
  out += '</g>';
  return out;
}

// Cross / Basilica cross shape
function crossShape(cx, cy, w, h, fillColor) {
  const bw = w * 0.28;
  const bh = h * 0.28;
  return `<g>
    <rect x="${cx - bw / 2}" y="${cy - h / 2}" width="${bw}" height="${h}" fill="${fillColor}"/>
    <rect x="${cx - w / 2}" y="${cy - bh * 0.3}" width="${w}" height="${bh}" fill="${fillColor}"/>
  </g>`;
}

// Sky with atmospheric gradient
function atmosphericSky(id, topColor, midColor, botColor) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${topColor}"/>
    <stop offset="40%" stop-color="${midColor}"/>
    <stop offset="100%" stop-color="${botColor}"/>
  </linearGradient>`;
}

// Ground plane
function groundRect(x, y, w, h, fillColor) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fillColor}" opacity="0.95"/>`;
}

// ─── INDIVIDUAL SCENE GENERATORS ─────────────────────────────────────────────

function makePantheon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    ${atmosphericSky('sky', '#0D0705', '#2A0F0A', '#5C1E16')}
    ${stonePat('stone', C.stoneDark, C.stoneLight)}
    ${vignette('vig', '#000000')}
  </defs>
  <!-- Sky -->
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <!-- Stars (subtle) -->
  ${Array.from({length:60}, () => {
    const sx = Math.floor(Math.random()*W);
    const sy = Math.floor(Math.random()*(H*0.6));
    const sr = (Math.random()*1.5+0.5).toFixed(1);
    return `<circle cx="${sx}" cy="${sy}" r="${sr}" fill="#F5EBD8" opacity="${(Math.random()*0.5+0.2).toFixed(2)}"/>`;
  }).join('')}
  <!-- Moon glow -->
  <radialGradient id="moon" cx="70%" cy="20%" r="15%">
    <stop offset="0%" stop-color="#F5EBD8" stop-opacity="0.8"/>
    <stop offset="40%" stop-color="#D9A441" stop-opacity="0.2"/>
    <stop offset="100%" stop-color="#5C1E16" stop-opacity="0"/>
  </radialGradient>
  <rect width="${W}" height="${H}" fill="url(#moon)"/>
  <!-- Ground -->
  ${groundRect(0, H*0.78, W, H*0.22, C.stoneDark)}
  <!-- Pantheon dome -->
  ${domeShape(W*0.5, H*0.38, 280, C.stoneLight)}
  <!-- Ground texture -->
  <rect x="0" y="${H*0.78}" width="${W}" height="${H*0.22}" fill="url(#stone)" opacity="0.6"/>
  <!-- Torch glow left and right -->
  <radialGradient id="torch1" cx="15%" cy="75%" r="20%">
    <stop offset="0%" stop-color="#D9A441" stop-opacity="0.4"/>
    <stop offset="100%" stop-color="#D9A441" stop-opacity="0"/>
  </radialGradient>
  <rect width="${W}" height="${H}" fill="url(#torch1)"/>
  <!-- Warm building glow -->
  <radialGradient id="bglow" cx="50%" cy="55%" r="35%">
    <stop offset="0%" stop-color="#D9A441" stop-opacity="0.15"/>
    <stop offset="100%" stop-color="#D9A441" stop-opacity="0"/>
  </radialGradient>
  <rect width="${W}" height="${H}" fill="url(#bglow)"/>
  <!-- Vignette -->
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
</svg>`;
}

function makeForum() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    ${atmosphericSky('sky', '#0F0B07', '#2B1A10', '#4A2810')}
    ${stonePat('stone', C.stoneDark, '#6B5040')}
    ${vignette('vig', '#1A0A04')}
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <!-- Warm sunset on right -->
  <radialGradient id="sunset" cx="85%" cy="35%" r="40%">
    <stop offset="0%" stop-color="#D9A441" stop-opacity="0.6"/>
    <stop offset="50%" stop-color="#A0421A" stop-opacity="0.3"/>
    <stop offset="100%" stop-color="${C.pompejiRed}" stop-opacity="0"/>
  </radialGradient>
  <rect width="${W}" height="${H}" fill="url(#sunset)"/>
  <!-- Ground plane -->
  ${groundRect(0, H*0.72, W, H*0.28, C.stoneDark)}
  <rect x="0" y="${H*0.72}" width="${W}" height="${H*0.28}" fill="url(#stone)" opacity="0.4"/>
  <!-- Temple structures left -->
  ${colonnade(W*0.03, H*0.28, W*0.22, H*0.52, 6, C.stoneLight, 0.75)}
  <!-- Arch center -->
  ${romanArch(W*0.38, H*0.18, W*0.24, H*0.6, C.ash)}
  <!-- Temple right -->
  ${colonnade(W*0.72, H*0.35, W*0.25, H*0.45, 6, C.stoneLight, 0.65)}
  <!-- Scattered column drums on ground -->
  ${[0.15, 0.32, 0.68, 0.82].map(px =>
    `<ellipse cx="${W*px}" cy="${H*0.78}" rx="${W*0.035}" ry="${H*0.025}" fill="${C.ash}" opacity="0.7"/>`
  ).join('')}
  <!-- Vignette -->
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
</svg>`;
}

function makeParthenon() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    ${atmosphericSky('sky', '#87CEEB', '#6BA3C8', '#4A7FA8')}
    ${atmosphericSky('sky2', '#C8D8E8', '#E8DCC8', '#D4C4A0')}
    ${vignette('vig', '#1A0E07')}
    ${stonePat('rock', '#8B7355', '#6B5040')}
  </defs>
  <!-- Blue sky with cloud tones -->
  <rect width="${W}" height="${H*0.6}" fill="url(#sky)"/>
  <!-- Horizon haze -->
  <rect x="0" y="${H*0.55}" width="${W}" height="${H*0.15}" fill="url(#sky2)" opacity="0.7"/>
  <!-- Rock of Acropolis -->
  <path d="M 0 ${H*0.7} Q ${W*0.1} ${H*0.6} ${W*0.2} ${H*0.62} Q ${W*0.35} ${H*0.55} ${W*0.5} ${H*0.57} Q ${W*0.65} ${H*0.55} ${W*0.8} ${H*0.6} Q ${W*0.9} ${H*0.62} ${W} ${H*0.65} L ${W} ${H} L 0 ${H} Z" fill="${C.stoneDark}"/>
  <path d="M 0 ${H*0.7} Q ${W*0.1} ${H*0.6} ${W*0.2} ${H*0.62} Q ${W*0.35} ${H*0.55} ${W*0.5} ${H*0.57} Q ${W*0.65} ${H*0.55} ${W*0.8} ${H*0.6} Q ${W*0.9} ${H*0.62} ${W} ${H*0.65} L ${W} ${H} L 0 ${H} Z" fill="url(#rock)" opacity="0.5"/>
  <!-- Parthenon -->
  ${parthenon(W*0.2, H*0.15, W*0.6, H*0.45)}
  <!-- Bright sky behind structure -->
  <radialGradient id="glow" cx="50%" cy="35%" r="30%">
    <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.25"/>
    <stop offset="100%" stop-color="#87CEEB" stop-opacity="0"/>
  </radialGradient>
  <rect x="${W*0.15}" y="${H*0.1}" width="${W*0.7}" height="${H*0.5}" fill="url(#glow)"/>
  <!-- Vignette (lighter for daytime scene) -->
  <rect width="${W}" height="${H}" fill="url(#vig)" opacity="0.5"/>
</svg>`;
}

function makeCatacombs() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    ${stonePat('stone', '#1A1008', '#2B1810')}
    ${vignette('vig', '#000000')}
    <radialGradient id="torchGlow" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="#D9A441" stop-opacity="0.8"/>
      <stop offset="30%" stop-color="#A0421A" stop-opacity="0.5"/>
      <stop offset="70%" stop-color="#5C1E16" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- Deep dark stone background -->
  <rect width="${W}" height="${H}" fill="#0D0805"/>
  <rect width="${W}" height="${H}" fill="url(#stone)" opacity="0.8"/>
  <!-- Tunnel arch -->
  <path d="M ${W*0.15} ${H} L ${W*0.15} ${H*0.35} Q ${W*0.5} ${H*0.05} ${W*0.85} ${H*0.35} L ${W*0.85} ${H} Z" fill="none" stroke="#2B1810" stroke-width="8"/>
  <!-- Deeper tunnel opening -->
  <path d="M ${W*0.28} ${H} L ${W*0.28} ${H*0.4} Q ${W*0.5} ${H*0.15} ${W*0.72} ${H*0.4} L ${W*0.72} ${H} Z" fill="#050302" opacity="0.8"/>
  <!-- Torch glow in center -->
  <rect width="${W}" height="${H}" fill="url(#torchGlow)"/>
  <!-- Fresco elements (abstract ancient figures) -->
  <!-- Shepherd figure (simplified) -->
  <g transform="translate(${W*0.42}, ${H*0.3})" opacity="0.65">
    <circle cx="60" cy="0" r="22" fill="${C.terrakotta}" opacity="0.7"/>
    <rect x="48" y="22" width="24" height="55" rx="5" fill="${C.terrakotta}" opacity="0.6"/>
    <!-- Arms -->
    <line x1="60" y1="35" x2="30" y2="60" stroke="${C.terrakotta}" stroke-width="10" stroke-linecap="round" opacity="0.6"/>
    <line x1="60" y1="35" x2="90" y2="55" stroke="${C.terrakotta}" stroke-width="10" stroke-linecap="round" opacity="0.6"/>
    <!-- Staff -->
    <line x1="90" y1="55" x2="105" y2="120" stroke="${C.goldDark}" stroke-width="5" opacity="0.5"/>
    <!-- Lamb on shoulders (suggestion) -->
    <ellipse cx="30" cy="52" rx="18" ry="12" fill="${C.marmorWhite}" opacity="0.4"/>
  </g>
  <!-- Fish / IXTHUS on wall -->
  <path d="M ${W*0.7} ${H*0.45} Q ${W*0.8} ${H*0.4} ${W*0.82} ${H*0.47} Q ${W*0.8} ${H*0.54} ${W*0.7} ${H*0.49} Z" fill="none" stroke="${C.goldDark}" stroke-width="3" opacity="0.45"/>
  <!-- Candle/torch flicker -->
  <path d="M ${W*0.49} ${H*0.65} Q ${W*0.5} ${H*0.55} ${W*0.51} ${H*0.65}" fill="${C.goldLight}" opacity="0.8"/>
  <!-- Wall scratches / text suggestion -->
  ${Array.from({length:8}, (_, i) =>
    `<line x1="${W*0.18 + i*12}" y1="${H*0.75}" x2="${W*0.18 + i*12 + 8}" y2="${H*0.78}" stroke="${C.goldDark}" stroke-width="1.5" opacity="0.25"/>`
  ).join('')}
  <!-- Vignette heavy -->
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
</svg>`;
}

function makeOstia() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    ${atmosphericSky('sky', '#1A3050', '#2A5080', '#3A70A0')}
    ${atmosphericSky('water', '#0A2040', '#1A4060', '#2A5070')}
    ${vignette('vig', '#0D0A07')}
    ${stonePat('stone', '#3D2E1E', '#5C4428')}
  </defs>
  <!-- Sky -->
  <rect width="${W}" height="${H*0.5}" fill="url(#sky)"/>
  <!-- Water/harbor -->
  <rect x="0" y="${H*0.55}" width="${W}" height="${H*0.45}" fill="url(#water)"/>
  <!-- Water shimmer -->
  ${Array.from({length:15}, (_, i) =>
    `<line x1="${i*140}" y1="${H*0.58 + i*4}" x2="${i*140 + 280}" y2="${H*0.58 + i*4}" stroke="#5A9FC0" stroke-width="1.5" opacity="0.3"/>`
  ).join('')}
  <!-- Horizon line -->
  <rect x="0" y="${H*0.49}" width="${W}" height="${H*0.08}" fill="#1A3050" opacity="0.7"/>
  <!-- Harbor structures -->
  <!-- Left: Columns/warehouses -->
  ${colonnade(W*0.03, H*0.2, W*0.2, H*0.45, 5, C.stoneLight, 0.7)}
  <!-- Center: Large lighthouse -->
  <rect x="${W*0.46}" y="${H*0.12}" width="${W*0.08}" height="${H*0.52}" fill="${C.ash}" opacity="0.8"/>
  <polygon points="${W*0.46},${H*0.12} ${W*0.5},${H*0.06} ${W*0.54},${H*0.12}" fill="${C.stoneLight}" opacity="0.8"/>
  <radialGradient id="beacon" cx="50%" cy="8%" r="12%">
    <stop offset="0%" stop-color="#D9A441" stop-opacity="0.9"/>
    <stop offset="100%" stop-color="#D9A441" stop-opacity="0"/>
  </radialGradient>
  <rect width="${W}" height="${H}" fill="url(#beacon)"/>
  <!-- Right: Temple -->
  ${colonnade(W*0.7, H*0.28, W*0.22, H*0.38, 6, C.marble, 0.65)}
  <!-- Ships in harbor (silhouettes) -->
  <path d="M ${W*0.1} ${H*0.62} Q ${W*0.18} ${H*0.58} ${W*0.26} ${H*0.62} L ${W*0.26} ${H*0.7} L ${W*0.1} ${H*0.7} Z" fill="${C.tintenBraun}" opacity="0.7"/>
  <line x1="${W*0.18}" y1="${H*0.58}" x2="${W*0.18}" y2="${H*0.48}" stroke="${C.tintenBraun}" stroke-width="4" opacity="0.7"/>
  <!-- Mosaic background subtle -->
  <rect x="0" y="${H*0.72}" width="${W}" height="${H*0.28}" fill="url(#stone)" opacity="0.6"/>
  <!-- Vignette -->
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
</svg>`;
}

function makeColosseum() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    ${atmosphericSky('sky', '#0D0500', '#3A1A08', '#7A3515')}
    ${vignette('vig', '#000000')}
    <radialGradient id="sunsetGlow" cx="50%" cy="30%" r="60%">
      <stop offset="0%" stop-color="#D9A441" stop-opacity="0.7"/>
      <stop offset="40%" stop-color="#A0421A" stop-opacity="0.4"/>
      <stop offset="80%" stop-color="#5C1E16" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    ${stonePat('stone', '#2B1A0A', '#4A2E15')}
  </defs>
  <!-- Dramatic sunset sky -->
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <rect width="${W}" height="${H}" fill="url(#sunsetGlow)"/>
  <!-- Ground / piazza -->
  ${groundRect(0, H*0.76, W, H*0.24, C.stoneDark)}
  <rect x="0" y="${H*0.76}" width="${W}" height="${H*0.24}" fill="url(#stone)" opacity="0.5"/>
  <!-- Colosseum main structure -->
  <!-- Base elliptical footprint suggestion -->
  <ellipse cx="${W*0.5}" cy="${H*0.65}" rx="${W*0.42}" ry="${H*0.15}" fill="${C.stoneDark}" opacity="0.9"/>
  <!-- Main facade -->
  ${colosseumSilhouette(W*0.08, H*0.05, W*0.84, H*0.75, C.ash)}
  <!-- Inner glow (fire in arena) -->
  <radialGradient id="arenaFire" cx="50%" cy="70%" r="25%">
    <stop offset="0%" stop-color="#D9A441" stop-opacity="0.5"/>
    <stop offset="60%" stop-color="#A0421A" stop-opacity="0.2"/>
    <stop offset="100%" stop-color="#5C1E16" stop-opacity="0"/>
  </radialGradient>
  <rect width="${W}" height="${H}" fill="url(#arenaFire)"/>
  <!-- Shadow on right side -->
  <linearGradient id="shadow" x1="0" y1="0" x2="1" y2="0">
    <stop offset="60%" stop-color="#000000" stop-opacity="0"/>
    <stop offset="100%" stop-color="#000000" stop-opacity="0.6"/>
  </linearGradient>
  <rect width="${W}" height="${H}" fill="url(#shadow)"/>
  <!-- Vignette heavy -->
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
</svg>`;
}

function makeConstantineArch() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    ${atmosphericSky('sky', '#0A0305', '#1A0A12', '#3A1030')}
    ${vignette('vig', '#000000')}
    <radialGradient id="chiRhoGlow" cx="50%" cy="35%" r="45%">
      <stop offset="0%" stop-color="${C.goldLight}" stop-opacity="0.6"/>
      <stop offset="40%" stop-color="${C.goldDark}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${C.pompejiRed}" stop-opacity="0"/>
    </radialGradient>
    ${stonePat('stone', '#2B1A10', '#3D2820')}
  </defs>
  <!-- Dark sky with divine light -->
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <!-- Chi-Rho glow in sky -->
  <rect width="${W}" height="${H}" fill="url(#chiRhoGlow)"/>
  <!-- Ground -->
  ${groundRect(0, H*0.78, W, H*0.22, C.stoneDark)}
  <rect x="0" y="${H*0.78}" width="${W}" height="${H*0.22}" fill="url(#stone)" opacity="0.6"/>
  <!-- Constantine Arch (Triumphal) -->
  ${romanArch(W*0.28, H*0.08, W*0.44, H*0.78, C.ash)}
  <!-- Side smaller arches -->
  ${romanArch(W*0.08, H*0.32, W*0.22, H*0.54, C.stoneDark)}
  ${romanArch(W*0.7, H*0.32, W*0.22, H*0.54, C.stoneDark)}
  <!-- Reliefs / decorative suggestion on arch -->
  <rect x="${W*0.3}" y="${H*0.12}" width="${W*0.4}" height="${H*0.08}" fill="${C.stoneLight}" opacity="0.3"/>
  <!-- God-rays through chi-rho -->
  ${Array.from({length:8}, (_, i) => {
    const angle = (i * 45) * Math.PI / 180;
    const len = 200;
    const ox = W*0.5, oy = H*0.25;
    const ex = ox + Math.cos(angle) * len;
    const ey = oy + Math.sin(angle) * len;
    return `<line x1="${ox}" y1="${oy}" x2="${ex.toFixed(0)}" y2="${ey.toFixed(0)}" stroke="${C.goldLight}" stroke-width="2" opacity="0.15"/>`;
  }).join('')}
  <!-- Chi-Rho symbol in sky -->
  <text x="${W*0.5}" y="${H*0.3}" text-anchor="middle" font-size="120" fill="${C.goldLight}" opacity="0.25" font-family="serif">☧</text>
  <!-- Soldiers silhouettes -->
  ${[0.15, 0.22, 0.72, 0.79].map(px =>
    `<rect x="${W*px - 8}" y="${H*0.7}" width="16" height="${H*0.1}" rx="3" fill="${C.tintenBraun}" opacity="0.7"/>`
  ).join('')}
  <!-- Vignette -->
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
</svg>`;
}

function makeHagiaSophia() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    ${stonePat('mosaic', '#3D2810', '#6B4820')}
    ${vignette('vig', '#0D0805')}
    <radialGradient id="ocolusGlow" cx="50%" cy="20%" r="35%">
      <stop offset="0%" stop-color="${C.goldLight}" stop-opacity="1"/>
      <stop offset="30%" stop-color="${C.goldDark}" stop-opacity="0.7"/>
      <stop offset="70%" stop-color="${C.terrakotta}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="arch" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${C.ash}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${C.stoneDark}" stop-opacity="0.9"/>
    </linearGradient>
  </defs>
  <!-- Dark interior background -->
  <rect width="${W}" height="${H}" fill="#0D0805"/>
  <rect width="${W}" height="${H}" fill="url(#mosaic)" opacity="0.7"/>
  <!-- Dome glow from oculus -->
  <rect width="${W}" height="${H}" fill="url(#ocolusGlow)"/>
  <!-- Dome arch structural elements -->
  <!-- Main dome ring -->
  <ellipse cx="${W*0.5}" cy="${H*0.12}" rx="${W*0.42}" ry="${H*0.1}" fill="none" stroke="${C.goldDark}" stroke-width="8" opacity="0.5"/>
  <!-- Pendentives / squinches -->
  ${[0.2, 0.4, 0.6, 0.8].map(px => `
    <path d="M ${W*px} ${H*0.22} Q ${W*0.5} ${H*0.02} ${W*(1-px+0.1)} ${H*0.22}" fill="none" stroke="${C.goldDark}" stroke-width="5" opacity="0.3"/>
  `).join('')}
  <!-- Great arches -->
  <path d="M ${W*0.05} ${H} L ${W*0.05} ${H*0.35} Q ${W*0.5} ${H*0.02} ${W*0.95} ${H*0.35} L ${W*0.95} ${H} Z" fill="url(#arch)" opacity="0.75"/>
  <!-- Side colonnades -->
  ${colonnade(W*0.05, H*0.5, W*0.18, H*0.5, 6, C.goldDark, 0.4)}
  ${colonnade(W*0.77, H*0.5, W*0.18, H*0.5, 6, C.goldDark, 0.4)}
  <!-- Windows at dome base (circles of light) -->
  ${Array.from({length:12}, (_, i) => {
    const angle = (i * 30) * Math.PI / 180;
    const cx = W*0.5 + Math.cos(angle - Math.PI/2) * W*0.38;
    const cy = H*0.24 + Math.sin(angle - Math.PI/2) * H*0.06;
    return `<ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="22" ry="28" fill="${C.goldLight}" opacity="${(0.6 + Math.sin(i)*0.3).toFixed(2)}"/>`;
  }).join('')}
  <!-- Golden mosaic Christ figure (abstract) -->
  <radialGradient id="christ" cx="50%" cy="55%" r="20%">
    <stop offset="0%" stop-color="${C.goldDark}" stop-opacity="0.5"/>
    <stop offset="100%" stop-color="${C.goldDark}" stop-opacity="0"/>
  </radialGradient>
  <rect width="${W}" height="${H}" fill="url(#christ)"/>
  <!-- Floor reflections -->
  <rect x="0" y="${H*0.82}" width="${W}" height="${H*0.18}" fill="${C.stoneDark}" opacity="0.8"/>
  <radialGradient id="floorGlow" cx="50%" cy="85%" r="30%">
    <stop offset="0%" stop-color="${C.goldDark}" stop-opacity="0.25"/>
    <stop offset="100%" stop-color="${C.goldDark}" stop-opacity="0"/>
  </radialGradient>
  <rect width="${W}" height="${H}" fill="url(#floorGlow)"/>
  <!-- Vignette -->
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
</svg>`;
}

function makeBasilica() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    ${stonePat('stone', '#3D2810', '#5A3E20')}
    ${stonePat('floor', '#6B5030', '#8B6840')}
    ${vignette('vig', '#0D0805')}
    <linearGradient id="apse" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${C.goldLight}" stop-opacity="0.8"/>
      <stop offset="50%" stop-color="${C.goldDark}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${C.tintenBraun}" stop-opacity="0.9"/>
    </linearGradient>
    <radialGradient id="apseGlow" cx="50%" cy="10%" r="45%">
      <stop offset="0%" stop-color="${C.goldLight}" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="${C.goldDark}" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="${C.tintenBraun}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- Dark stone interior -->
  <rect width="${W}" height="${H}" fill="#1A1008"/>
  <rect width="${W}" height="${H}" fill="url(#stone)" opacity="0.6"/>
  <!-- Apse golden glow at end -->
  <rect width="${W}" height="${H}" fill="url(#apseGlow)"/>
  <!-- Nave ceiling arch -->
  <path d="M ${W*0.15} 0 Q ${W*0.5} ${H*0.1} ${W*0.85} 0" fill="none" stroke="${C.goldDark}" stroke-width="8" opacity="0.4"/>
  <!-- Nave colonnades (perspective) -->
  ${[0, 1, 2, 3, 4].map(i => {
    const depth = i * 0.15;
    const lx = W * (0.15 - depth * 0.05);
    const rx = W * (0.85 + depth * 0.05);
    const y = H * (0.15 + depth * 0.12);
    const ht = H * (0.7 - depth * 0.1);
    const colW = 25 - i * 3;
    return `
      <rect x="${lx}" y="${y}" width="${colW}" height="${ht}" fill="${C.stoneLight}" opacity="${0.7 - i*0.1}"/>
      <ellipse cx="${lx + colW/2}" cy="${y}" rx="${colW * 0.7}" ry="${colW * 0.4}" fill="${C.goldDark}" opacity="${0.4 - i*0.05}"/>
      <rect x="${rx - colW}" y="${y}" width="${colW}" height="${ht}" fill="${C.stoneLight}" opacity="${0.7 - i*0.1}"/>
      <ellipse cx="${rx - colW/2}" cy="${y}" rx="${colW * 0.7}" ry="${colW * 0.4}" fill="${C.goldDark}" opacity="${0.4 - i*0.05}"/>
    `;
  }).join('')}
  <!-- Apse semicircle with mosaic -->
  <path d="M ${W*0.3} ${H} Q ${W*0.3} ${H*0.12} ${W*0.5} ${H*0.12} Q ${W*0.7} ${H*0.12} ${W*0.7} ${H} Z" fill="url(#apse)" opacity="0.85"/>
  <!-- Gold cross in apse -->
  ${crossShape(W*0.5, H*0.35, 80, 110, C.goldLight)}
  <!-- Floor -->
  <rect x="0" y="${H*0.82}" width="${W}" height="${H*0.18}" fill="url(#floor)" opacity="0.7"/>
  <!-- Candles suggestion -->
  ${[0.3, 0.45, 0.55, 0.7].map(px =>
    `<line x1="${W*px}" y1="${H*0.75}" x2="${W*px}" y2="${H*0.65}" stroke="${C.goldLight}" stroke-width="2" opacity="0.5"/>` +
    `<circle cx="${W*px}" cy="${H*0.65}" r="4" fill="${C.goldLight}" opacity="0.8"/>`
  ).join('')}
  <!-- Vignette -->
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
</svg>`;
}

// ─── GENERATE ALL IMAGES ─────────────────────────────────────────────────────

const scenes = [
  { name: 'pantheon',         gen: makePantheon },
  { name: 'forum',            gen: makeForum },
  { name: 'parthenon',        gen: makeParthenon },
  { name: 'catacombs',        gen: makeCatacombs },
  { name: 'ostia',            gen: makeOstia },
  { name: 'colosseum',        gen: makeColosseum },
  { name: 'constantine_arch', gen: makeConstantineArch },
  { name: 'hagia_sophia',     gen: makeHagiaSophia },
  { name: 'basilica',         gen: makeBasilica },
];

async function main() {
  for (const scene of scenes) {
    const svg = scene.gen();
    const outPath = path.join(OUT, `${scene.name}.jpg`);
    await sharp(Buffer.from(svg))
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(outPath);
    const size = (fs.statSync(outPath).size / 1024).toFixed(0);
    console.log(`  [OK] ${scene.name}.jpg — ${size} KB`);
  }
  console.log('\nAll backgrounds generated in', OUT);
}

main().catch(err => { console.error('Error:', err); process.exit(1); });
