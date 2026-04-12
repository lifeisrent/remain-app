import { useState } from "react";
import Soul from "./Soul";
import { SOULS, SENSE_COLORS } from "../utils/constants";

export function ArchiveTab({ active, soul, memories }) {
  const [filter, setFilter] = useState("all");
  const [selectedItem, setSelectedItem] = useState(null);
  const tags = ["all", "냄새", "소리", "감촉", "빛", "감정", "사람"];
  const filtered = filter === "all" ? memories : memories.filter((m) => (m.senses || []).includes(filter));

  return (
    <div className={`screen scr ${active ? "enter" : "exit-down"}`} style={{ bottom: 0, background: "transparent" }}>
      <div style={{ padding: "48px 20px 24px" }}>
        {!selectedItem ? (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: "var(--f-b)", fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--w35)", marginBottom: 6 }}>나의 기록</div>
                <h2 style={{ fontFamily: "var(--f-d)", fontSize: 28, color: "white" }}>아카이브</h2>
              </div>
              <div style={{ opacity: 0.7 }}><Soul id={soul.id} size={0.62} color={soul.color} glow anim="fa" /></div>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[
                { n: memories.length, l: "총 기억", c: "var(--cobalt-lt)" },
                { n: Math.min(memories.length, 30), l: "연속 기록", c: "var(--gold)" },
                { n: new Set(memories.flatMap((m) => m.senses || [])).size || 0, l: "감각 종류", c: "var(--mint)" },
              ].map((s, i) => (
                <div key={i} className="card-dark" style={{ flex: 1, padding: "12px", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--f-d)", fontSize: 22, color: s.c }}>{s.n}</div>
                  <div style={{ fontFamily: "var(--f-b)", fontSize: 10, fontWeight: 700, color: "var(--w35)", marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: 18, overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2 }}>
              {tags.map((t) => (
                <button key={t} onClick={() => setFilter(t)}
                  style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 20, fontFamily: "var(--f-b)", fontSize: 12, fontWeight: 700, cursor: "pointer", border: "none", background: filter === t ? "white" : "var(--w08)", color: filter === t ? "var(--night)" : "var(--w35)" }}>
                  {t === "all" ? "전체" : t}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <Soul id={soul.id} size={0.8} color={soul.color} anim="fa" />
                <p style={{ fontFamily: "var(--f-d)", fontSize: 18, color: "white", marginTop: 16, marginBottom: 8 }}>아직 기억이 없어요</p>
                <p style={{ fontFamily: "var(--f-b)", fontSize: 13, color: "var(--w35)" }}>기록 탭에서 첫 번째 기억을 남겨보세요</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filtered.map((item, i) => {
                  const c = SOULS[i % 4].color;
                  return (
                    <button
                      key={item.id || i}
                      className="arch-item"
                      onClick={() => setSelectedItem(item)}
                      style={{ textAlign: "left", cursor: "pointer", border: "1px solid var(--rim2)", width: "100%", background: "var(--surface)" }}
                    >
                      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, borderRadius: "4px 0 0 4px", background: c }} />
                      <div style={{ paddingLeft: 10 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
                          <p style={{ fontFamily: "var(--f-d)", fontSize: 15, color: "white", lineHeight: 1.3, flex: 1, marginRight: 8 }}>{item.question}</p>
                          <div style={{ fontFamily: "var(--f-m)", fontSize: 10, color: "var(--w35)", flexShrink: 0, marginTop: 2 }}>
                            {item.savedAt ? new Date(item.savedAt).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }) : ""}
                          </div>
                        </div>
                        {item.text && (
                          <p style={{ fontFamily: "var(--f-b)", fontSize: 13, fontWeight: 500, color: "var(--w35)", lineHeight: 1.65, marginBottom: 10 }}>
                            {item.text.slice(0, 80)}{item.text.length > 80 ? "…" : ""}
                          </p>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          {(item.senses || []).slice(0, 3).map((t) => (
                            <span key={t} style={{ background: (SENSE_COLORS[t] || "#fff") + "18", border: `1px solid ${SENSE_COLORS[t] || "#fff"}30`, borderRadius: 20, padding: "3px 9px", fontFamily: "var(--f-b)", fontSize: 11, fontWeight: 700, color: SENSE_COLORS[t] || "var(--w60)" }}>{t}</span>
                          ))}
                          {item.text && <span style={{ marginLeft: "auto", fontFamily: "var(--f-m)", fontSize: 11, color: "var(--w35)" }}>{item.text.length}자</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="fu">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <button
                onClick={() => setSelectedItem(null)}
                style={{ background: "var(--w08)", border: "1px solid var(--rim2)", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", color: "var(--w80)", fontSize: 18, display: "grid", placeItems: "center" }}
              >
                ←
              </button>
              <div>
                <div style={{ fontFamily: "var(--f-b)", fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--w35)", marginBottom: 4 }}>아카이브 상세</div>
                <div style={{ fontFamily: "var(--f-d)", fontSize: 20, color: "white" }}>기록 내용</div>
              </div>
            </div>

            <div className="card-dark" style={{ padding: "18px 16px", borderRadius: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <p style={{ fontFamily: "var(--f-d)", fontSize: 20, color: "white", lineHeight: 1.35, marginRight: 8 }}>{selectedItem.question || "대화 기록"}</p>
                <div style={{ fontFamily: "var(--f-m)", fontSize: 11, color: "var(--w35)", flexShrink: 0 }}>
                  {selectedItem.savedAt ? new Date(selectedItem.savedAt).toLocaleDateString("ko-KR", { year: "numeric", month: "numeric", day: "numeric" }) : ""}
                </div>
              </div>

              {(selectedItem.senses || []).length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {(selectedItem.senses || []).map((t) => (
                    <span key={t} style={{ background: (SENSE_COLORS[t] || "#fff") + "18", border: `1px solid ${SENSE_COLORS[t] || "#fff"}30`, borderRadius: 20, padding: "4px 9px", fontFamily: "var(--f-b)", fontSize: 11, fontWeight: 700, color: SENSE_COLORS[t] || "var(--w60)" }}>{t}</span>
                  ))}
                </div>
              )}

              <div style={{ fontFamily: "var(--f-b)", fontSize: 14, fontWeight: 500, color: "var(--w80)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                {selectedItem.text || "내용이 없어요."}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function PremiumTab({ active, soul }) {
  return (
    <div className={`screen scr ${active ? "enter" : "exit-down"}`} style={{ bottom: 0, background: "transparent" }}>
      <div style={{ padding: "48px 20px 24px" }}>
        <div style={{ opacity: 0.08, position: "absolute", right: 0, top: 40, pointerEvents: "none" }}><Soul id="orb" size={1.1} color="white" anim="fa" /></div>
        <div style={{ fontFamily: "var(--f-b)", fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--w35)", marginBottom: 10 }}>더 깊은 기록</div>
        <h2 style={{ fontFamily: "var(--f-d)", fontSize: 32, color: "white", marginBottom: 12, lineHeight: 1.1 }}>삶 전체를<br />남기세요</h2>
        <p style={{ fontFamily: "var(--f-b)", fontSize: 14, fontWeight: 500, color: "var(--w60)", lineHeight: 1.8, marginBottom: 28 }}>
          사람이 직접 찾아와 2~3시간,<br />당신의 이야기를 영상으로 기록합니다.
        </p>
        {/* Basic plan */}
        <div className="card-dark" style={{ padding: "22px", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: "var(--f-b)", fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--w35)", marginBottom: 6 }}>기본 구독</div>
              <div style={{ fontFamily: "var(--f-d)", fontSize: 20, color: "white" }}>아카이비스트 AI</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--f-b)", fontSize: 26, fontWeight: 900, color: "white" }}>9,900</div>
              <div style={{ fontFamily: "var(--f-b)", fontSize: 12, color: "var(--w35)" }}>원 / 월</div>
            </div>
          </div>
          {["Claude AI 아카이비스트 1:1 대화", "매일 기억 심화 질문", "Notion 자동 동기화", "기억 타임라인 & 아카이브"].map((f) => <div key={f} className="plan-feat">{f}</div>)}
          <button className="btn btn-cobalt btn-full" style={{ marginTop: 18, fontFamily: "var(--f-d)", fontSize: 15 }}>지금 시작하기</button>
        </div>
        {/* Interview plan */}
        <div className="plan-card">
          <div style={{ padding: "26px", background: "linear-gradient(135deg,#1B4AEF,#0F2BAA)" }}>
            <div style={{ fontFamily: "var(--f-b)", fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", padding: "4px 10px", borderRadius: 20, background: "rgba(255,255,255,.18)", color: "white", width: "fit-content", marginBottom: 10 }}>인터뷰 패키지</div>
            <div style={{ fontFamily: "var(--f-d)", fontSize: 24, color: "white", marginBottom: 6 }}>Life Interview</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "white", fontFamily: "var(--f-b)", marginBottom: 14 }}>290,000<span style={{ fontSize: 14, fontWeight: 400, opacity: 0.7 }}>원 / 회</span></div>
            {["전문 인터뷰어 직접 방문", "2~3시간 영상 기록 및 편집", "AI 아카이브 연동", "지정인에게 전달 설정"].map((f) => <div key={f} className="plan-feat">{f}</div>)}
          </div>
        </div>
        {/* Legacy plan */}
        <div className="plan-card">
          <div style={{ padding: "26px", background: "linear-gradient(135deg,#9B30FF,#5B00A0)" }}>
            <div style={{ fontFamily: "var(--f-b)", fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", padding: "4px 10px", borderRadius: 20, background: "rgba(255,255,255,.18)", color: "white", width: "fit-content", marginBottom: 10 }}>레거시 패키지</div>
            <div style={{ fontFamily: "var(--f-d)", fontSize: 24, color: "white", marginBottom: 6 }}>Legacy Vault</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "white", fontFamily: "var(--f-b)", marginBottom: 14 }}>490,000<span style={{ fontSize: 14, fontWeight: 400, opacity: 0.7 }}>원 / 회</span></div>
            {["인터뷰 패키지 전체 포함", "유언장 효력 메시지 전달", "날짜 지정 공개 (사후/기념일)", "법적 검토 연계 파트너", "50년 클라우드 보관 보증"].map((f) => <div key={f} className="plan-feat">{f}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}
