import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { PrismaClient } from "@prisma/client";
import {
  normalizeUsername,
  createSessionId,
  setSessionCookie,
  clearSessionCookie,
  getSessionIdFromReq,
  buildSessionExpiry,
} from "./src/auth.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "127.0.0.1";
const IS_PROD = process.env.NODE_ENV === "production";
const CLIENT_URLS = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

app.use(express.json({ limit: "1mb" }));

if (IS_PROD) {
  app.use(express.static(join(__dirname, "public")));
} else {
  app.use(cors({
    origin: CLIENT_URLS,
    methods: ["POST", "GET", "PUT", "DELETE"],
    credentials: true,
  }));
}

app.use("/api", rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
}));

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "인증 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
});

async function getSessionUser(req) {
  const sid = getSessionIdFromReq(req);
  if (!sid) return null;
  const session = await prisma.session.findUnique({ where: { id: sid }, include: { user: true } });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: sid } }).catch(() => null);
    return null;
  }
  return session.user;
}

async function requireAuth(req, res, next) {
  try {
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ error: "인증이 필요합니다." });
    req.user = user;
    next();
  } catch (err) {
    console.error("[Auth Middleware Error]", err);
    res.status(500).json({ error: "인증 처리 중 오류" });
  }
}

function toBigIntOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  try {
    return BigInt(v);
  } catch {
    return null;
  }
}

function serializeProfile(profile) {
  if (!profile) return null;
  return {
    ...profile,
    notifyAtMs: profile.notifyAtMs != null ? String(profile.notifyAtMs) : null,
  };
}

app.post("/api/auth/signup", authLimiter, async (req, res) => {
  try {
    const username = normalizeUsername(req.body?.username);
    if (!username) return res.status(400).json({ error: "username이 필요합니다." });
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      return res.status(400).json({ error: "username은 영문 소문자/숫자/_ 조합 3~20자여야 합니다." });
    }

    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) return res.status(409).json({ error: "이미 사용 중인 username입니다." });

    const user = await prisma.user.create({ data: { username } });
    const sid = createSessionId();
    await prisma.session.create({ data: { id: sid, userId: user.id, expiresAt: buildSessionExpiry() } });
    setSessionCookie(res, sid, req);

    return res.json({ ok: true, user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error("[Signup Error]", err);
    return res.status(500).json({ error: "회원가입 중 오류" });
  }
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const username = normalizeUsername(req.body?.username);
    if (!username) return res.status(400).json({ error: "username이 필요합니다." });

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(404).json({ error: "존재하지 않는 username입니다." });

    const sid = createSessionId();
    await prisma.session.create({ data: { id: sid, userId: user.id, expiresAt: buildSessionExpiry() } });
    setSessionCookie(res, sid, req);

    return res.json({ ok: true, user: { id: user.id, username: user.username } });
  } catch (err) {
    console.error("[Login Error]", err);
    return res.status(500).json({ error: "로그인 중 오류" });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  try {
    const sid = getSessionIdFromReq(req);
    if (sid) await prisma.session.delete({ where: { id: sid } }).catch(() => null);
    clearSessionCookie(res, req);
    return res.json({ ok: true });
  } catch (err) {
    console.error("[Logout Error]", err);
    return res.status(500).json({ error: "로그아웃 중 오류" });
  }
});

app.get("/api/auth/me", async (req, res) => {
  try {
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ error: "인증이 필요합니다." });
    const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
    return res.json({ ok: true, user: { id: user.id, username: user.username }, profile: serializeProfile(profile) });
  } catch (err) {
    console.error("[Auth Me Error]", err);
    return res.status(500).json({ error: "세션 확인 중 오류" });
  }
});

