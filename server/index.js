import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === "production";

app.use(express.json({ limit: "1mb" }));

if (IS_PROD) {
  app.use(express.static(join(__dirname, "public")));
} else {
  app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["POST", "GET"],
  }));
}

app.use("/api", rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
}));

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

createServer(app).listen(PORT, () => {
  console.log(`\n🌒 Remain Server running at http://localhost:${PORT}`);
  console.log(`   API Key: ${process.env.ANTHROPIC_API_KEY ? "✓ 설정됨" : "✗ 없음"}\n`);
});
