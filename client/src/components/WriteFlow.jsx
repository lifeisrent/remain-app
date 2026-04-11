import { useState, useEffect, useRef } from "react";
import Soul from "./Soul";
import { QUESTIONS, SENSE_COLORS } from "../utils/constants";

export default function WriteFlow({ active, step, setStep, q, qIdx, setQIdx, soul, saveMemory, onBack }) {
  if (!active) return null;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <WriteCard active={step === "card"} q={q} qIdx={qIdx} setQIdx={setQIdx} soul={soul}
        onWrite={() => setStep("writing")} onBack={onBack} />
      <WriteEditor active={step === "writing"} q={q} soul={soul}
        onBack={() => setStep("card")}
        onSave={async (data) => { await saveMemory({ ...data, question: q.q }); setStep("saving"); }} />
      <WriteSaving active={step === "saving"} q={q} soul={soul} onDone={() => setStep("done")} />
      <WriteDone active={step === "done"} soul={soul} onNext={() => { setQIdx((i) => (i + 1) % QUESTIONS.length); setStep("card"); }} />
    </div>
  );
}

function WriteCard({ active, q, qIdx, setQIdx, soul, onWrite, onBack }) {
  return (
    <div className={`screen scr ${active ? "enter" : "exit-down"}`} style={{ bottom: 70, background: "transparent" }}>
      <div style={{ padding: "48px 20px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <button onClick={onBack} style={{ background: "var(--w08)", border: "1px solid var(--rim2)", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", color: "var(--w60)", fontSize: 18, display: "grid", placeItems: "center" }}>←</button>
          <span style={{ fontFamily: "var(--f-b)", fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--w35)" }}>오늘의 기록</span>
          <div style={{ marginLeft: "auto", opacity: 0.75 }}><Soul id={soul.id} size={0.62} color={soul.color} glow anim="fa" /></div>
        </div>
        <div className="card-dark" style={{ padding: "28px 24px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -15, right: -15, width: 120, height: 120, borderRadius: "50%", background: `${soul.color}18`, filter: "blur(30px)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--cobalt)", display: "grid", placeItems: "center" }}><span style={{ fontFamily: "var(--f-b)", fontSize: 11, fontWeight: 700, color: "white" }}>Q</span></div>
            <span style={{ fontFamily: "var(--f-b)", fontSize: 11, fontWeight: 700, color: "var(--w35)" }}>{qIdx + 1}/{QUESTIONS.length}</span>
          </div>
          <p style={{ fontFamily: "var(--f-d)", fontSize: 24, color: "white", lineHeight: 1.4, marginBottom: 12 }}>{q.q}</p>
          <p style={{ fontFamily: "var(--f-b)", fontSize: 13, fontWeight: 500, color: "var(--w35)", fontStyle: "italic", marginBottom: 24 }}>천천히, 당신의 언어로 이야기해 주세요.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 24 }}>
            {q.senses.map((s) => <span key={s} style={{ background: "var(--w08)", border: "1.5px solid var(--rim2)", borderRadius: 20, padding: "6px 12px", fontFamily: "var(--f-b)", fontSize: 11, fontWeight: 700, color: "var(--w35)" }}>{s}</span>)}
          </div>
          <button className="btn btn-white btn-full" style={{ fontSize: 15 }} onClick={onWrite}>이 기억 꺼내기</button>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16 }}>
          <button onClick={() => setQIdx((i) => (i + 1) % QUESTIONS.length)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--f-b)", fontSize: 12, fontWeight: 700, color: "var(--w35)" }}>다른 질문</button>
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--f-b)", fontSize: 12, fontWeight: 700, color: "var(--w35)" }}>건너뛸게요</button>
        </div>
      </div>
    </div>
  );
}

function depthInfo(chars, senses) {
  const t = Math.min(chars / 4 + senses.length * 15, 100);
  if (t < 15) return { pct: t, label: "아직 비어있어요", color: "var(--w15)" };
  if (t < 35) return { pct: t, label: "이야기가 시작됐어요", color: "#D4A017" };
  if (t < 60) return { pct: t, label: "기억이 선명해지고 있어요", color: "var(--cobalt-lt)" };
  if (t < 80) return { pct: t, label: "풍요로운 기억이에요", color: "var(--mint)" };
  return { pct: t, label: "아름답게 완성됐어요", color: "var(--gold)" };
}

