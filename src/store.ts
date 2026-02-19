import * as fs from "fs";
import * as path from "path";

const DATA_DIR = process.env.DATA_DIR || process.cwd();
const DATA_FILE = path.join(DATA_DIR, "leave-times.json");

export interface LeaveTimeRecord {
  userId: string;
  time: string; // "HH:mm"
  setAt: string; // ISO date
}

let cache: Record<string, LeaveTimeRecord> = {};

function load(): Record<string, LeaveTimeRecord> {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    cache = JSON.parse(raw) as Record<string, LeaveTimeRecord>;
  } catch {
    cache = {};
  }
  return cache;
}

function save(): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(cache, null, 2), "utf-8");
}

export function getLeaveTime(userId: string): LeaveTimeRecord | undefined {
  if (Object.keys(cache).length === 0) load();
  return cache[userId];
}

export function setLeaveTime(userId: string, time: string): LeaveTimeRecord {
  if (Object.keys(cache).length === 0) load();
  const record: LeaveTimeRecord = {
    userId,
    time,
    setAt: new Date().toISOString(),
  };
  cache[userId] = record;
  save();
  return record;
}

export function getAllScheduled(): LeaveTimeRecord[] {
  if (Object.keys(cache).length === 0) load();
  return Object.values(cache);
}
