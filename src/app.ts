import * as http from "http";
import { App } from "@slack/bolt";
import { getLeaveTime, setLeaveTime, getAllScheduled } from "./store";

const TIME_REGEX = /(\d{1,2}):(\d{2})/;
const KST_OFFSET = 9 * 60;

function parseTime(text: string): string | null {
  const m = text.match(TIME_REGEX);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function nowKST(): { hour: number; minute: number } {
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const kst = new Date(utc + KST_OFFSET * 60000);
  return { hour: kst.getHours(), minute: kst.getMinutes() };
}

function formatTimeHM(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** 퇴근시간(HH:mm)까지 남은 분. 이미 지났으면 0, 아직이면 양수. */
function minutesUntilLeave(now: { hour: number; minute: number }, leaveTime: string): number {
  const [h, m] = leaveTime.split(":").map(Number);
  const nowM = now.hour * 60 + now.minute;
  const leaveM = h * 60 + m;
  const diff = leaveM - nowM;
  return diff <= 0 ? 0 : diff;
}

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

app.message(async ({ message, client, say }) => {
  if (message.subtype === "bot_message" || !("text" in message) || !message.text) return;
  const text = message.text.trim();
  const userId = message.user;

  const setMatch = text.match(/퇴근\s*(\d{1,2}):(\d{2})|퇴근시간\s*(\d{1,2}):(\d{2})/);
  if (setMatch) {
    const time = parseTime(text);
    if (!time) {
      await say({ text: "올바른 시간 형식이 아니에요. 예: 퇴근 18:00" });
      return;
    }
    setLeaveTime(userId, time);
    await say({ text: `퇴근시간을 *${time}*으로 설정했어요. 그때 DM으로 알려드릴게요.` });
    return;
  }

  if (/퇴근시간\s*(알려줘|조회|뭐야|확인)/.test(text) || text === "퇴근시간" || text === "퇴근시간 알려줘") {
    const record = getLeaveTime(userId);
    if (!record) {
      await say({ text: "아직 퇴근시간이 설정되지 않았어요. `퇴근 18:00` 처럼 입력해 주세요." });
      return;
    }
    await say({ text: `현재 퇴근시간은 *${record.time}*이에요.` });
    return;
  }

  // 퇴근시간 몇 분 남았는지
  if (/퇴근(시간)?\s*몇\s*분\s*남았|몇\s*분\s*남았어|퇴근\s*얼마나\s*남았|퇴근시간\s*남은\s*시간|퇴근\s*몇\s*분/.test(text)) {
    const record = getLeaveTime(userId);
    if (!record) {
      await say({ text: "아직 퇴근시간이 설정되지 않았어요. `퇴근 18:00` 처럼 입력해 주세요." });
      return;
    }
    const now = nowKST();
    const minutesLeft = minutesUntilLeave(now, record.time);
    const msg =
      minutesLeft === 0
        ? `이미 퇴근 시간이에요. 퇴근시간 *${record.time}* 수고 많으셨어요.`
        : `퇴근시간 *${minutesLeft}분* 남았어요. (퇴근 ${record.time})`;
    await say({ text: msg });
  }
});

interface SlackClient {
  conversations: { open: (opts: { users: string }) => Promise<{ channel?: { id?: string } }> };
  chat: { postMessage: (opts: { channel: string; text: string }) => Promise<unknown> };
}

async function sendReminders(client: SlackClient): Promise<void> {
  const records = getAllScheduled();
  if (records.length === 0) return;
  const { hour, minute } = nowKST();
  const nowStr = formatTimeHM(hour, minute);

  for (const record of records) {
    if (record.time !== nowStr) continue;
    try {
      const open = await client.conversations.open({ users: record.userId });
      const channel = (open as { channel?: { id?: string } }).channel?.id;
      if (channel) {
        await client.chat.postMessage({
          channel,
          text: `퇴근 시간이에요. 오늘도 수고 많으셨어요.`,
        });
      }
    } catch (e) {
      console.error("Reminder send error:", e);
    }
  }
}

const PORT = Number(process.env.PORT) || 3000;
const server = http.createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("ok");
});
server.listen(PORT, () => {
  console.log(`Health check server listening on ${PORT}`);
});

app.start().then(async () => {
  console.log("퇴근 봇이 실행 중이에요.");
  const client = app.client;
  setInterval(() => sendReminders(client), 60 * 1000);
}).catch((err) => {
  console.error("Slack app start failed:", err);
  process.exit(1);
});
