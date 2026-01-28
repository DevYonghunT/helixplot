#!/usr/bin/env node
/**
 * Capture store screenshots for HelixPlot
 * 9:16 portrait (1080x1920) for mobile app stores
 */
import puppeteer from "puppeteer";
import { mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "store-assets", "screenshots");
mkdirSync(outDir, { recursive: true });

const WIDTH = 1080;
const HEIGHT = 1920;
const DEVICE_SCALE = 2; // Retina-quality

// Mobile viewport dimensions (logical pixels)
const VP_W = WIDTH / DEVICE_SCALE;   // 540
const VP_H = HEIGHT / DEVICE_SCALE;  // 960

const DEV_PORT = 5199;
const BASE_URL = `http://localhost:${DEV_PORT}`;

// ── Helper: wait for Three.js canvas to render ───────────────────
async function waitForCanvas(page, ms = 3000) {
  await page.waitForSelector("canvas", { timeout: 15000 });
  await new Promise((r) => setTimeout(r, ms));
}

// ── Helper: screenshot with retina quality ───────────────────────
async function shot(page, name) {
  const path = join(outDir, `${name}.png`);
  await page.screenshot({
    path,
    type: "png",
    clip: { x: 0, y: 0, width: VP_W, height: VP_H },
  });
  console.log(`  ✓ ${name}.png`);
  return path;
}

// ── Helper: dismiss onboarding by setting localStorage ───────────
async function dismissOnboarding(page) {
  await page.evaluateOnNewDocument(() => {
    // Pre-set the Zustand persisted state to skip onboarding
    const state = {
      state: {
        theme: "diagram",
        hasSeenOnboarding: true,
      },
      version: 0,
    };
    localStorage.setItem("helixplot-app-state", JSON.stringify(state));
  });
}

// ── Helper: change preset ────────────────────────────────────────
async function selectPreset(page, presetId) {
  await page.evaluate((id) => {
    const select = document.querySelector("select");
    if (select) {
      select.value = id;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }, presetId);
}

// ── Helper: click button by text content ─────────────────────────
async function clickButton(page, ...textPatterns) {
  return page.evaluate((patterns) => {
    const buttons = [...document.querySelectorAll("button")];
    for (const pattern of patterns) {
      const btn = buttons.find((b) =>
        b.textContent?.includes(pattern) || b.title?.includes(pattern)
      );
      if (btn) { btn.click(); return true; }
    }
    return false;
  }, textPatterns);
}

// ── Start dev server ─────────────────────────────────────────────
function startDevServer() {
  return new Promise((resolve, reject) => {
    const proc = spawn("npx", ["vite", "--port", String(DEV_PORT), "--strictPort"], {
      cwd: join(__dirname, ".."),
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, BROWSER: "none" },
    });

    let started = false;
    const timeout = setTimeout(() => {
      if (!started) {
        reject(new Error("Dev server timeout"));
        proc.kill();
      }
    }, 30000);

    const onData = (data) => {
      const text = data.toString();
      if ((text.includes("Local:") || text.includes("localhost")) && !started) {
        started = true;
        clearTimeout(timeout);
        setTimeout(() => resolve(proc), 1500);
      }
    };

    proc.stdout.on("data", onData);
    proc.stderr.on("data", onData);
    proc.on("error", reject);
    proc.on("exit", (code) => {
      if (!started) reject(new Error(`Dev server exited with code ${code}`));
    });
  });
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log("Starting Vite dev server...");
  const devServer = await startDevServer();
  console.log(`Dev server running on port ${DEV_PORT}\n`);

  let browser;
  try {
    console.log("Launching browser...");
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--use-gl=angle",
        "--enable-webgl",
        "--enable-webgl2",
        "--ignore-gpu-blocklist",
        "--enable-gpu-rasterization",
        "--no-sandbox",
        `--window-size=${VP_W},${VP_H}`,
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({
      width: VP_W,
      height: VP_H,
      deviceScaleFactor: DEVICE_SCALE,
      isMobile: true,
      hasTouch: true,
    });

    // Skip onboarding on first load
    await dismissOnboarding(page);

    // ── Screenshot 1: Hero shot (Light theme, Damped Oscillator) ──
    console.log("1. Hero shot (Light theme - Damped Oscillator)...");
    await page.goto(BASE_URL, { waitUntil: "networkidle2", timeout: 30000 });
    await waitForCanvas(page, 4000);

    await selectPreset(page, "phys_damped_osc");
    await waitForCanvas(page, 3000);
    await shot(page, "01-hero-light-3d");

    // ── Screenshot 2: Dark theme, same preset ─────────────────────
    console.log("2. Dark theme (Damped Oscillator)...");
    await clickButton(page, "다크 모드", "Dark", "라이트 모드", "Light");
    await waitForCanvas(page, 3000);
    await shot(page, "02-hero-dark-3d");

    // ── Screenshot 3: Rose curve (Dark mode) ──────────────────────
    console.log("3. Rose curve (Dark mode)...");
    await selectPreset(page, "math_rose_k5");
    await waitForCanvas(page, 3000);
    await shot(page, "03-rose-curve-dark");

    // ── Screenshot 4: Playback tab with Gaussian Wave ─────────────
    console.log("4. Playback controls (Gaussian Wave)...");
    await selectPreset(page, "phys_gaussian_wave");
    await waitForCanvas(page, 3000);
    await clickButton(page, "재생", "Playback");
    await new Promise((r) => setTimeout(r, 500));
    await shot(page, "04-playback-controls");

    // ── Screenshot 5: Input tab (equation editing) ────────────────
    console.log("5. Input tab (editor)...");
    await clickButton(page, "입력", "Input");
    await new Promise((r) => setTimeout(r, 1000));
    await shot(page, "05-input-editor");

    // ── Screenshot 6: Light theme with Kepler orbit ───────────────
    console.log("6. Kepler orbit (Light theme)...");
    await clickButton(page, "다크 모드", "Dark", "라이트 모드", "Light");
    await selectPreset(page, "phys_kepler");
    await clickButton(page, "재생", "Playback");
    await waitForCanvas(page, 3000);
    await shot(page, "06-kepler-light");

    // ── Screenshot 7: Quad view ───────────────────────────────────
    console.log("7. Quad view...");
    await clickButton(page, "다이어그램 뷰", "Diagram", "쿼드 뷰", "Quad");
    await waitForCanvas(page, 3000);
    await shot(page, "07-quad-view");

    // ── Screenshot 8: Export modal ────────────────────────────────
    console.log("8. Export modal...");
    // Back to diagram view
    await clickButton(page, "다이어그램 뷰", "Diagram", "쿼드 뷰", "Quad");
    await new Promise((r) => setTimeout(r, 500));
    // Click export icon
    await clickButton(page, "📤", "내보내기", "Export");
    await new Promise((r) => setTimeout(r, 1000));
    await shot(page, "08-export-modal");

    console.log(`\nDone! 8 screenshots saved to:\n  ${outDir}`);
  } finally {
    if (browser) await browser.close();
    devServer.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
