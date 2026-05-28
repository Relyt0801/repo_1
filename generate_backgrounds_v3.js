#!/usr/bin/env node
'use strict';

// generate_backgrounds_v3.js
// Redesign goals vs v2:
//   1. NO visible point-light sources (glow opacity was 0.4–0.7 → max 0.16)
//   2. Single ambient glow per scene, placed BEHIND/BELOW architecture
//   3. Proper 3-layer depth: dark foreground > darker midground > slightly lighter sky/background
//   4. Clean falloff: 6-stop radial gradients (not 3-stop)
//   5. Removed: lens-flare rays, oval hanging-lamp rings, individual candle blobs,
//      hard oculus circles, moon blobs with 0.9 opacity

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const W = 1920;
const H = 1080;
const OUT = path.join(__dirname, 'images_v3');
fs.mkdirSync(OUT, { recursive: true });

const P = {
  bg:          '#07050200',
  bgWarm:      '#0D0804',
  bgDark:      '#050302',
  amber:       '#C8820A',
  amberBright: '#F5A623',
  amberDim:    '#6B4A0F',
  amberDeep:   '#3A2006',
  ember:       '#A0421A',
  gold:        '#D9A441',
  parchment:   '#F5EBD8',
  stone:       '#100C06',    // slightly lighter than pure black = stone texture
  groundDark:  '#060402',
  skyWarm:     '#1A1008',    // warm-tinted dark sky near horizon
};

// ─── PATTERN / GRADIENT HELPERS ──────────────────────────────────────────────

function gridPattern(id, size, color, opacity) {
  return `<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse">
    <path d="M ${size} 0 L 0 0 0 ${size}" fill="none" stroke="${color}" stroke-width="0.5" opacity="${opacity}"/>
  </pattern>`;
}

function linGrad(id, x1, y1, x2, y2, stops) {
  const s = stops.map(([off, c, o]) =>
    `<stop offset="${off}%" stop-color="${c}" stop-opacity="${o}"/>`).join('');
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" gradientUnits="objectBoundingBox">${s}</linearGradient>`;
}

