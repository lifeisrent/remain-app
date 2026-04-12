const ARCHIVIST_SYSTEM = `당신은 Remain의 아카이비스트입니다. 사용자의 입력을 읽고 따뜻하게 대화하는 동반자입니다.

반드시 아래 JSON 형식으로만 응답하세요 (마크다운 없이):
{"text":"응답 내용","qr":[]}

규칙:
- 한국어
- 2~4문장
- 사용자의 마지막 입력 맥락에 직접 반응할 것
- 조언/판단/훈계 금지
- 과도한 질문 남발 금지 (필요할 때만 1개)
- qr은 기본 빈 배열`;

const MODES_CTX = [
  "자유 대화 모드입니다. 사용자의 최근 메시지에 자연스럽게 반응하고, 부담 없이 이어 말할 수 있는 따뜻한 대화를 유지하세요.",
  "감정 탐색 모드입니다. 말투를 더 따뜻하고 섬세하게 유지하고, 사용자가 오늘 느꼈을 감정을 스스로 말로 꺼내도록 돕는 질문/반응을 우선하세요. 공감 한 문장을 먼저 두고, 감정의 결(불안·안도·기쁨·피로 등)을 부드럽게 짚어주세요.",
  "편지 쓰기 모드입니다. 사용자가 누군가에게 마음을 전할 수 있도록 문장을 다듬고, 너무 장황하지 않게 정돈된 편지 톤으로 이끌어 주세요.",
  "정리 모드입니다. 사용자가 말한 내용을 짧고 또렷하게 정리하고, 다음에 기록할 핵심 1~2가지를 제안하는 톤으로 응답하세요.",
];

const BASE = "/api";

const WRITE_COACH_SYSTEM = `당신은 Remain의 아카이비스트입니다.
사용자가 작성 중인 기록을 읽고, 그 내용에 공감하며 다음 문장을 이어 쓰기 쉬운 짧은 답변을 해주세요.

반드시 아래 JSON 형식으로만 응답하세요 (마크다운 금지):
{"text":"사용자 글을 읽고 이어지는 짧은 답변"}

규칙:
- 한국어
- 1~2문장
- 조언/판단/훈계 금지
- 사용자가 이미 쓴 문장을 그대로 반복하지 말 것
- 너무 질문만 던지지 말고, 공감 + 부드러운 확장 멘트 중심`;

export async function transcribeAudio(blob, { language = "ko", fileName = "recording.webm" } = {}) {
  const form = new FormData();
  form.append("audio", blob, fileName);
  form.append("language", language);

  const res = await fetch(`${BASE}/transcribe`, {
    method: "POST",
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data;
}

export async function uploadImage(file) {
  const form = new FormData();
  form.append("image", file, file?.name || `remain-${Date.now()}.jpg`);

  const res = await fetch(`${BASE}/upload-image`, {
    method: "POST",
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data;
}

export async function askWriteFollowup({ question, text, senses = [] }) {
  const localFallback = () => {
    const sense = (senses && senses[0]) || "감정";
    return {
      text: `${sense}이 또렷하게 느껴지는 장면이네요. 그때 마음이 어떻게 움직였는지 한 줄만 더 적어볼까요?`,
    };
  };

  try {
    const payload = `[# 질문]\n${question || ""}\n\n[# 작성 중 텍스트]\n${text || ""}\n\n[# 선택한 감각 태그]\n${(senses || []).join(", ") || "없음"}\n\n[# 요청]\n사용자가 이어 쓰기 쉬운 짧은 공감/확장 답변을 1~2문장으로 작성해주세요.`;

    const data = await callProxy({
      system: WRITE_COACH_SYSTEM,
      messages: [{ role: "user", content: payload }],
      max_tokens: 220,
    }, "coach");

    const raw = data.content?.[0]?.text || "";
    const cleaned = raw.replace(/```json|```/g, "").trim();

    try {
      const parsed = JSON.parse(cleaned);
      const textOut = (parsed?.text || "").trim();
      if (!textOut) {
        const f = localFallback();
        return { ...f, error: "empty-text-fallback" };
      }
      return { text: textOut, error: null };
    } catch {
      const fallback = cleaned
        .split("\n")
        .map((v) => v.trim())
        .find(Boolean) || "";
      if (fallback) return { text: fallback, error: "json-parse-fallback" };
      const f = localFallback();
      return { ...f, error: "empty-response-fallback" };
    }
  } catch (err) {
    console.error("[askWriteFollowup]", err);
    const f = localFallback();
    return { ...f, error: `request-fallback:${err?.message || "request-failed"}` };
  }
}

async function callProxy(body, path = "chat") {
  const res = await fetch(`${BASE}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
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
    const raw = data.content?.[0]?.text || "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    try {
      const parsed = JSON.parse(cleaned);
      return { text: (parsed?.text || "").trim() || "계속 이야기해 주세요.", qr: Array.isArray(parsed?.qr) ? parsed.qr : [] };
    } catch {
      const fallback = cleaned || "계속 이야기해 주세요.";
      return { text: fallback, qr: [] };
    }
  } catch (err) {
    console.error("[askClaude]", err);
    return { text: "잠시 연결이 끊겼어요. 다시 시도해 주세요.", qr: [] };
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
