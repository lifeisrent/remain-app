import { TIMES } from "./constants";

const TIME_MAP = TIMES.reduce((acc, t) => {
  if (t.id !== "none" && t.val !== "—") acc[t.id] = t.val;
  return acc;
}, {});

export function getNotifyTimeValue(notifyTimeId) {
  return TIME_MAP[notifyTimeId] || null;
}

export function formatDateKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isWithinNotifyWindow(now, hhmm, windowMinutes = 5) {
  if (!hhmm) return false;
  const [h, m] = hhmm.split(":").map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  const diffMin = Math.abs(now.getTime() - target.getTime()) / 60000;
  return diffMin <= windowMinutes;
}
