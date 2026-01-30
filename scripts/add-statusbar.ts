import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCREENSHOTS_DIR = path.join(__dirname, "..", "screenshots", "ios-6.5");
const OUTPUT_DIR = path.join(__dirname, "..", "screenshots", "ios-6.5-final");

// iPhone 6.5" 해상도: 1242 x 2688
const WIDTH = 1242;
const HEIGHT = 2688;
const STATUSBAR_HEIGHT = 132; // 44pt * 3x scale

// iOS 상태바 SVG 생성 (라이트 모드)
function createStatusBarSVG(): Buffer {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

    const svg = `
    <svg width="${WIDTH}" height="${STATUSBAR_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <style>
                .time { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif; font-size: 51px; font-weight: 600; fill: #000; }
                .icon { fill: #000; }
            </style>
        </defs>

        <!-- 배경 (투명 또는 흰색) -->
        <rect width="${WIDTH}" height="${STATUSBAR_HEIGHT}" fill="#f8fafc"/>

        <!-- 시간 (왼쪽) -->
        <text x="90" y="90" class="time">${timeStr}</text>

        <!-- 노치 영역 (중앙) - Dynamic Island 스타일 -->
        <rect x="${WIDTH / 2 - 126}" y="36" width="252" height="60" rx="30" fill="#000"/>

        <!-- 오른쪽 아이콘들 -->
        <!-- 셀룰러 신호 -->
        <g transform="translate(${WIDTH - 330}, 45)">
            <rect x="0" y="24" width="9" height="12" rx="2" class="icon"/>
            <rect x="12" y="18" width="9" height="18" rx="2" class="icon"/>
            <rect x="24" y="12" width="9" height="24" rx="2" class="icon"/>
            <rect x="36" y="6" width="9" height="30" rx="2" class="icon"/>
        </g>

        <!-- 와이파이 -->
        <g transform="translate(${WIDTH - 240}, 42)">
            <path d="M24 12 C24 12 18 18 12 24 C6 18 0 12 0 12 C6 6 18 6 24 12" fill="none" stroke="#000" stroke-width="4" stroke-linecap="round"/>
            <path d="M20 18 C20 18 16 22 12 26 C8 22 4 18 4 18" fill="none" stroke="#000" stroke-width="4" stroke-linecap="round"/>
            <circle cx="12" cy="30" r="4" class="icon"/>
        </g>

        <!-- 배터리 -->
        <g transform="translate(${WIDTH - 150}, 42)">
            <rect x="0" y="6" width="66" height="30" rx="6" fill="none" stroke="#000" stroke-width="3"/>
            <rect x="66" y="15" width="6" height="12" rx="2" class="icon"/>
            <rect x="6" y="12" width="54" height="18" rx="3" fill="#34C759"/>
        </g>
    </svg>`;

    return Buffer.from(svg);
}

async function addStatusBarToScreenshots() {
    console.log("📱 iOS 상태바 추가 시작...\n");

    // 출력 디렉토리 생성
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const statusBarSvg = createStatusBarSVG();

    // 상태바 이미지 생성
    const statusBarImage = await sharp(statusBarSvg).png().toBuffer();

    // 스크린샷 파일 목록
    const files = fs.readdirSync(SCREENSHOTS_DIR).filter((f) => f.endsWith(".png"));

    for (const file of files) {
        const inputPath = path.join(SCREENSHOTS_DIR, file);
        const outputPath = path.join(OUTPUT_DIR, file);

        console.log(`처리 중: ${file}`);

        try {
            // 원본 이미지 읽기
            const originalImage = sharp(inputPath);
            const metadata = await originalImage.metadata();

            if (!metadata.width || !metadata.height) {
                console.log(`  ❌ 메타데이터 읽기 실패`);
                continue;
            }

            // 원본 이미지를 상태바 높이만큼 아래로 이동 (크롭)
            const croppedImage = await sharp(inputPath)
                .extract({
                    left: 0,
                    top: 0,
                    width: metadata.width,
                    height: metadata.height - STATUSBAR_HEIGHT,
                })
                .toBuffer();

            // 상태바 + 크롭된 이미지 합성
            await sharp({
                create: {
                    width: WIDTH,
                    height: HEIGHT,
                    channels: 4,
                    background: { r: 248, g: 250, b: 252, alpha: 1 },
                },
            })
                .composite([
                    { input: statusBarImage, top: 0, left: 0 },
                    { input: croppedImage, top: STATUSBAR_HEIGHT, left: 0 },
                ])
                .png()
                .toFile(outputPath);

            console.log(`  ✅ 저장됨: ${outputPath}`);
        } catch (error) {
            console.log(`  ❌ 오류: ${(error as Error).message}`);
        }
    }

    console.log("\n🎉 상태바 추가 완료!");
    console.log(`📁 저장 위치: ${OUTPUT_DIR}`);
}

addStatusBarToScreenshots();
