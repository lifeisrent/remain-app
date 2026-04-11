import Soul from "./Soul";
import { SOULS, QUESTIONS } from "../utils/constants";

export default function HomeTab({ active, user, soul, memories, onWrite, onChat }) {
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
  const days = ["월", "화", "수", "목", "금", "토", "일"];
  const td = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  const memCards = memories.slice(0, 6).map((m, i) => ({
    color: SOULS[i % 4].color,
    soulId: SOULS[i % 4].id,
    label: (m.question || "기억").slice(0, 14),
    date: m.savedAt ? new Date(m.savedAt).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }) : "-",
  }));

  const fallback = [
    { color: "#1B4AEF", soulId: "orb", label: "아버지와의\n마지막 낚시", date: "예시" },
    { color: "#FF4530", soulId: "tri", label: "첫 자취방\n작은 창문", date: "예시" },
  ];

  const mems = memCards.length > 0 ? memCards : fallback;

  return (
    <div className={`screen scr ${active ? "enter" : "exit-down"}`} style={{ bottom: 0, background: "transparent" }}>
      <div style={{ padding: "48px 22px 0" }}>
        {/* Greeting */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: "var(--f-b)", fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--w35)", marginBottom: 6 }}>{today}</div>
            <h1 style={{ fontFamily: "var(--f-d)", fontSize: 28, color: "white", lineHeight: 1.1 }}>
              {user.name ? `${user.name}님,` : "안녕하세요,"}<br />
              <span style={{ color: soul.color }}>오늘도 여기에.</span>
            </h1>
          </div>
          <div style={{ opacity: 0.85, marginTop: 4 }}><Soul id={soul.id} size={0.7} color={soul.color} glow anim="fa" /></div>
        </div>

        {/* Streak */}
        <div style={{ display: "flex", gap: 5, marginBottom: 20 }}>
          {days.map((d, i) => {
            const past = i < td, act = i === td;
            return (
              <div key={d} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div className="streak-dot" style={{ background: act ? "white" : past ? soul.color + "30" : "var(--w08)", border: act ? "2px solid white" : past ? `1.5px solid ${soul.color}50` : "1.5px solid var(--rim)" }}>
                  {past && <div style={{ width: 5, height: 5, borderRadius: "50%", background: soul.color }} />}
                  {act && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--night)", animation: "pulse 2s infinite" }} />}
                </div>
                <span style={{ fontFamily: "var(--f-b)", fontSize: 9, fontWeight: 700, color: act ? "white" : "var(--w35)" }}>{d}</span>
              </div>
            );
          })}
        </div>

        {/* Today Q */}
        <div className="card-dark" style={{ padding: "24px 22px", marginBottom: 14, position: "relative", overflow: "hidden", cursor: "pointer" }} onClick={onWrite}>
          <div style={{ position: "absolute", top: -10, right: -10, width: 100, height: 100, borderRadius: "50%", background: `${soul.color}18`, filter: "blur(25px)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: soul.color, animation: "pulse 2s infinite" }} />
            <span style={{ fontFamily: "var(--f-b)", fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--w35)" }}>오늘의 질문</span>
          </div>
          <p style={{ fontFamily: "var(--f-d)", fontSize: 21, color: "white", lineHeight: 1.45, marginBottom: 18 }}>{QUESTIONS[0].q}</p>
          <div style={{ background: soul.color, borderRadius: 50, padding: "11px 22px", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: "var(--f-b)", fontSize: 13, fontWeight: 700, color: "white" }}>이 기억 꺼내기</span>
            <span style={{ color: "rgba(255,255,255,.7)" }}>→</span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          {[{ n: memories.length, l: "총 기억" }, { n: Math.min(memories.length, 30), l: "연속 기록" }, { n: "∞", l: "남겨질 기억" }].map((s, i) => (
            <div key={i} className="card-dark" style={{ flex: 1, padding: "14px", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--f-d)", fontSize: 24, color: i === 2 ? soul.color : "white" }}>{s.n}</div>
              <div style={{ fontFamily: "var(--f-b)", fontSize: 10, fontWeight: 700, color: "var(--w35)", marginTop: 3 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Archivist promo */}
        <div className="card-glow" style={{ padding: "16px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }} onClick={onChat}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--cobalt)", display: "grid", placeItems: "center", flexShrink: 0 }}><Soul id="orb" size={0.55} color="white" /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "var(--f-b)", fontSize: 13, fontWeight: 700, color: "white", marginBottom: 2 }}>아카이비스트가 기다려요</div>
            <div style={{ fontFamily: "var(--f-b)", fontSize: 12, color: "var(--w35)" }}>Claude AI와 1:1 기억 심화 대화</div>
          </div>
          <span style={{ color: "var(--cobalt-lt)", fontSize: 18 }}>→</span>
        </div>

        <div style={{ fontFamily: "var(--f-d)", fontSize: 18, color: "white", marginBottom: 12 }}>소중한 기억들</div>
      </div>

      <div style={{ display: "flex", gap: 10, padding: "0 22px 8px", overflowX: "auto", scrollbarWidth: "none" }}>
        {mems.map((m, i) => (
          <div key={i} className="mem-chip" style={{ background: `linear-gradient(145deg,${m.color}DD,${m.color}88)` }}>
            <div style={{ position: "absolute", top: 10, right: 12, opacity: 0.25 }}><Soul id={m.soulId} size={0.4} color="white" anim="fa" /></div>
            <div style={{ fontFamily: "var(--f-b)", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.6)", marginBottom: 5 }}>{m.date}</div>
            <div style={{ fontFamily: "var(--f-d)", fontSize: 13, color: "white", lineHeight: 1.35, whiteSpace: "pre-line" }}>{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
