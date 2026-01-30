#!/bin/bash

# HelixPlot iOS 배포 스크립트
# 사용법: ./scripts/deploy-ios.sh [beta|release|build]

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  HelixPlot iOS 배포 스크립트${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# 프로젝트 루트 디렉토리로 이동
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# 1. 웹 앱 빌드
echo -e "${YELLOW}[1/4] 웹 앱 빌드 중...${NC}"
npm run build
echo -e "${GREEN}✓ 웹 앱 빌드 완료${NC}"
echo ""

# 2. Capacitor iOS 동기화
echo -e "${YELLOW}[2/4] Capacitor iOS 동기화 중...${NC}"
npx cap sync ios
echo -e "${GREEN}✓ iOS 동기화 완료${NC}"
echo ""

# 3. iOS 프로젝트 디렉토리로 이동
cd ios/App

# 배포 타입에 따른 처리
DEPLOY_TYPE=${1:-"build"}

case $DEPLOY_TYPE in
  "beta")
    echo -e "${YELLOW}[3/4] TestFlight 베타 빌드 중...${NC}"
    if command -v fastlane &> /dev/null; then
      bundle exec fastlane beta
      echo -e "${GREEN}✓ TestFlight 업로드 완료${NC}"
    else
      echo -e "${RED}fastlane이 설치되어 있지 않습니다.${NC}"
      echo "설치하려면: bundle install"
      exit 1
    fi
    ;;
  "release")
    echo -e "${YELLOW}[3/4] App Store 릴리스 빌드 중...${NC}"
    if command -v fastlane &> /dev/null; then
      bundle exec fastlane release
      echo -e "${GREEN}✓ App Store 업로드 완료${NC}"
    else
      echo -e "${RED}fastlane이 설치되어 있지 않습니다.${NC}"
      echo "설치하려면: bundle install"
      exit 1
    fi
    ;;
  "build")
    echo -e "${YELLOW}[3/4] Xcode에서 빌드하기...${NC}"
    echo ""
    echo -e "${GREEN}다음 단계를 따라주세요:${NC}"
    echo ""
    echo "1. Xcode 열기:"
    echo "   open App.xcworkspace"
    echo ""
    echo "2. Signing & Capabilities에서 Team 설정"
    echo ""
    echo "3. Product > Archive로 아카이브 생성"
    echo ""
    echo "4. Organizer에서 'Distribute App' 클릭"
    echo ""
    echo "5. 'App Store Connect' 선택 후 업로드"
    echo ""

    # Xcode 열기 (선택적)
    read -p "Xcode를 지금 열까요? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      open App.xcworkspace
    fi
    ;;
  *)
    echo -e "${RED}알 수 없는 배포 타입: $DEPLOY_TYPE${NC}"
    echo "사용법: ./scripts/deploy-ios.sh [beta|release|build]"
    exit 1
    ;;
esac

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  배포 프로세스 완료!${NC}"
echo -e "${GREEN}========================================${NC}"