app.put("/api/user/profile", requireAuth, async (req, res) => {
  try {
    const payload = req.body || {};
    const profile = await prisma.userProfile.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        name: payload.name ?? null,
        purpose: payload.purpose ?? null,
        soulId: payload.soulId ?? null,
        notifyTime: payload.notifyTime ?? null,
        notifyAtIso: payload.notifyAtIso ?? null,
        notifyAtMs: toBigIntOrNull(payload.notifyAtMs),
      },
      update: {
        name: payload.name ?? null,
        purpose: payload.purpose ?? null,
        soulId: payload.soulId ?? null,
        notifyTime: payload.notifyTime ?? null,
        notifyAtIso: payload.notifyAtIso ?? null,
        notifyAtMs: toBigIntOrNull(payload.notifyAtMs),
      },
    });
    return res.json({ ok: true, profile: serializeProfile(profile) });
  } catch (err) {
    console.error("[Profile Upsert Error]", err);
    return res.status(500).json({ error: "프로필 저장 중 오류" });
  }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const transcribeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "음성 변환 요청이 많습니다. 잠시 후 다시 시도해주세요." },
});

app.post("/api/transcribe", transcribeLimiter, upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "audio 파일이 필요합니다." });

    const provider = (process.env.WHISPER_PROVIDER || "local").toLowerCase();
    const language = "ko"; // fixed per product decision

    const form = new FormData();
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype || "audio/webm" });
    form.append("file", blob, req.file.originalname || "recording.webm");
    form.append("language", language);

    let endpoint = "";
    let modelName = "";
    let headers = {};

    if (provider === "openai") {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) return res.status(500).json({ error: "OPENAI_API_KEY가 설정되지 않았습니다." });
      endpoint = process.env.OPENAI_TRANSCRIBE_URL || "https://api.openai.com/v1/audio/transcriptions";
      modelName = process.env.OPENAI_WHISPER_MODEL || "whisper-1";
      headers = { Authorization: `Bearer ${openaiKey}` };
    } else {
      endpoint = process.env.WHISPER_LOCAL_URL || "http://127.0.0.1:9000/v1/audio/transcriptions";
      modelName = process.env.WHISPER_LOCAL_MODEL || "whisper-1";
      if (process.env.WHISPER_LOCAL_AUTH_BEARER) {
        headers.Authorization = `Bearer ${process.env.WHISPER_LOCAL_AUTH_BEARER}`;
      }
    }

    form.append("model", modelName);

    const startedAt = Date.now();
    const resp = await fetch(endpoint, {
      method: "POST",
      headers,
      body: form,
    });

    const raw = await resp.text();
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { text: raw };
    }

    if (!resp.ok) {
      console.error("[Transcribe Error]", { provider, status: resp.status, body: parsed });
      return res.status(resp.status).json({ error: parsed.error?.message || parsed.error || "음성 변환 실패" });
    }

    const text = parsed.text || parsed.result || parsed.transcript || "";
    return res.json({
      text,
      provider,
      durationMs: Date.now() - startedAt,
    });
  } catch (err) {
    console.error("[Transcribe Server Error]", err);
    return res.status(500).json({ error: "음성 변환 중 서버 오류" });
  }
});

app.post("/api/chat", async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "서버에 API 키가 설정되지 않았습니다." });

  const { messages, system, model = "claude-sonnet-4-20250514", max_tokens = 1000, mcp_servers } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "messages 파라미터가 필요합니다." });

  try {
    const body = { model, max_tokens, messages };
    if (system) body.system = system;
    if (mcp_servers) body.mcp_servers = mcp_servers;
    const headers = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    };
    if (mcp_servers) headers["anthropic-beta"] = "mcp-client-2025-04-04";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers, body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) { console.error("[Claude API Error]", data); return res.status(response.status).json({ error: data.error?.message || "API 오류" }); }
    res.json(data);
  } catch (err) { console.error("[Server Error]", err); res.status(500).json({ error: "서버 오류" }); }
});

app.get("/api/health", (_req, res) => res.json({ status: "ok", time: new Date().toISOString(), env: IS_PROD ? "production" : "development", hasApiKey: !!process.env.ANTHROPIC_API_KEY }));

if (IS_PROD) {
  app.get("*", (_req, res) => res.sendFile(join(__dirname, "public", "index.html")));
}

createServer(app).listen(PORT, HOST, () => {
  console.log(`\n🌒 Remain Server running at http://${HOST}:${PORT}`);
  console.log(`   API Key: ${process.env.ANTHROPIC_API_KEY ? "✓ 설정됨" : "✗ 없음"}`);
  console.log(`   CORS Origins: ${CLIENT_URLS.join(", ")}\n`);
});
