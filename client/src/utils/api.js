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

const WRITE_COACH_SYSTEM = `당신은 Remain의 기록 코치입니다.
목표는 사용자가 이미 작성한 기록을 더 깊고 구체적으로 확장하도록 돕는 것입니다.

반드시 아래 JSON 형식으로만 응답하세요 (마크다운 금지):
{"followup":"질문 1개","qr":["짧은 후속 선택지1","짧은 후속 선택지2","짧은 후속 선택지3"]}

규칙:
- 한국어
- 질문은 1개만 (너무 길지 않게)
- 조언/판단/훈계 금지
- 감각(냄새/소리/빛/온도/감촉) 또는 감정 맥락을 파고드는 질문 우선
- 사용자가 이미 쓴 내용을 반복 요약하지 말고, 빈 부분을 찌르는 질문
- qr은 0~3개, 모두 짧고 이어쓰기 좋은 문장 조각`;

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
      followup: `${sense} 기준으로, 방금 장면에서 가장 또렷했던 한 가지를 더 적어볼까요?`,
      qr: ["그때 몸이 먼저 반응했어.", "소리/냄새가 먼저 떠올랐어.", "생각보다 별일 아니었어."],
    };
  };

  try {
    const payload = `[# 질문]\n${question || ""}\n\n[# 작성 중 텍스트]\n${text || ""}\n\n[# 선택한 감각 태그]\n${(senses || []).join(", ") || "없음"}\n\n[# 요청]\n이 기록을 한 단계 깊게 만들 수 있는 후속 질문 1개와 짧은 이어쓰기 선택지를 만들어주세요.`;

    const data = await callProxy({
      system: WRITE_COACH_SYSTEM,
      messages: [{ role: "user", content: payload }],
      max_tokens: 300,
    });

    const raw = data.content?.[0]?.text || "";
    const cleaned = raw.replace(/```json|```/g, "").trim();

    try {
      const parsed = JSON.parse(cleaned);
      const followup = (parsed?.followup || "").trim();
      if (!followup) {
        const f = localFallback();
        return { ...f, error: "empty-followup-fallback" };
      }
      return {
        followup,
        qr: Array.isArray(parsed?.qr) ? parsed.qr.slice(0, 3) : [],
        error: null,
      };
    } catch {
      // fallback: model might return plain text instead of strict JSON
      const fallback = cleaned
        .split("\n")
        .map((v) => v.trim())
        .find(Boolean) || "";
      if (fallback) return { followup: fallback, qr: [], error: "json-parse-fallback" };
      const f = localFallback();
      return { ...f, error: "empty-response-fallback" };
    }
  } catch (err) {
    console.error("[askWriteFollowup]", err);
    const f = localFallback();
    return { ...f, error: `request-fallback:${err?.message || "request-failed"}` };
  }
}

async function callProxy(body) {
  const res = await fetch(`${BASE}/chat`, {
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