function WriteEditor({ active, q, soul, onBack, onSave }) {
  const [text, setText] = useState("");
  const [senses, setSenses] = useState([]);
  const [hintIdx, setHintIdx] = useState(0);
  const [hintOn, setHintOn] = useState(false);
  const [rec, setRec] = useState(false);
  const [media, setMedia] = useState([]);
  const [saving, setSaving] = useState(false);
  const ref = useRef(null);
  const depth = depthInfo(text.length, senses);

  useEffect(() => {
    if (active) setTimeout(() => ref.current?.focus(), 600);
    else { setText(""); setSenses([]); setHintOn(false); setHintIdx(0); setMedia([]); setRec(false); setSaving(false); }
  }, [active]);

  useEffect(() => {
    if (text.length > 30 && !hintOn) {
      const t = setTimeout(() => setHintOn(true), 1200);
      return () => clearTimeout(t);
    }
  }, [text.length]);

  const nextHint = () => { setHintOn(false); setTimeout(() => { setHintIdx((i) => (i + 1) % q.hints.length); setHintOn(true); }, 280); };
  const toggleS = (s) => setSenses((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);
  const toggleM = (t) => {
    if (t === "voice") { setRec((r) => !r); if (!rec) setMedia((p) => p.includes("voice") ? p : [...p, "voice"]); }
    else setMedia((p) => p.includes(t) ? p : [...p, t]);
  };
  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    await onSave({ text, senses, media, date: new Date().toISOString() });
  };

  return (
    <div className={`screen scr ${active ? "enter" : "exit-down"}`} style={{ bottom: 0, background: "linear-gradient(180deg,#0E0B1C,#0C0A18)" }}>
      <div style={{ position: "absolute", width: 180, height: 180, top: 60, right: -40, borderRadius: "50%", background: senses.length > 0 ? SENSE_COLORS[senses[0]] + "18" : "rgba(75,118,255,.1)", filter: "blur(60px)", pointerEvents: "none", transition: "background 1s" }} />

      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "52px 20px 16px", borderBottom: "1px solid var(--rim)", position: "relative", zIndex: 5 }}>
        <button onClick={onBack} style={{ background: "var(--w08)", border: "1px solid var(--rim2)", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", color: "var(--w60)", fontSize: 18, display: "grid", placeItems: "center", flexShrink: 0 }}>←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--f-b)", fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--w35)" }}>기억 꺼내기</div>
          <div style={{ fontFamily: "var(--f-b)", fontSize: 13, fontWeight: 500, color: "var(--w60)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.q}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontFamily: "var(--f-b)", fontSize: 10, fontWeight: 700, color: depth.color, transition: "color .8s" }}>{depth.label}</div>
          <div className="depth-track" style={{ width: 68, marginTop: 5 }}><div className="depth-fill" style={{ width: `${depth.pct}%`, background: depth.color }} /></div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", zIndex: 3 }}>
        <div style={{ padding: "18px 22px 0" }}>
          <p style={{ fontFamily: "var(--f-b)", fontSize: 15, fontWeight: 700, color: "var(--w35)", lineHeight: 1.5, borderLeft: `2px solid ${soul.color}50`, paddingLeft: 12, fontStyle: "italic" }}>{q.q}</p>
        </div>
        <div style={{ padding: "14px 22px 0", flex: 1, display: "flex", flexDirection: "column" }}>
          <textarea ref={ref} value={text} onChange={(e) => setText(e.target.value)}
            placeholder={"천천히, 당신의 언어로\n이야기해 주세요…"}
            style={{ flex: 1, minHeight: 160, background: "transparent", border: "none", outline: "none", resize: "none", fontFamily: "var(--f-b)", fontSize: 16, fontWeight: 500, lineHeight: 1.85, color: "var(--w95)" }} />
          {text.length > 0 && <div style={{ fontFamily: "var(--f-m)", fontSize: 10, color: "var(--w35)", textAlign: "right", paddingBottom: 8 }}>{text.length}자</div>}
        </div>

        {hintOn && (
          <div className="hint-box" style={{ margin: "0 18px 12px", background: "rgba(27,74,239,.1)", border: "1px solid rgba(27,74,239,.22)", borderRadius: 15, padding: "11px 15px", display: "flex", alignItems: "flex-start", gap: 9, cursor: "pointer" }} onClick={nextHint}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: "rgba(27,74,239,.3)", display: "grid", placeItems: "center", flexShrink: 0 }}><Soul id="orb" size={0.3} color="white" /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--f-b)", fontSize: 10, fontWeight: 700, color: "rgba(75,118,255,.9)", letterSpacing: "1px", marginBottom: 3 }}>아카이비스트</div>
              <div style={{ fontFamily: "var(--f-b)", fontSize: 13, fontWeight: 500, color: "var(--w60)", lineHeight: 1.6 }}>{q.hints[hintIdx]}</div>
            </div>
            <span style={{ fontFamily: "var(--f-b)", fontSize: 11, fontWeight: 700, color: "var(--w35)", flexShrink: 0, marginTop: 2 }}>다음 →</span>
          </div>
        )}

        <div style={{ padding: "0 18px 12px" }}>
          <div style={{ fontFamily: "var(--f-b)", fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--w35)", marginBottom: 8 }}>이 기억의 감각</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {q.senses.map((s) => { const on = senses.includes(s); const c = SENSE_COLORS[s] || "#fff"; return <div key={s} className={`sense-chip ${on ? "" : "off"}`} style={{ background: on ? c + "22" : "", borderColor: on ? c : "", color: on ? c : "" }} onClick={() => toggleS(s)}>{s}</div>; })}
          </div>
        </div>

        <div style={{ padding: "0 18px 14px" }}>
          <div style={{ fontFamily: "var(--f-b)", fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--w35)", marginBottom: 8 }}>더 담기</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[{ t: "voice", icon: "🎙️", label: "음성" }, { t: "photo", icon: "📷", label: "사진" }, { t: "music", icon: "♪", label: "노래" }, { t: "video", icon: "🎞", label: "영상" }].map((m) => (
              <button key={m.t} className={`media-btn ${m.t === "voice" && rec ? "rec" : ""}`} onClick={() => toggleM(m.t)}>
                {m.t === "voice" && rec
                  ? <div style={{ display: "flex", gap: 2, height: 22, alignItems: "center" }}>{[0.3, 0.8, 1.3, 0.6, 0.9, 1.5, 0.5].map((h, i) => <div key={i} className="wave-bar" style={{ "--h": h, "--d": `${i * 0.07}s`, height: 6 + h * 8 }} />)}</div>
                  : <span style={{ fontSize: 20 }}>{m.icon}</span>}
                <span style={{ fontFamily: "var(--f-b)", fontSize: 10, fontWeight: 700, color: m.t === "voice" && rec ? "var(--coral)" : media.includes(m.t) ? "white" : "var(--w35)" }}>
                  {media.includes(m.t) && m.t !== "voice" ? `✓${m.label}` : m.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "4px 18px 36px" }}>
          <button className="btn btn-full" disabled={(!text.length && !senses.length && !media.length) || saving}
            style={{ fontFamily: "var(--f-d)", fontSize: 16, background: text.length > 0 && !saving ? "white" : "var(--w08)", color: text.length > 0 && !saving ? "var(--night)" : "var(--w35)", borderRadius: 50, padding: 16 }}
            onClick={handleSave}>
            {saving ? "저장 중…" : "기억으로 남기기"}
          </button>
        </div>
      </div>
    </div>
  );
}

