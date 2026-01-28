#!/usr/bin/env node
/**
 * Generate store assets: App Icon (512x512) and Feature Graphic (1024x500)
 * Uses sharp (available via @capacitor/assets) to convert SVG → PNG
 */
import sharp from "sharp";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "store-assets");
mkdirSync(outDir, { recursive: true });

// ─── App Icon SVG (512x512) ───────────────────────────────────────
const appIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4F46E5"/>
      <stop offset="40%" stop-color="#7C3AED"/>
      <stop offset="100%" stop-color="#A78BFA"/>
    </linearGradient>
    <clipPath id="roundedRect">
      <rect width="512" height="512" rx="112" ry="112"/>
    </clipPath>
    <radialGradient id="glow1" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="#A78BFA" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#A78BFA" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowDot" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#A78BFA" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#A78BFA" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <g clip-path="url(#roundedRect)">
    <rect width="512" height="512" fill="url(#bg)"/>

    <!-- Glow effects -->
    <ellipse cx="268" cy="240" rx="140" ry="140" fill="url(#glow1)" opacity="0.5"/>
    <ellipse cx="270" cy="270" rx="90" ry="90" fill="url(#glow1)" opacity="0.3"/>

    <!-- Helix curve 1 (main, bright) -->
    <path d="M 96 426 C 176 186, 176 86, 256 136 C 336 186, 336 286, 416 426"
          fill="none" stroke="rgba(255,255,255,0.93)" stroke-width="14"
          stroke-linecap="round" stroke-linejoin="round"/>

    <!-- Helix curve 2 (secondary, dimmer) -->
    <path d="M 96 86 C 176 326, 176 426, 256 376 C 336 326, 336 226, 416 86"
          fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="14"
          stroke-linecap="round" stroke-linejoin="round"/>

    <!-- Center dot glow -->
    <ellipse cx="256" cy="256" rx="34" ry="34" fill="url(#glowDot)"/>

    <!-- Center dot -->
    <circle cx="256" cy="256" r="26" fill="rgba(255,255,255,0.93)"/>
  </g>