// 6-stop smooth ambient glow — center opacity ≤ 0.26, large radius = invisible source
// The gradient is so wide (60-80% of image) that no single point reads as a "lamp"
function ambientGlow(id, cx, cy, r, color, peak) {
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}" gradientUnits="objectBoundingBox">
    <stop offset="0%"   stop-color="${color}" stop-opacity="${peak.toFixed(3)}"/>
    <stop offset="15%"  stop-color="${color}" stop-opacity="${(peak * 0.78).toFixed(3)}"/>
    <stop offset="35%"  stop-color="${color}" stop-opacity="${(peak * 0.48).toFixed(3)}"/>
    <stop offset="60%"  stop-color="${color}" stop-opacity="${(peak * 0.20).toFixed(3)}"/>
    <stop offset="80%"  stop-color="${color}" stop-opacity="${(peak * 0.06).toFixed(3)}"/>
    <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
  </radialGradient>`;
}

// Vignette — pushes corners to black, slightly stronger than v2
function vignette(id) {
  return `<radialGradient id="${id}" cx="50%" cy="50%" r="72%" gradientUnits="userSpaceOnUse" fx="960" fy="540">
    <stop offset="0%"   stop-color="#000000" stop-opacity="0"/>
    <stop offset="50%"  stop-color="#000000" stop-opacity="0.2"/>
    <stop offset="75%"  stop-color="#000000" stop-opacity="0.55"/>
    <stop offset="100%" stop-color="#000000" stop-opacity="0.92"/>
  </radialGradient>`;
}

function stars(n, maxY = 0.45) {
  const seed = 42;
  let s = '';
  for (let i = 0; i < n; i++) {
    // deterministic pseudo-random so images are reproducible
    const t = Math.sin(seed + i * 127.1) * 43758.5453;
    const u = Math.sin(seed + i * 311.7) * 43758.5453;
    const v = Math.sin(seed + i * 74.3)  * 43758.5453;
    const sx = Math.abs(t - Math.floor(t));
    const sy = Math.abs(u - Math.floor(u)) * maxY;
    const r  = (Math.abs(v - Math.floor(v)) * 1.2 + 0.4).toFixed(1);
    const o  = (Math.abs(Math.sin(seed + i * 53.2)) * 0.45 + 0.1).toFixed(2);
    s += `<circle cx="${Math.round(sx * W)}" cy="${Math.round(sy * H)}" r="${r}" fill="${P.parchment}" opacity="${o}"/>`;
  }
  return s;
}

// ─── ARCHITECTURAL HELPERS ────────────────────────────────────────────────────

function colonnade(x, y, w, h, n, color) {
  const cw = (w * 0.55) / n;
  const gap = w / n;
  return `<g fill="${color}">
    <rect x="${x}" y="${y}" width="${w}" height="${h * 0.07}" rx="1"/>
    <rect x="${x}" y="${y + h * 0.93}" width="${w}" height="${h * 0.07}" rx="1"/>
    ${Array.from({length: n}, (_, i) => {
      const cx = x + gap * i + (gap - cw) / 2;
      return `<rect x="${cx}" y="${y + h*0.07}" width="${cw}" height="${h*0.86}" rx="1"/>`;
    }).join('')}
  </g>`;
}

function arch(x, y, w, h, color) {
  const hw = w / 2, aw = w * 0.52, aTop = y + h * 0.28;
  return `<g fill="${color}">
    <rect x="${x}" y="${y + h*0.28}" width="${w}" height="${h * 0.72}"/>
    <path d="M ${x+hw-aw/2} ${y+h} L ${x+hw-aw/2} ${aTop+aw*0.5}
             Q ${x+hw-aw/2} ${aTop} ${x+hw} ${aTop}
             Q ${x+hw+aw/2} ${aTop} ${x+hw+aw/2} ${aTop+aw*0.5}
             L ${x+hw+aw/2} ${y+h} Z" fill="${P.bgDark}" opacity="0.75"/>
    <rect x="${x}" y="${y+h*0.26}" width="${w}" height="${h*0.045}" opacity="0.7"/>
    <rect x="${x}" y="${y+h*0.22}" width="${w}" height="${h*0.04}"  opacity="0.4"/>
  </g>`;
}

function dome(cx, cy, r, color) {
  const n = 12;
  return `<g fill="${color}">
    <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.45}"/>
    <rect x="${cx-r}" y="${cy}" width="${r*2}" height="${r*0.5}"/>
    <rect x="${cx-r*1.1}" y="${cy+r*0.45}" width="${r*2.2}" height="${r*0.1}" rx="2"/>
    ${colonnade(cx-r*0.82, cy+r*0.5, r*1.64, r*0.5, n, color)}
    <circle cx="${cx}" cy="${cy-r*0.1}" r="${r*0.06}" fill="${P.bgDark}" opacity="0.55"/>
  </g>`;
}

function colosseumSilhouette(x, y, w, h, color) {
  const levels = [
    { yFrac: 0.06, hFrac: 0.27, nArch: 11 },
    { yFrac: 0.33, hFrac: 0.25, nArch: 10 },
    { yFrac: 0.58, hFrac: 0.22, nArch: 9  },
    { yFrac: 0.80, hFrac: 0.20, nArch: 0  },
  ];
  let g = '<g>';
  g += `<ellipse cx="${x+w/2}" cy="${y+h*0.99}" rx="${w*0.52}" ry="${h*0.05}" fill="${color}" opacity="0.25"/>`;
  levels.forEach(({ yFrac, hFrac, nArch }) => {
    const ly = y + h * yFrac, lh = h * hFrac;
    g += `<rect x="${x}" y="${ly}" width="${w}" height="${lh}" fill="${color}" opacity="0.9"/>`;
    if (nArch > 0) {
      const aw = w / nArch;
      for (let i = 0; i < nArch; i++) {
        const ax = x + aw * i + aw * 0.14;
        const aWidth = aw * 0.72;
        const archRad = aWidth / 2;
        g += `<path d="M ${ax} ${ly+lh} L ${ax} ${ly+lh*0.18+archRad}
              Q ${ax} ${ly+lh*0.18} ${ax+archRad} ${ly+lh*0.18}
              Q ${ax+aWidth} ${ly+lh*0.18} ${ax+aWidth} ${ly+lh*0.18+archRad}
              L ${ax+aWidth} ${ly+lh} Z" fill="${P.bgDark}" opacity="0.72"/>`;
      }
    }
  });
  g += '</g>';
  return g;
}

// ─── SCENE WRAPPER ────────────────────────────────────────────────────────────

