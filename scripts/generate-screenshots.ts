import puppeteer, { Browser, Page } from "puppeteer";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// iPhone 6.5" Display: 1242 x 2688 (3x scale)
const DEVICE_WIDTH = 414;
const DEVICE_HEIGHT = 896;
const DEVICE_SCALE = 3;

const OUTPUT_DIR = path.join(__dirname, "..", "screenshots", "ios-6.5");

async function delay(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
}

async function skipOnboarding(page: Page) {
    await page.evaluate(() => {
        localStorage.setItem(
            "helix-app-store",
            JSON.stringify({
                state: {
                    theme: "diagram",
                    viewMode: "diagram",
                    preset: "math_lissajous_complex",
                    hasSeenOnboarding: true,
                    presetChangeCount: 0,
                },
                version: 0,
            })
        );
    });
}

async function changePreset(page: Page, presetId: string) {
    await page.evaluate((id) => {
        const select = document.querySelector("select") as HTMLSelectElement;
        if (select) {
            select.value = id;
            select.dispatchEvent(new Event("change", { bubbles: true }));
        }
    }, presetId);
    await delay(2500);
}

async function toggleViewMode(page: Page) {
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const viewBtn = buttons.find(
            (b) =>
                b.textContent?.includes("Diagram") ||
                b.textContent?.includes("Quad") ||
                b.textContent?.includes("다이어그램") ||
                b.textContent?.includes("쿼드")
        );
        if (viewBtn) viewBtn.click();
    });
    await delay(1500);
}

async function clickExportButton(page: Page) {
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const exportBtn = buttons.find((b) => b.textContent?.includes("📤"));
        if (exportBtn) exportBtn.click();
    });
    await delay(1000);
}

async function clickSettingsButton(page: Page) {
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button"));
        const settingsBtn = buttons.find((b) => b.textContent?.includes("⚙️"));
        if (settingsBtn) settingsBtn.click();
    });
    await delay(1000);
}

async function closeModal(page: Page) {
    await page.keyboard.press("Escape");
    await delay(500);
}

async function dragCanvas(page: Page) {
    const canvas = await page.$("canvas");
    if (canvas) {
        const box = await canvas.boundingBox();
        if (box) {
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await page.mouse.down();
            await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 - 40, {
                steps: 15,
            });
            await page.mouse.up();
            await delay(800);
        }
    }
}

async function screenshot(page: Page, filename: string, label: string) {
    const outputPath = path.join(OUTPUT_DIR, filename);
    await page.screenshot({ path: outputPath, type: "png", fullPage: false });
    console.log(`   ✅ ${label}: ${filename}`);
}

async function generateScreenshots() {
    console.log("🚀 스크린샷 생성 시작...\n");

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    let browser: Browser | null = null;

    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-web-security"],
        });

        const page = await browser.newPage();

        await page.setViewport({
            width: DEVICE_WIDTH,
            height: DEVICE_HEIGHT,
            deviceScaleFactor: DEVICE_SCALE,
            isMobile: true,
            hasTouch: true,
        });

        // 1단계: 페이지 로드 및 온보딩 스킵 설정
        console.log("📱 앱 초기화 중...");
        await page.goto("http://localhost:4173", { waitUntil: "domcontentloaded" });
        await skipOnboarding(page);

        // 2단계: 새로고침으로 설정 적용
        await page.reload({ waitUntil: "networkidle0" });
        await delay(4000);
        console.log("✅ 앱 로드 완료\n");

        // ========== 스크린샷 1: 메인 화면 (Lissajous) ==========
        console.log("📸 1. 메인 화면");
        await delay(1500);
        await screenshot(page, "01_main_lissajous.png", "Lissajous 곡선");

        // ========== 스크린샷 2: 3D 회전 ==========
        console.log("📸 2. 3D 회전");
        await dragCanvas(page);
        await screenshot(page, "02_3d_rotated.png", "3D 회전 뷰");

        // ========== 스크린샷 3: Rose 곡선 ==========
        console.log("📸 3. Rose 곡선");
        await page.reload({ waitUntil: "networkidle0" });
        await delay(3000);
        await changePreset(page, "math_rose_k5");
        await screenshot(page, "03_rose_curve.png", "Rose 곡선");

        // ========== 스크린샷 4: 아르키메데스 나선 ==========
        console.log("📸 4. 나선");
        await changePreset(page, "math_archimedean");
        await screenshot(page, "04_spiral.png", "아르키메데스 나선");

        // ========== 스크린샷 5: 감쇠 진동 ==========
        console.log("📸 5. 물리학");
        await changePreset(page, "phys_damped_osc");
        await screenshot(page, "05_damped_oscillator.png", "감쇠 진동");

        // ========== 스크린샷 6: 포물선 운동 ==========
        console.log("📸 6. 포물선");
        await changePreset(page, "phys_projectile");
        await screenshot(page, "06_projectile.png", "포물선 운동");

        // ========== 스크린샷 7: 쿼드 뷰 ==========
        console.log("📸 7. 쿼드 뷰");
        await changePreset(page, "math_lissajous_complex");
        await toggleViewMode(page);
        await delay(1000);
        await screenshot(page, "07_quad_view.png", "쿼드 뷰 모드");

        // ========== 스크린샷 8: 다이어그램 복귀 ==========
        console.log("📸 8. 다이어그램");
        await toggleViewMode(page);
        await delay(1000);
        await screenshot(page, "08_diagram_view.png", "다이어그램 뷰");

        // ========== 스크린샷 9: 내보내기 ==========
        console.log("📸 9. 내보내기");
        await clickExportButton(page);
        await delay(800);
        await screenshot(page, "09_export.png", "내보내기 모달");
        await closeModal(page);

        // ========== 스크린샷 10: 설정 ==========
        console.log("📸 10. 설정");
        await clickSettingsButton(page);
        await delay(800);
        await screenshot(page, "10_settings.png", "설정 모달");

        console.log("\n🎉 모든 스크린샷 생성 완료!");
        console.log(`📁 저장 위치: ${OUTPUT_DIR}`);
        console.log(`📐 해상도: 1242 x 2688`);
    } catch (error) {
        console.error("❌ 오류:", error);
    } finally {
        if (browser) await browser.close();
    }
}

generateScreenshots();
