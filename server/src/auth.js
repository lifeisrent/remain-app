import crypto from "crypto";
import { parse as parseCookie, serialize as serializeCookie } from "cookie";

const SESSION_COOKIE = "remain_session";
const SESSION_TTL_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

export function normalizeUsername(v) {
  return String(v || "").trim().toLowerCase();
}

export function createSessionId() {
  return crypto.randomBytes(24).toString("hex");
}

export function getSessionCookieOptions(req) {
  const isProd = process.env.NODE_ENV === "production";
  const forwardedProto = req.headers["x-forwarded-proto"];
  const secure = isProd ? (forwardedProto ? forwardedProto.includes("https") : true) : false;
  return {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  };
}

export function setSessionCookie(res, sessionId, req) {
  const cookie = serializeCookie(SESSION_COOKIE, sessionId, getSessionCookieOptions(req));
  res.append("Set-Cookie", cookie);
}

export function clearSessionCookie(res, req) {
  const cookie = serializeCookie(SESSION_COOKIE, "", {
    ...getSessionCookieOptions(req),
    maxAge: 0,
  });
  res.append("Set-Cookie", cookie);
}

export function getSessionIdFromReq(req) {
  const raw = req.headers.cookie;
  if (!raw) return null;
  const parsed = parseCookie(raw);
  return parsed[SESSION_COOKIE] || null;
}

export function buildSessionExpiry() {
  return new Date(Date.now() + SESSION_TTL_MS);
}