function scene(defs, bg, layers, glow) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    ${defs}
    ${gridPattern('mainGrid', 55, P.amber, 0.038)}
    ${vignette('vig')}
  </defs>
  ${bg}
  <rect width="${W}" height="${H}" fill="url(#mainGrid)"/>
  ${layers}
  ${glow}
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
</svg>`;
}

// ─── SCENE FUNCTIONS ─────────────────────────────────────────────────────────

// Hero background: Roman Forum at dusk — multi-building silhouettes, horizon warmth
function makeForum() {
  const defs = `
    ${linGrad('sky', '0', '0', '0', '1', [
      [0,   '#080504', 1],
      [38,  '#110B07', 1],
      [65,  '#1C1208', 1],   // noticeably warmer near horizon
      [100, '#0C0806', 1],
    ])}
    ${ambientGlow('glo', '58%', '70%', '74%', P.amber, 0.22)}
    ${ambientGlow('gloL', '10%', '76%', '38%', P.ember, 0.08)}
  `;
  const bg = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  const sc = P.stone;
  const layers = `
    ${stars(45, 0.42)}
    <!-- Ground -->
    <rect x="0" y="${H*0.74}" width="${W}" height="${H*0.26}" fill="${P.groundDark}"/>
    <!-- Horizon haze line -->
    <rect x="0" y="${H*0.73}" width="${W}" height="2" fill="${P.amber}" opacity="0.07"/>
    <!-- Left colonnade (foreground, darker) -->
    <g fill="#0A0704" opacity="0.95">
      ${colonnade(W*0.0, H*0.2, W*0.22, H*0.55, 7, '#0A0704')}
    </g>
    <!-- Central triumphal arch -->
    <g fill="${sc}" opacity="0.92">
      ${arch(W*0.34, H*0.14, W*0.31, H*0.62, sc)}
    </g>
    <!-- Right colonnade (slightly lighter = more distant) -->
    <g fill="#130E09" opacity="0.85">
      ${colonnade(W*0.70, H*0.28, W*0.26, H*0.48, 6, '#130E09')}
    </g>
    <!-- Ground texture -->
    <rect x="0" y="${H*0.74}" width="${W}" height="1" fill="${P.amber}" opacity="0.06"/>
  `;
  const glow = `
    <rect width="${W}" height="${H}" fill="url(#glo)"/>
    <rect width="${W}" height="${H}" fill="url(#gloL)"/>
  `;
  return scene(defs, bg, layers, glow);
}

// Parthenon on the Acropolis — GREEKS as the most famous example
function makeParthenon() {
  const defs = `
    ${linGrad('sky', '0', '0', '0', '1', [
      [0,   '#080A14', 1],   // cool blue-black at zenith
      [30,  '#0D0F18', 1],
      [55,  '#1A1410', 1],   // distinctly warm amber near horizon (behind the rock)
      [75,  '#221608', 1],   // warmest point = just at/behind the Acropolis
      [100, '#0C0806', 1],
    ])}
    ${ambientGlow('glo', '50%', '63%', '66%', '#9A7020', 0.24)}
  `;
  const bg = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  const rock   = '#120E08';   // Acropolis rock — dark warm stone
  const temple = '#0E0C08';   // Parthenon — darker than warm sky = clear silhouette
  const mCol   = '#2A2416';   // faint marble sheen on pediment face

  const layers = `
    ${stars(60, 0.48)}
    <!-- Acropolis rock mass — rises from bottom, creates the hill -->
    <path d="M 0 ${H} L 0 ${H*0.72}
             Q ${W*0.1}  ${H*0.68} ${W*0.22} ${H*0.62}
             Q ${W*0.34} ${H*0.56} ${W*0.42} ${H*0.55}
             Q ${W*0.52} ${H*0.53} ${W*0.58} ${H*0.54}
             Q ${W*0.70} ${H*0.57} ${W*0.82} ${H*0.62}
             Q ${W*0.92} ${H*0.67} ${W}     ${H*0.7}
             L ${W} ${H} Z" fill="${rock}"/>
    <!-- Parthenon colonnade — clear silhouette against sky -->
    <g>
      <!-- Pediment triangle -->
      <polygon points="${W*0.20},${H*0.26} ${W*0.5},${H*0.07} ${W*0.80},${H*0.26}"
               fill="${temple}"/>
      <!-- Hint of marble tint on pediment face -->
      <polygon points="${W*0.22},${H*0.264} ${W*0.5},${H*0.09} ${W*0.78},${H*0.264}"
               fill="${mCol}" opacity="0.12"/>
      <!-- Epistyle / architrave -->
      <rect x="${W*0.19}" y="${H*0.26}" width="${W*0.62}" height="${H*0.026}" fill="${temple}" opacity="0.95"/>
      <!-- Colonnade -->
      ${colonnade(W*0.19, H*0.286, W*0.62, H*0.265, 13, temple)}
      <!-- Stylobate (stepped base) -->
      <rect x="${W*0.175}" y="${H*0.552}" width="${W*0.65}" height="${H*0.016}" fill="${temple}" opacity="0.8"/>
      <rect x="${W*0.16}"  y="${H*0.568}" width="${W*0.68}" height="${H*0.016}" fill="${temple}" opacity="0.65"/>
    </g>
    <!-- Horizon glow line -->
    <rect x="${W*0.12}" y="${H*0.53}" width="${W*0.76}" height="2" fill="${P.amber}" opacity="0.08"/>
  `;
  const glow = `<rect width="${W}" height="${H}" fill="url(#glo)"/>`;
  return scene(defs, bg, layers, glow);
}

// Catacombs — tunnel depth perspective, single distant light
function makeCatacombs() {
  const defs = `
    ${linGrad('bg', '0', '0', '0', '1', [[0,'#040302',1],[100,'#080604',1]])}
    ${ambientGlow('glo', '50%', '47%', '56%', P.amber, 0.22)}
    ${ambientGlow('depth', '50%', '16%', '16%', P.ember, 0.07)}
  `;
  const bg = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
  const sc = '#08060300';
  const wall = '#0A0703';
  const layers = `
    <!-- Side walls -->
    <rect x="0"          y="0" width="${W*0.17}" height="${H}" fill="${wall}"/>
    <rect x="${W*0.83}"  y="0" width="${W*0.17}" height="${H}" fill="${wall}"/>
    <!-- Ceiling slab -->
    <rect x="0" y="0" width="${W}" height="${H*0.11}" fill="${wall}"/>
    <!-- Floor -->
    <rect x="0" y="${H*0.83}" width="${W}" height="${H*0.17}" fill="${wall}" opacity="0.9"/>
    <!-- Outer tunnel arch -->
    <path d="M ${W*0.15} ${H} L ${W*0.15} ${H*0.37}
             Q ${W*0.5}  ${H*0.03} ${W*0.85} ${H*0.37} L ${W*0.85} ${H} Z"
          fill="none" stroke="${P.amberDim}" stroke-width="3.5" opacity="0.22"/>
    <!-- Inner tunnel arch (depth layer 2) -->
    <path d="M ${W*0.27} ${H} L ${W*0.27} ${H*0.42}
             Q ${W*0.5}  ${H*0.12} ${W*0.73} ${H*0.42} L ${W*0.73} ${H} Z"
          fill="${wall}" opacity="0.82"/>
    <!-- Deep tunnel arch (depth layer 3 — far point) -->
    <path d="M ${W*0.38} ${H*0.85} L ${W*0.38} ${H*0.50}
             Q ${W*0.5}  ${H*0.30} ${W*0.62} ${H*0.50} L ${W*0.62} ${H*0.85} Z"
          fill="${wall}" opacity="0.88"/>
    <!-- Orant figure — very subtle, mostly implied -->
    <g opacity="0.28" fill="${P.amber}">
      <circle cx="${W*0.467}" cy="${H*0.395}" r="${W*0.018}"/>
      <rect x="${W*0.454}" y="${H*0.424}" width="${W*0.026}" height="${H*0.11}" rx="4"/>
      <path d="M ${W*0.454} ${H*0.45} L ${W*0.424} ${H*0.50}"
            stroke="${P.amber}" stroke-width="7" stroke-linecap="round" fill="none"/>
      <path d="M ${W*0.48} ${H*0.45} L ${W*0.51} ${H*0.49}"
            stroke="${P.amber}" stroke-width="7" stroke-linecap="round" fill="none"/>
    </g>
    <!-- Ancient wall inscriptions -->
    ${Array.from({length:7}, (_, i) =>
      `<rect x="${W*0.19}" y="${H*(0.32+i*0.07)}" width="${W*0.065}" height="2"
             fill="${P.amber}" opacity="${0.06+i*0.008}"/>`
    ).join('')}
    <!-- Horizon line depth hint -->
    <rect x="${W*0.3}" y="${H*0.52}" width="${W*0.4}" height="1" fill="${P.amber}" opacity="0.05"/>
  `;
  const glow = `
    <rect width="${W}" height="${H}" fill="url(#glo)"/>
    <rect width="${W}" height="${H}" fill="url(#depth)"/>
  `;
  return scene(defs, bg, layers, glow);
}

// Ostia harbor — lighthouse, ships, open Mediterranean night
function makeOstia() {
  const defs = `
    ${linGrad('sky', '0', '0', '0', '1', [
      [0,   '#050608', 1],
      [40,  '#080608', 1],
      [65,  '#100C07', 1],
      [100, '#080604', 1],
    ])}
    ${ambientGlow('glo',  '50%', '66%', '70%', P.amber, 0.21)}
    ${ambientGlow('gloR', '82%', '72%', '36%', P.ember, 0.09)}
    <!-- Lighthouse beacon — small, tight (r=7%), NOT a blob -->
    <radialGradient id="beacon" cx="28.5%" cy="6%" r="7%"
                    gradientUnits="userSpaceOnUse" fx="${W*0.285}" fy="${H*0.06}">
      <stop offset="0%"  stop-color="${P.amberBright}" stop-opacity="0.28"/>
      <stop offset="40%" stop-color="${P.amber}"       stop-opacity="0.10"/>
      <stop offset="100%" stop-color="${P.amber}"       stop-opacity="0"/>
    </radialGradient>
  `;
  const bg = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  const sc = '#0C0806';
  const layers = `
    ${stars(58, 0.48)}
    <!-- Water reflection plane -->
    <rect x="0" y="${H*0.58}" width="${W}" height="${H*0.42}" fill="#03040A" opacity="0.92"/>
    <!-- Horizon line -->
    <rect x="0" y="${H*0.575}" width="${W}" height="2" fill="${P.amber}" opacity="0.08"/>
    <!-- Water shimmer -->
    ${Array.from({length:16}, (_, i) =>
      `<line x1="${W*0.04}" y1="${H*(0.61+i*0.024)}" x2="${W*0.96}" y2="${H*(0.61+i*0.024)}"
             stroke="${P.amber}" stroke-width="1" opacity="${(0.025+Math.sin(i*0.9)*0.015).toFixed(3)}"/>`
    ).join('')}
    <!-- Ground / harbor wall -->
    <rect x="0" y="${H*0.73}" width="${W}" height="${H*0.27}" fill="${P.groundDark}" opacity="0.9"/>
    <!-- Left colonnade -->
    <g fill="${sc}" opacity="0.9">
      ${colonnade(W*0.02, H*0.25, W*0.19, H*0.5, 5, sc)}
    </g>
    <!-- Lighthouse tower -->
    <rect x="${W*0.263}" y="${H*0.09}" width="${W*0.044}" height="${H*0.64}" fill="${sc}" opacity="0.95"/>
    <polygon points="${W*0.257},${H*0.09} ${W*0.285},${H*0.034} ${W*0.313},${H*0.09}"
             fill="${sc}" opacity="0.95"/>
    <!-- Lighthouse flame (tiny, high up) — NOT a glow blob, just a minimal flicker shape -->
    <ellipse cx="${W*0.285}" cy="${H*0.068}" rx="${W*0.004}" ry="${H*0.012}"
             fill="${P.amberBright}" opacity="0.35"/>
    <!-- Ships silhouette -->
    <path d="M ${W*0.54} ${H*0.66} Q ${W*0.63} ${H*0.61} ${W*0.72} ${H*0.66}
             L ${W*0.72} ${H*0.73} L ${W*0.54} ${H*0.73} Z"
          fill="${P.groundDark}" opacity="0.92"/>
    <line x1="${W*0.63}" y1="${H*0.61}" x2="${W*0.63}" y2="${H*0.50}"
          stroke="${P.groundDark}" stroke-width="4" opacity="0.85"/>
    <!-- Ship 2 (right, farther — lighter shade = distance) -->
    <path d="M ${W*0.76} ${H*0.69} Q ${W*0.83} ${H*0.65} ${W*0.90} ${H*0.69}
             L ${W*0.90} ${H*0.74} L ${W*0.76} ${H*0.74} Z"
          fill="#0A0805" opacity="0.78"/>
    <!-- Lighthouse reflection in water -->
    <line x1="${W*0.285}" y1="${H*0.58}" x2="${W*0.285}" y2="${H*0.82}"
          stroke="${P.amber}" stroke-width="2" opacity="0.06"/>
    <!-- Beacon glow (small and controlled) -->
    <rect width="${W}" height="${H}" fill="url(#beacon)"/>
  `;
  const glow = `
    <rect width="${W}" height="${H}" fill="url(#glo)"/>
    <rect width="${W}" height="${H}" fill="url(#gloR)"/>
  `;
  return scene(defs, bg, layers, glow);
}

// Colosseum — massive arena exterior, night — NO visible moon blob
function makeColosseum() {
  const defs = `
    ${linGrad('sky', '0', '0', '0', '1', [
      [0,   '#020100', 1],
      [35,  '#060402', 1],
      [65,  '#0A0604', 1],
      [100, '#070502', 1],
    ])}
    ${ambientGlow('glo',  '50%', '74%', '66%', P.amber, 0.23)}
    ${ambientGlow('fire', '50%', '58%', '24%', P.amberBright, 0.12)}
    <!-- Shadow sides -->
    <linearGradient id="shdL" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"  stop-color="#000000" stop-opacity="0.65"/>
      <stop offset="28%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="shdR" x1="1" y1="0" x2="0" y2="0">
      <stop offset="0%"  stop-color="#000000" stop-opacity="0.65"/>
      <stop offset="28%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>
  `;
  const bg = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  const sc = '#0D0803';
  const layers = `
    ${stars(62, 0.48)}
    <!-- Moon: SMALL natural circle with very gentle corona — NOT a gradient blob -->
    <circle cx="${W*0.78}" cy="${H*0.10}" r="14" fill="${P.parchment}" opacity="0.72"/>
    <circle cx="${W*0.78}" cy="${H*0.10}" r="28" fill="${P.parchment}" opacity="0.04"/>
    <circle cx="${W*0.78}" cy="${H*0.10}" r="52" fill="${P.parchment}" opacity="0.012"/>
    <!-- Ground / piazza -->
    <rect x="0" y="${H*0.80}" width="${W}" height="${H*0.20}" fill="${sc}" opacity="0.95"/>
    <!-- Colosseum silhouette -->
    ${colosseumSilhouette(W*0.04, H*0.03, W*0.92, H*0.80, sc)}
    <!-- Interior fire warmth (very subtle — felt, not seen as a source) -->
    <rect width="${W}" height="${H}" fill="url(#fire)"/>
    <!-- Side shadows to push edges to black -->
    <rect width="${W}" height="${H}" fill="url(#shdL)"/>
    <rect width="${W}" height="${H}" fill="url(#shdR)"/>
  `;
  const glow = `<rect width="${W}" height="${H}" fill="url(#glo)"/>`;
  return scene(defs, bg, layers, glow);
}

// Constantine Arch — triumphal arch, starry night, NO lens-flare rays
function makeConstantineArch() {
  const defs = `
    ${linGrad('sky', '0', '0', '0', '1', [
      [0,   '#030105', 1],
      [40,  '#080408', 1],
      [70,  '#0E0A06', 1],
      [100, '#060402', 1],
    ])}
    ${ambientGlow('glo',  '50%', '68%', '76%', P.gold,  0.22)}
    ${ambientGlow('gloL', '12%', '70%', '36%', P.amber, 0.08)}
    ${ambientGlow('gloR', '88%', '70%', '36%', P.amber, 0.08)}
    <!-- Chi-Rho: a DIFFUSE glow, very low opacity, large radius — no point source -->
    <radialGradient id="chiRho" cx="50%" cy="28%" r="28%"
                    gradientUnits="objectBoundingBox">
      <stop offset="0%"   stop-color="#FFDD66" stop-opacity="0.07"/>
      <stop offset="40%"  stop-color="${P.gold}" stop-opacity="0.03"/>
      <stop offset="100%" stop-color="${P.gold}" stop-opacity="0"/>
    </radialGradient>
  `;
  const bg = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  const sc = '#0E0908';
  const layers = `
    ${stars(55, 0.50)}
    <rect x="0" y="${H*0.82}" width="${W}" height="${H*0.18}" fill="${sc}"/>
    <!-- Main arch -->
    <g fill="${sc}" opacity="0.94">
      ${arch(W*0.29, H*0.07, W*0.42, H*0.78, sc)}
    </g>
    <!-- Side arches (smaller, imply depth) -->
    <g fill="#120C08" opacity="0.88">
      ${arch(W*0.06, H*0.30, W*0.23, H*0.55, '#120C08')}
    </g>
    <g fill="#120C08" opacity="0.88">
      ${arch(W*0.71, H*0.30, W*0.23, H*0.55, '#120C08')}
    </g>
    <!-- Chi-Rho diffuse glow — no rays, no star burst -->
    <rect width="${W}" height="${H}" fill="url(#chiRho)"/>
    <!-- Ground glow line -->
    <rect x="0" y="${H*0.82}" width="${W}" height="2" fill="${P.amber}" opacity="0.10"/>
  `;
  const glow = `
    <rect width="${W}" height="${H}" fill="url(#glo)"/>
    <rect width="${W}" height="${H}" fill="url(#gloL)"/>
    <rect width="${W}" height="${H}" fill="url(#gloR)"/>
  `;
  return scene(defs, bg, layers, glow);
}

// Hagia Sophia interior — NO oval hanging lamps, NO hard oculus circle
// Replaced with: proper arched window slits, unified dome ambient
function makeHagiaSophia() {
  const defs = `
    ${linGrad('bg', '0', '0', '0', '1', [[0,'#050302',1],[100,'#0A0705',1]])}
    ${ambientGlow('glo', '50%', '20%', '60%', P.gold, 0.24)}
    ${ambientGlow('glB', '50%', '88%', '42%', P.amber, 0.11)}
    <!-- Floor reflection -->
    <radialGradient id="fRefl" cx="50%" cy="90%" r="42%" gradientUnits="userSpaceOnUse"
                    fx="${W*0.5}" fy="${H*0.90}">
      <stop offset="0%"   stop-color="${P.gold}" stop-opacity="0.12"/>
      <stop offset="55%"  stop-color="${P.gold}" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="${P.gold}" stop-opacity="0"/>
    </radialGradient>
    <!-- Oculus: soft, wide, NO hard circle — just atmosphere from above -->
    <radialGradient id="oculus" cx="50%" cy="5%" r="22%"
                    gradientUnits="objectBoundingBox">
      <stop offset="0%"   stop-color="#FFE080" stop-opacity="0.12"/>
      <stop offset="35%"  stop-color="${P.gold}" stop-opacity="0.06"/>
      <stop offset="80%"  stop-color="${P.gold}" stop-opacity="0.01"/>
      <stop offset="100%" stop-color="${P.gold}" stop-opacity="0"/>
    </radialGradient>
  `;
  const bg = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
  const sc = '#0C0805';
  const inner = '#100D07';

  // Window slits: thin vertical rectangles at dome-base level, arranged in arc
  function windowSlits(n, cx, cy, arcRx, arcRy, slitW, slitH, color, opacity) {
    return Array.from({length: n}, (_, i) => {
      const a = (i / n) * Math.PI; // upper semicircle only
      const wx = cx + Math.cos(a) * arcRx;
      const wy = cy + Math.sin(a) * arcRy * (-1); // above center
      return `<rect x="${(wx - slitW/2).toFixed(0)}" y="${(wy - slitH/2).toFixed(0)}"
                    width="${slitW}" height="${slitH}" rx="2"
                    fill="${color}" opacity="${opacity}"/>`;
    }).join('');
  }

  const layers = `
    <!-- Side walls -->
    <rect x="0"         y="0" width="${W*0.15}" height="${H}" fill="${sc}"/>
    <rect x="${W*0.85}" y="0" width="${W*0.15}" height="${H}" fill="${sc}"/>
    <!-- Ceiling slab -->
    <rect x="0" y="0" width="${W}" height="${H*0.07}" fill="${sc}"/>
    <!-- Floor -->
    <rect x="0" y="${H*0.85}" width="${W}" height="${H*0.15}" fill="${sc}" opacity="0.95"/>
    <!-- Main dome arch -->
    <path d="M ${W*0.11} ${H} L ${W*0.11} ${H*0.40}
             Q ${W*0.5} ${H*0.0} ${W*0.89} ${H*0.40} L ${W*0.89} ${H} Z"
          fill="${inner}" opacity="0.82"/>
    <!-- Oculus atmosphere (very soft — NOT a circle) -->
    <rect width="${W}" height="${H}" fill="url(#oculus)"/>
    <!-- Window slits at dome base: proper arched thin rectangles -->
    ${windowSlits(12, W*0.5, H*0.40, W*0.36, H*0.06, 12, 38, P.gold, 0.22)}
    <!-- Side colonnades -->
    <g fill="#1A1008" opacity="0.88">
      ${colonnade(W*0.11, H*0.50, W*0.18, H*0.36, 5, '#1A1008')}
    </g>
    <g fill="#1A1008" opacity="0.88">
      ${colonnade(W*0.71, H*0.50, W*0.18, H*0.36, 5, '#1A1008')}
    </g>
    <!-- Floor mosaic reflection (subtle) -->
    <rect width="${W}" height="${H}" fill="url(#fRefl)"/>
    <!-- Suspended chain/lamp: just a thin line, barely visible -->
    <line x1="${W*0.5}" y1="${H*0.07}" x2="${W*0.5}" y2="${H*0.50}"
          stroke="${P.amberDim}" stroke-width="1" opacity="0.15"/>
  `;
  const glow = `
    <rect width="${W}" height="${H}" fill="url(#glo)"/>
    <rect width="${W}" height="${H}" fill="url(#glB)"/>
  `;
  return scene(defs, bg, layers, glow);
}

// Basilica interior — nave perspective, NO individual candle blobs
// Cross: proper proportions + very soft surrounding halo (not the cross itself as source)
function makeBasilica() {
  const defs = `
    ${linGrad('bg', '0', '0', '0', '1', [[0,'#040302',1],[100,'#080604',1]])}
    ${ambientGlow('glo',  '50%', '10%', '56%', P.gold, 0.24)}
    ${ambientGlow('flrA', '50%', '88%', '38%', P.amberDim, 0.11)}
    <!-- Apse glow: spread across top 30%, no hard hotspot -->
    <radialGradient id="apse" cx="50%" cy="10%" r="35%"
                    gradientUnits="objectBoundingBox">
      <stop offset="0%"   stop-color="#FFE060" stop-opacity="0.11"/>
      <stop offset="40%"  stop-color="${P.gold}" stop-opacity="0.05"/>
      <stop offset="75%"  stop-color="${P.amber}" stop-opacity="0.01"/>
      <stop offset="100%" stop-color="${P.amber}" stop-opacity="0"/>
    </radialGradient>
    <!-- Cross halo: very large radius so the cross itself is NOT the source -->
    <radialGradient id="crossHalo" cx="50%" cy="40%" r="18%"
                    gradientUnits="objectBoundingBox">
      <stop offset="0%"   stop-color="${P.gold}" stop-opacity="0.09"/>
      <stop offset="50%"  stop-color="${P.gold}" stop-opacity="0.03"/>
      <stop offset="100%" stop-color="${P.gold}" stop-opacity="0"/>
    </radialGradient>
  `;
  const bg = `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
  const sc = '#0C0805';
  const layers = `
    <!-- Stone walls — perspective inward -->
    <polygon points="${W*0.05},0 ${W*0.21},${H*0.11} ${W*0.21},${H} ${W*0.05},${H}"
             fill="${sc}" opacity="0.92"/>
    <polygon points="${W*0.95},0 ${W*0.79},${H*0.11} ${W*0.79},${H} ${W*0.95},${H}"
             fill="${sc}" opacity="0.92"/>
    <!-- Ceiling -->
    <polygon points="${W*0.05},0 ${W*0.95},0 ${W*0.79},${H*0.11} ${W*0.21},${H*0.11}"
             fill="${sc}" opacity="0.88"/>
    <!-- Floor -->
    <rect x="0" y="${H*0.86}" width="${W}" height="${H*0.14}" fill="${sc}"/>
    <!-- Nave colonnade pairs — proper perspective (5 pairs, converging) -->
    ${Array.from({length: 5}, (_, i) => {
      const d  = i * 0.085;
      const lx = W * (0.21 + d * 0.42);
      const rx = W * (0.79 - d * 0.42);
      const ty = H * (0.13 + d * 0.10);
      const cw = Math.max(6, 20 - i * 3);
      const ch = H * (0.70 - d * 0.08);
      const op = (0.88 - i * 0.10).toFixed(2);
      const colColor = i < 2 ? '#100C07' : '#160F09'; // farther = slightly lighter
      return `
        <rect x="${lx}"        y="${ty}" width="${cw}" height="${ch}"
              fill="${colColor}" opacity="${op}"/>
        <rect x="${rx - cw}"   y="${ty}" width="${cw}" height="${ch}"
              fill="${colColor}" opacity="${op}"/>
      `;
    }).join('')}
    <!-- Apse atmosphere -->
    <rect width="${W}" height="${H}" fill="url(#apse)"/>
    <!-- Cross halo (diffuse — wide, NOT a point source) -->
    <rect width="${W}" height="${H}" fill="url(#crossHalo)"/>
    <!-- Cross — single compound path, NO overlapping rects (avoids opacity artifact) -->
    <path d="
      M ${W*0.489} ${H*0.27}
      L ${W*0.511} ${H*0.27}
      L ${W*0.511} ${H*0.33}
      L ${W*0.536} ${H*0.33}
      L ${W*0.536} ${H*0.388}
      L ${W*0.511} ${H*0.388}
      L ${W*0.511} ${H*0.51}
      L ${W*0.489} ${H*0.51}
      L ${W*0.489} ${H*0.388}
      L ${W*0.464} ${H*0.388}
      L ${W*0.464} ${H*0.33}
      L ${W*0.489} ${H*0.33}
      Z" fill="${P.gold}" opacity="0.52"/>
    <!-- Floor reflection strip (subtle) -->
    <rect x="${W*0.38}" y="${H*0.86}" width="${W*0.24}" height="${H*0.14}"
          fill="${P.gold}" opacity="0.025"/>
  `;
  const glow = `
    <rect width="${W}" height="${H}" fill="url(#glo)"/>
    <rect width="${W}" height="${H}" fill="url(#flrA)"/>
  `;
  return scene(defs, bg, layers, glow);
}

