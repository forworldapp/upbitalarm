# 🚨 업비트 실시간 상장 알림 시스템

업비트와 빗썸의 신규 코인 상장을 실시간으로 감지하고 즉시 알림을 보내는 시스템입니다.

## 🎯 주요 기능

- **🔄 실시간 모니터링**: 업비트/빗썸 공지사항 및 API를 30초마다 체크
- **📱 즉시 알림**: 텔레그램, 디스코드, 이메일 알림 지원
- **🔐 보안**: API 키와 개인정보를 환경변수로 안전하게 관리
- **📊 대시보드**: 실시간 상장 현황 및 설정 관리
- **💾 데이터 저장**: 모든 상장 정보를 데이터베이스에 저장

## 🚀 빠른 시작

### 1. 설치
```bash
git clone <repository-url>
cd upbitalarm
npm install
```

### 2. 환경 설정
`.env` 파일에 API 키와 알림 설정을 추가하세요:

```bash
# Upbit API Keys (선택사항 - 공개 API만 사용 가능)
UPBIT_ACCESS_KEY=your_upbit_access_key
UPBIT_SECRET_KEY=your_upbit_secret_key

# Telegram 알림 설정
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id

# Discord 알림 설정 (선택사항)
DISCORD_WEBHOOK_URL=your_discord_webhook_url
```

### 3. 텔레그램 Chat ID 설정
```bash
# 1. 텔레그램에서 봇에게 메시지 보내기
# 2. Chat ID 가져오기
npx tsx get-telegram-chatid.ts

# 3. .env 파일에 TELEGRAM_CHAT_ID 추가
```

## 🎮 실행 방법

### 실시간 모니터링 시작
```bash
npx tsx start-monitoring.ts
```
- 30초마다 자동 모니터링
- 실시간 로그 출력
- Ctrl+C로 중지

### 테스트 실행
```bash
# 종합 테스트
npx tsx test-comprehensive-monitoring.ts

# 실제 모니터링 테스트
npx tsx test-real-monitoring.ts

# 텔레그램 Chat ID 가져오기
npx tsx get-telegram-chatid.ts
```

### 웹 대시보드 실행
```bash
npm run dev
# http://localhost:5000 접속
```

## 📋 사용 가능한 명령어

| 명령어 | 설명 |
|--------|------|
| `npx tsx start-monitoring.ts` | 실시간 모니터링 시작 |
| `npx tsx get-telegram-chatid.ts` | 텔레그램 Chat ID 설정 |
| `npx tsx test-comprehensive-monitoring.ts` | 전체 시스템 테스트 |
| `npx tsx test-real-monitoring.ts` | 실제 데이터 모니터링 테스트 |
| `npm run dev` | 웹 대시보드 개발 모드 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 시작 |
| `npm run check` | TypeScript 타입 체크 |

## 🔧 기술 스택

- **프론트엔드**: React, TypeScript, TailwindCSS, shadcn/ui
- **백엔드**: Express.js, WebSocket, SQLite, Drizzle ORM
- **모니터링**: 업비트 API, 공지사항 스크래핑, cron 스케줄러
- **알림**: 텔레그램 Bot API, Discord Webhook, 이메일

## 📊 모니터링 로그 예시

```
🚀 업비트 실시간 상장 모니터링 시작
================================
📅 시작 시간: 2025. 9. 8. 오후 7:57:19

🔧 설정 확인:
   Upbit Access Key: ✅ 설정됨
   Upbit Secret Key: ✅ 설정됨
   Telegram Bot Token: ✅ 설정됨
   Telegram Chat ID: ✅ 설정됨

[2025. 9. 8. 오후 7:57:19] 🔍 모니터링 실행 중...
🚀 LISTING DETECTED: 알파(ALPHA) KRW, USDT 마켓 디지털 자산 추가
✅ Saved listing: ALPHA
🔔 IMMEDIATE ALERT: New UPBIT listing - 알파 (ALPHA)
📨 Notification sent for ALPHA
```

## 🔐 보안 고려사항

- ✅ API 키는 `.env` 파일에서 관리
- ✅ `.gitignore`에 환경변수 파일 제외
- ✅ 실제 키는 GitHub에 노출되지 않음
- ✅ 최소 권한 원칙으로 API 사용

## 🚨 알림 설정

### 텔레그램 봇 설정
1. @BotFather에서 봇 생성
2. Bot Token 획득
3. 봇에게 메시지 보내기
4. `get-telegram-chatid.ts` 실행하여 Chat ID 획득

### Discord 웹훅 설정
1. Discord 서버 설정 → 연동 → 웹후크
2. 웹후크 URL 복사하여 `.env`에 추가

## 📈 성능 최적화

- 30초마다 모니터링으로 빠른 감지
- API와 스크래핑 이중 체크로 누락 방지
- 중복 알림 방지 시스템
- 효율적인 데이터베이스 인덱싱

## 🐛 문제 해결

### 텔레그램 알림이 안 올 때
1. Chat ID가 올바르게 설정되었는지 확인
2. 봇에게 먼저 메시지를 보냈는지 확인

### API 연결 실패 시
- 업비트 API 키 확인 (선택사항)
- 네트워크 연결 상태 확인
- 폴백 모드로 자동 전환됨

### 모니터링이 멈출 때
- 로그 확인 후 `npx tsx start-monitoring.ts` 재실행

## 📞 지원

시스템 관련 문의나 버그 신고는 GitHub Issues를 이용해주세요.
