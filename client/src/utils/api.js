const ARCHIVIST_SYSTEM = `당신은 Remain의 아카이비스트입니다. 사용자가 삶의 소중한 기억을 발굴하도록 돕는 따뜻한 AI입니다.

반드시 아래 JSON 형식으로만 응답하세요 (마크다운 없이):
{"text":"응답 내용","qr":["선택지1","선택지2"]}

규칙:
- 한국어, 짧고 감성적인 문장 2-3개
- 기억의 감각(냄새·소리·빛·온도·감촉)을 끌어내는 질문으로 끝내기
- 슬픔엔 먼저 공감 {"text":"...","qr":[]}
- qr은 0-4개, 절대 조언/판단 금지`;

const MODES_CTX = [
  "기억의 감각적 디테일을 깊이 파고드세요.",
  "감정과 내면에 집중하세요.",
  "누군가에게 편지를 쓰도록 도와주세요.",
  "대화를 따뜻하게 정리해 주세요.",
];

const BASE = "/api";

async function callProxy(body) {
  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * Chat with archivist
 * @param {Array} history  - [{role, content}]
 * @param {number} modeIdx - 0~3
 */
export async function askClaude(history, modeIdx = 0) {
  try {
    const data = await callProxy({
      system: ARCHIVIST_SYSTEM + "\n추가 지시: " + MODES_CTX[modeIdx],
      messages: history,
    });
    const raw = data.content?.[0]?.text || '{"text":"계속 이야기해 주세요.","qr":[]}';
    return JSON.parse(raw.replace(/```json|```/g, "").trim());
  } catch (err) {
    console.error("[askClaude]", err);
    return { text: "잠시 연결이 끊겼어요. 다시 시도해 주세요.", qr: ["다시 시도"] };
  }
}

/**
 * Save memory to Notion via MCP
 * @param {object} memory - memory object
 * @param {string} userName
 */
export async function saveToNotion(memory, userName) {
  try {
    const prompt = `Remain 앱에서 기억을 저장해주세요.
사용자: ${userName || "익명"}
질문: ${memory.question}
날짜: ${new Date(memory.savedAt).toLocaleDateString("ko-KR")}
감각 태그: ${(memory.senses || []).join(", ") || "없음"}
내용: ${memory.text || "(텍스트 없음)"}

"Remain — 나의 기억들" 데이터베이스를 찾거나 없으면 생성하고 위 내용으로 새 페이지를 만들어주세요.`;

    const data = await callProxy({
      messages: [{ role: "user", content: prompt }],
      mcp_servers: [{ type: "url", url: "https://mcp.notion.com/mcp", name: "notion" }],
    });
    return { ok: !!(data.content?.length > 0) };
  } catch (err) {
    console.error("[saveToNotion]", err);
    return { ok: false };
  }
}