// Pantheon exterior — clean dome silhouette, no icon-like flat appearance
function makePantheon() {
  const defs = `
    ${linGrad('sky', '0', '0', '0', '1', [
      [0,   '#080A10', 1],   // cool blue-dark at zenith
      [42,  '#100E0A', 1],
      [68,  '#1E1408', 1],   // visibly warm near horizon
      [100, '#0C0805', 1],
    ])}
    ${ambientGlow('glo', '50%', '71%', '66%', P.amber, 0.22)}
  `;
  const bg = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  const sc = '#100E0A';   // slightly lighter than void — stone in moonlight
  const layers = `
    ${stars(70, 0.50)}
    <!-- Ground plane -->
    <rect x="0" y="${H*0.78}" width="${W}" height="${H*0.22}" fill="${P.groundDark}"/>
    <!-- Horizon warmth line -->
    <rect x="${W*0.08}" y="${H*0.77}" width="${W*0.84}" height="2" fill="${P.amber}" opacity="0.07"/>
    <!-- Pantheon dome + portico — exterior view from slightly below -->
    <g>
      ${dome(W*0.5, H*0.34, 210, sc)}
    </g>
    <!-- Side trees / context (suggest depth) -->
    <rect x="${W*0.05}" y="${H*0.5}" width="${W*0.04}" height="${H*0.28}" fill="${P.groundDark}" opacity="0.7"/>
    <ellipse cx="${W*0.07}" cy="${H*0.5}" rx="${W*0.035}" ry="${H*0.06}" fill="${P.groundDark}" opacity="0.65"/>
    <rect x="${W*0.91}" y="${H*0.52}" width="${W*0.04}" height="${H*0.26}" fill="${P.groundDark}" opacity="0.7"/>
    <ellipse cx="${W*0.93}" cy="${H*0.52}" rx="${W*0.032}" ry="${H*0.055}" fill="${P.groundDark}" opacity="0.65"/>
  `;
  const glow = `<rect width="${W}" height="${H}" fill="url(#glo)"/>`;
  return scene(defs, bg, layers, glow);
}

// ─── GENERATE ─────────────────────────────────────────────────────────────────
const scenes = [
  { name: 'forum',            fn: makeForum },
  { name: 'parthenon',        fn: makeParthenon },
  { name: 'catacombs',        fn: makeCatacombs },
  { name: 'ostia',            fn: makeOstia },
  { name: 'colosseum',        fn: makeColosseum },
  { name: 'constantine_arch', fn: makeConstantineArch },
  { name: 'hagia_sophia',     fn: makeHagiaSophia },
  { name: 'basilica',         fn: makeBasilica },
  { name: 'pantheon',         fn: makePantheon },
];

async function main() {
  console.log('Generating v3 backgrounds (corrected lighting)...\n');
  for (const s of scenes) {
    const svg = s.fn();
    const out = path.join(OUT, `${s.name}.jpg`);
    await sharp(Buffer.from(svg))
      .jpeg({ quality: 93, mozjpeg: true })
      .toFile(out);
    const kb = (fs.statSync(out).size / 1024).toFixed(0);
    console.log(`  [OK] ${s.name}.jpg — ${kb} KB`);
  }
  console.log(`\nAll v3 backgrounds → ${OUT}`);
}
main().catch(e => { console.error(e); process.exit(1); });