function WriteSaving({ active, q, soul, onDone }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    if (!active) { setP(0); return; }
    let v = 0;
    const t = setInterval(() => { v += 3 + Math.random() * 5; if (v >= 100) { v = 100; clearInterval(t); setTimeout(onDone, 500); } setP(v); }, 80);
    return () => clearInterval(t);
  }, [active]);
  return (
    <div className={`screen ${active ? "enter" : "exit-down"}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px", background: "var(--night)" }}>
      <div style={{ position: "absolute", width: 300, height: 300, top: "40%", left: "50%", transform: "translate(-50%,-50%)", borderRadius: "50%", background: `radial-gradient(circle,${soul.color}12,transparent 70%)` }} />
      <div style={{ opacity: p > 5 ? 1 : 0, transform: p > 5 ? "scale(1)" : "scale(.6)", transition: "all .8s cubic-bezier(.34,1.4,.64,1)", marginBottom: 24 }}>
        <Soul id={soul.id} size={1.5} color={soul.color} glow anim="fa" />
      </div>
      <div style={{ textAlign: "center", opacity: p > 10 ? 1 : 0, transition: "all .6s ease .3s" }}>
        <div style={{ fontFamily: "var(--f-b)", fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--w35)", marginBottom: 12 }}>기억 보관 중</div>
        <p style={{ fontFamily: "var(--f-d)", fontSize: 20, color: "white", marginBottom: 6 }}>{q.q.slice(0, 16)}…</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 20 }}>
          <span className="badge badge-ok">💾 로컬 저장</span>
          <span className="badge badge-warn">📓 Notion 동기화 중</span>
        </div>
        <div style={{ width: 180, height: 2, background: "var(--w08)", borderRadius: 2, overflow: "hidden", margin: "0 auto" }}>
          <div style={{ height: "100%", background: "white", borderRadius: 2, width: `${p}%`, transition: "width .12s linear" }} />
        </div>
        <div style={{ fontFamily: "var(--f-m)", fontSize: 11, color: "var(--w35)", marginTop: 10 }}>{Math.round(p)}%</div>
      </div>
    </div>
  );
}

function WriteDone({ active, soul, onNext }) {
  const [in_, setIn] = useState(false);
  useEffect(() => { if (active) setTimeout(() => setIn(true), 100); else setIn(false); }, [active]);
  return (
    <div className={`screen ${active ? "enter" : "exit-down"}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px", background: "linear-gradient(160deg,#0F0C20,#0A0E18)" }}>
      <div style={{ position: "absolute", width: 340, height: 340, top: "40%", left: "50%", transform: "translate(-50%,-50%)", borderRadius: "50%", background: `radial-gradient(circle,${soul.color}12,transparent 70%)`, opacity: in_ ? 1 : 0, transition: "opacity 1.2s", pointerEvents: "none" }} />
      <div style={{ display: "flex", alignItems: "flex-end", gap: -8, marginBottom: 24, opacity: in_ ? 1 : 0, transform: in_ ? "translateY(0)" : "translateY(30px)", transition: "all .8s cubic-bezier(.34,1.4,.64,1)" }}>
        <div style={{ opacity: 0.45, transform: "rotate(-10deg)" }}><Soul id="tri" size={0.55} color="#FF4530" anim="fb" /></div>
        <div style={{ animation: in_ ? "bloom .7s cubic-bezier(.34,1.4,.64,1) forwards" : "none" }}><Soul id={soul.id} size={1.3} color={soul.color} glow anim="fa" /></div>
        <div style={{ opacity: 0.45, transform: "rotate(10deg)" }}><Soul id="box" size={0.55} color="#9B30FF" anim="fc" /></div>
      </div>
      <div style={{ textAlign: "center", opacity: in_ ? 1 : 0, transform: in_ ? "translateY(0)" : "translateY(20px)", transition: "all .6s ease .4s", marginBottom: 36 }}>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 16 }}>
          <span className="badge badge-ok">✓ 로컬 저장</span><span className="badge badge-ok">✓ Notion 저장</span>
        </div>
        <div style={{ fontFamily: "var(--f-b)", fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: `${soul.color}99`, marginBottom: 12 }}>기억이 남겨졌어요</div>
        <h2 style={{ fontFamily: "var(--f-d)", fontSize: 34, color: "white", marginBottom: 12, lineHeight: 1.1 }}>오늘도<br /><span style={{ color: soul.color }}>잘 하셨어요.</span></h2>
        <p style={{ fontFamily: "var(--f-b)", fontSize: 14, fontWeight: 500, color: "var(--w60)", maxWidth: 260, margin: "0 auto", lineHeight: 1.8 }}>이 이야기는 당신이 원하는 사람에게 언제든 전해질 수 있어요.</p>
      </div>
      <div style={{ width: "100%", opacity: in_ ? 1 : 0, transform: in_ ? "translateY(0)" : "translateY(16px)", transition: "all .5s ease .7s", display: "flex", flexDirection: "column", gap: 12 }}>
        <button className="btn btn-white btn-full" style={{ fontFamily: "var(--f-d)", fontSize: 15 }} onClick={onNext}>다음 기억 꺼내기</button>
        <button style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--f-b)", fontSize: 13, fontWeight: 700, color: "var(--w35)" }} onClick={onNext}>홈으로</button>
      </div>
    </div>
  );
}