</svg>`;

// ─── Feature Graphic SVG (1024x500) ──────────────────────────────
const featureGraphicSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <defs>
    <linearGradient id="bgFeat" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B0F17"/>
      <stop offset="50%" stop-color="#1E1B4B"/>
      <stop offset="100%" stop-color="#0B0F17"/>
    </linearGradient>
    <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4F46E5"/>
      <stop offset="40%" stop-color="#7C3AED"/>
      <stop offset="100%" stop-color="#A78BFA"/>
    </linearGradient>
    <radialGradient id="fGlow1" cx="55%" cy="50%" r="30%">
      <stop offset="0%" stop-color="#4F46E5" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#4F46E5" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="fGlow2" cx="75%" cy="50%" r="25%">
      <stop offset="0%" stop-color="#7C3AED" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#7C3AED" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="fGlow3" cx="15%" cy="60%" r="20%">
      <stop offset="0%" stop-color="#A78BFA" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#A78BFA" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="helixGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#7C3AED" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#7C3AED" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="iconClip">
      <rect x="62" y="380" width="56" height="56" rx="12" ry="12"/>
    </clipPath>
    <linearGradient id="bottomFade" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0B0F17" stop-opacity="0"/>
      <stop offset="100%" stop-color="#0B0F17" stop-opacity="0.25"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1024" height="500" fill="url(#bgFeat)"/>

  <!-- Background glows -->
  <ellipse cx="550" cy="250" rx="300" ry="250" fill="url(#fGlow1)"/>
  <ellipse cx="800" cy="300" rx="200" ry="200" fill="url(#fGlow2)"/>
  <ellipse cx="200" cy="325" rx="150" ry="150" fill="url(#fGlow3)"/>

  <!-- Grid lines (subtle) -->
  <rect x="0" y="100" width="1024" height="1" fill="rgba(255,255,255,0.03)"/>
  <rect x="0" y="400" width="1024" height="1" fill="rgba(255,255,255,0.03)"/>
  <rect x="550" y="0" width="1" height="500" fill="rgba(255,255,255,0.02)"/>

  <!-- Helix glow on right -->
  <ellipse cx="790" cy="250" rx="140" ry="140" fill="url(#helixGlow)" opacity="0.7"/>

  <!-- Helix curve 1 -->
  <path d="M 580 460 C 660 340, 660 90, 790 90 C 920 90, 920 340, 1000 460"
        fill="none" stroke="rgba(255,255,255,0.32)" stroke-width="12"
        stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Helix curve 2 -->
  <path d="M 580 40 C 660 160, 660 410, 790 410 C 920 410, 920 160, 1000 40"
        fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="12"
        stroke-linecap="round" stroke-linejoin="round"/>

  <!-- Center dot -->
  <circle cx="790" cy="250" r="18" fill="rgba(255,255,255,0.45)"/>

  <!-- Axis X -->
  <rect x="770" y="248" width="60" height="2" fill="rgba(239,68,68,0.56)" rx="1"/>
  <!-- Axis Y -->
  <rect x="789" y="218" width="2" height="60" fill="rgba(34,197,94,0.56)" rx="1"/>
  <!-- Axis Z (diagonal going up-left for 3D feel) -->
  <line x1="790" y1="250" x2="770" y2="210" stroke="rgba(59,130,246,0.56)" stroke-width="2" stroke-linecap="round"/>

  <!-- Axis labels -->
  <text x="835" y="255" font-family="Inter, Helvetica, Arial, sans-serif" font-size="14" font-weight="500" fill="rgba(239,68,68,0.73)">x</text>
  <text x="795" y="218" font-family="Inter, Helvetica, Arial, sans-serif" font-size="14" font-weight="500" fill="rgba(34,197,94,0.73)">y</text>
  <text x="760" y="205" font-family="Inter, Helvetica, Arial, sans-serif" font-size="14" font-weight="500" fill="rgba(59,130,246,0.73)">z</text>

  <!-- Title: HelixPlot -->
  <text x="60" y="190" font-family="Inter, Helvetica, Arial, sans-serif" font-size="72" font-weight="800" fill="#FFFFFF" letter-spacing="-2">HelixPlot</text>

  <!-- Accent line -->
  <rect x="62" y="210" width="80" height="3" fill="#A78BFA" rx="2"/>

  <!-- Subtitle -->
  <text x="62" y="252" font-family="Inter, Helvetica, Arial, sans-serif" font-size="32" font-weight="400" fill="#C4B5FD" letter-spacing="1">3D Math Visualizer</text>

  <!-- Tagline -->
  <text x="62" y="300" font-family="Inter, Helvetica, Arial, sans-serif" font-size="18" font-weight="300" fill="rgba(255,255,255,0.56)">
    <tspan x="62" dy="0">Explore parametric curves, surfaces</tspan>
    <tspan x="62" dy="27">&amp; equations in stunning 3D</tspan>
  </text>

  <!-- Mini app icon -->
  <g clip-path="url(#iconClip)">
    <rect x="62" y="380" width="56" height="56" rx="12" fill="url(#iconGrad)"/>
    <path d="M 67 428 C 77 408, 77 398, 90 403 C 103 408, 103 418, 113 428"
          fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="3" stroke-linecap="round"/>
  </g>

  <!-- Store badge text -->
  <text x="130" y="415" font-family="Inter, Helvetica, Arial, sans-serif" font-size="14" font-weight="400" fill="rgba(255,255,255,0.5)">Available on App Store &amp; Google Play</text>

  <!-- Sample equation -->
  <text x="640" y="475" font-family="JetBrains Mono, Menlo, monospace" font-size="13" font-weight="400" fill="rgba(255,255,255,0.25)">r(t) = (sin(t), cos(t), t/4)</text>

  <!-- Bottom fade -->
  <rect x="0" y="450" width="1024" height="50" fill="url(#bottomFade)"/>
</svg>`;

// ─── Generate PNGs ────────────────────────────────────────────────
async function main() {
  console.log("Generating app icon (512x512)...");
  const iconBuffer = Buffer.from(appIconSvg);
  await sharp(iconBuffer)
    .resize(512, 512)
    .png({ quality: 100, compressionLevel: 6 })
    .toFile(join(outDir, "app-icon-512x512.png"));
  console.log("  ✓ app-icon-512x512.png");

  console.log("Generating feature graphic (1024x500)...");
  const featBuffer = Buffer.from(featureGraphicSvg);
  await sharp(featBuffer)
    .resize(1024, 500)
    .png({ quality: 100, compressionLevel: 6 })
    .toFile(join(outDir, "feature-graphic-1024x500.png"));
  console.log("  ✓ feature-graphic-1024x500.png");

  console.log(`\nDone! Files saved to: ${outDir}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
