# Slack 퇴근 봇 (slack-go-home)

퇴근시간을 **설정**하고 **조회**할 수 있으며, 설정한 시간에 **DM으로 알림**을 보내는 슬랙 봇입니다.

## 기능

- **퇴근시간 설정**: `퇴근 18:00` 또는 `퇴근시간 18:30` 입력
- **퇴근시간 조회**: `퇴근시간`, `퇴근시간 알려줘`, `퇴근시간 조회` 입력
- **알림**: 설정한 시간(한국 시간 기준)에 봇이 DM으로 "퇴근 시간이에요" 메시지 전송

## 사전 요구사항

- Node.js 18+
- Slack 워크스페이스 관리자 권한(앱 설치용)

## Slack 앱 설정

1. [Slack API](https://api.slack.com/apps) → **Create New App** → **From scratch**
2. **OAuth & Permissions**에서 Bot Token Scopes 추가:
   - `chat:write` — 메시지 전송
   - `im:write` — DM 채널 열기/전송
   - `im:history` — DM 메시지 수신
   - `channels:history` — 공개 채널 메시지 수신
   - `groups:history` — 비공개 채널 메시지 수신(선택)
   - `users:read` — 사용자 정보
3. **Socket Mode** 활성화 후 **App-Level Token** 생성 (scope: `connections:write`)
4. **Event Subscriptions** 활성화 후 **Subscribe to bot events**:
   - `message.channels`
   - `message.im`
   - (비공개 채널 사용 시) `message.groups`
5. 워크스페이스에 앱 설치(**Install to Workspace**), **Bot User OAuth Token** 복사
6. **Basic Information**에서 **Signing Secret** 복사

## 설치 및 실행

```bash
npm install
cp .env.example .env
# .env 에 SLACK_BOT_TOKEN, SLACK_APP_TOKEN, SLACK_SIGNING_SECRET 입력
npm run build && npm start
# 또는 개발 시
npm run dev
```

## 사용 방법

- 봇을 사용할 **채널에 앱 초대**: 채널에서 `/invite @봇이름`
- 같은 채널 또는 봇과의 DM에서:
  - `퇴근 18:00` → 퇴근시간 18:00으로 설정
  - `퇴근시간 알려줘` → 현재 설정된 퇴근시간 조회

데이터는 프로젝트 루트의 `leave-times.json`에 사용자별로 저장됩니다.
