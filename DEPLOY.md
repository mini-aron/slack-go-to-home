# 무료 배포 (다른 사람도 쓰게 하기)

봇을 24시간 켜두려면 서버에 배포해야 합니다. 아래는 **무료**로 쓸 수 있는 방법입니다.

---

## 1. Fly.io (추천)

- **무료 한도**: 소형 VM 3대까지, 트래픽 제한 있음
- **상시 실행** → 퇴근 알림이 설정한 시간에 잘 감

### 준비

1. [Fly.io](https://fly.io) 가입 후 [flyctl 설치](https://fly.io/docs/hacks/install-flyctl/)
2. 터미널에서 로그인: `fly auth login`

### 배포

```bash
# 프로젝트 루트에서
fly launch --no-deploy
```

- App name: 원하는 이름 (또는 엔터로 자동)
- Region: `icn`(인천) 또는 가까운 곳
- PostgreSQL 등 추가 물어보면 **No**

**시크릿 설정** (Slack 토큰을 Fly에 등록):

```bash
fly secrets set SLACK_BOT_TOKEN=xoxb-여기에-봇-토큰
fly secrets set SLACK_APP_TOKEN=xapp-여기에-앱-토큰
fly secrets set SLACK_SIGNING_SECRET=여기에-시크릿
```

**데이터 유지** (재배포해도 퇴근시간 설정 안 사라지게):

```bash
fly volumes create data --size 1
```

`fly.toml`이 생겼다면 `[vm]` 안에 마운트 추가:

```toml
[mounts]
  source = "data"
  destination = "/data"
```

그 다음 환경 변수 추가:

```bash
fly secrets set DATA_DIR=/data
```

**실제 배포**:

```bash
fly deploy
```

이후 `fly status`, `fly logs`로 상태와 로그 확인.

---

## 2. Railway

- [Railway](https://railway.app) 가입 → New Project → **Deploy from GitHub** 로 이 레포 연결
- 환경 변수: `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`, `SLACK_SIGNING_SECRET` 추가
- 빌드: Dockerfile 있으면 자동 사용. 없으면 Nixpacks로 Node 빌드
- **주의**: 무료 크레딧 소진 후 유료 전환 가능. 데이터는 재배포 시 초기화될 수 있음

---

## 3. Render

- [Render](https://render.com) → New → **Background Worker**
- 레포 연결 후:
  - Build: `npm install && npm run build`
  - Start: `npm start`
- Environment에 위 세 개 Slack 시크릿 추가
- **주의**: 무료 플랜은 15분 비활성 시 슬립 → 슬립 중엔 퇴근 알림이 오지 않을 수 있음. 상시 알림이 필요하면 Fly.io 사용 권장.

---

## 정리

| 서비스   | 무료 | 24시간 동작 | 추천 |
|----------|------|-------------|------|
| Fly.io   | ○    | ○           | 다른 사람도 쓰게 할 때 추천 |
| Railway  | 제한적 | ○         | GitHub 연동 편할 때 |
| Render   | ○    | △ (슬립)    | 알림 필수 아니면 가능 |

**다른 사람도 쓰게 하려면** → Fly.io로 배포해 두고, 같은 슬랙 워크스페이스에서 봇 초대(`/invite @봇이름`)만 하면 됩니다. 워크스페이스 멤버는 각자 `퇴근 18:00`처럼 설정해 쓰면 됩니다.
