import { useState, useEffect, useRef } from "react";
import Soul from "./Soul";
import { SOULS, PURPOSES, TIMES } from "../utils/constants";

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [purpose, setPurpose] = useState(null);
  const [name, setName] = useState("");
  const [soulId, setSoulId] = useState(null);
  const [notify, setNotify] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (step === 2) setTimeout(() => inputRef.current?.focus(), 500);
  }, [step]);

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));
  const v = (t) => (step === t ? "enter" : step > t ? "exit-up" : "exit-down");

  const bgs = [
    "radial-gradient(ellipse at 30% 20%,#1A0B3A,#09071A 65%)",
    "radial-gradient(ellipse at 70% 30%,#1A0B2E,#09071A 65%)",
    "radial-gradient(ellipse at 40% 60%,#0B1A2E,#09071A 65%)",
    "radial-gradient(ellipse at 60% 40%,#1A0A1E,#09071A 65%)",
    "radial-gradient(ellipse at 30% 70%,#0A1A1A,#09071A 65%)",
    "radial-gradient(ellipse at 50% 50%,#1A150A,#09071A 65%)",
    "radial-gradient(ellipse at 50% 30%,#0A0A2A,#09071A 65%)",
  ];

  return (
    <div style={{ position: "absolute", inset: 0, transition: "background 1.2s", background: bgs[step] }}>
      <div className="blob" style={{ width: 260, height: 260, left: -80, top: -80, background: "#2A1060", opacity: 0.5, "--bd": "12s", "--tx": "30px", "--ty": "20px" }} />
      <div className="blob" style={{ width: 200, height: 200, right: -50, bottom: 120, background: "#102050", opacity: 0.4, "--bd": "9s", "--tx": "-20px", "--ty": "-30px" }} />

      {step > 0 && step < 6 && (
        <button onClick={back} style={{ position: "absolute", top: 44, left: 20, zIndex: 20, background: "var(--w08)", border: "1px solid var(--rim2)", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", color: "var(--w60)", fontSize: 18, display: "grid", placeItems: "center" }}>←</button>
      )}
      {step > 0 && step < 6 && (
        <div className="dots" style={{ position: "absolute", top: 52, left: "50%", transform: "translateX(-50%)", zIndex: 20 }}>
          {[0, 1, 2, 3, 4].map((i) => <div key={i} className={`dot ${i === step - 1 ? "on" : ""}`} />)}
        </div>
      )}

      {/* Step 0 — Splash */}
      <div className={`screen ${v(0)}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px" }}>
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} viewBox="0 0 390 844">
          <circle cx="195" cy="380" r="50" fill="none" stroke="white" strokeWidth=".5" className="ring1" opacity="0" />
          <circle cx="195" cy="380" r="50" fill="none" stroke="white" strokeWidth=".5" className="ring2" opacity="0" />
        </svg>
        <div style={{ position: "relative", width: 200, height: 230, marginBottom: 16 }}>
          <div style={{ position: "absolute", inset: -30, borderRadius: "50%", background: "radial-gradient(circle,rgba(27,74,239,.1),transparent 70%)" }} />
          <div style={{ position: "absolute", top: 10, right: 10, opacity: 0.45 }}><Soul id="tri" size={0.55} color="#FF4530" anim="fb" /></div>
          <div style={{ position: "absolute", bottom: 10, left: 5, opacity: 0.35 }}><Soul id="dia" size={0.48} color="#F5C400" anim="fc" /></div>
          <div style={{ position: "absolute", top: 50, left: 0, opacity: 0.3 }}><Soul id="box" size={0.42} color="#9B30FF" anim="fa" /></div>
          <div style={{ position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)" }}><Soul id="orb" size={1.1} color="#1B4AEF" glow anim="fa" /></div>
        </div>
        <div className="fu fu2" style={{ textAlign: "center", marginBottom: 10 }}>
          <div style={{ fontFamily: "var(--f-b)", fontSize: 11, fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "var(--w35)", marginBottom: 10 }}>당신의 이야기는</div>
          <div style={{ fontFamily: "var(--f-d)", fontSize: 58, color: "white", letterSpacing: "-1px", lineHeight: 1 }}>Remain</div>
          <div style={{ width: 36, height: 1, background: "var(--w15)", margin: "18px auto 0" }} />
        </div>
        <p className="fu fu3" style={{ fontFamily: "var(--f-b)", fontSize: 14, fontWeight: 500, color: "var(--w60)", textAlign: "center", lineHeight: 1.8, marginBottom: 44 }}>
          삶은 끝나도,<br />당신이 남긴 것들은<br />계속해서 누군가에게 전해집니다.
        </p>
        <button className="btn btn-white btn-full fu fu4" style={{ maxWidth: 280 }} onClick={next}>시작하기</button>
        <div className="fu fu5" style={{ fontFamily: "var(--f-b)", fontSize: 12, color: "var(--w35)", marginTop: 18 }}>조용히 시작해도 괜찮아요</div>
      </div>

      {/* Step 1 — Purpose */}
      <div className={`screen scr ${v(1)}`} style={{ padding: "0 22px", display: "flex", flexDirection: "column" }}>
        <div style={{ paddingTop: 96, flex: 1 }}>
          <div style={{ fontFamily: "var(--f-b)", fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--w35)", marginBottom: 12 }} className="fu">첫 번째 질문</div>
          <h2 style={{ fontFamily: "var(--f-d)", fontSize: 34, color: "white", marginBottom: 8, lineHeight: 1.1 }} className="fu fu1">어떤 마음으로<br />오셨나요?</h2>
          <p style={{ fontFamily: "var(--f-b)", fontSize: 13, color: "var(--w35)", marginBottom: 28 }} className="fu fu2">모든 이유는 소중합니다.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }} className="fu fu2">
            {PURPOSES.map((p) => (
              <div key={p.id} className={`choice ${purpose === p.id ? "sel" : ""}`} onClick={() => setPurpose(p.id)}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: purpose === p.id ? p.color + "33" : p.color + "18", display: "grid", placeItems: "center", flexShrink: 0, fontSize: 20 }}>{p.icon}</div>
                <div><div className="ch-t" style={{ color: purpose === p.id ? p.color : "white" }}>{p.title}</div><div className="ch-s">{p.sub}</div></div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "20px 0 calc(36px + env(safe-area-inset-bottom, 0px))" }}><button className="btn btn-white btn-full" disabled={!purpose} onClick={next}>계속하기</button></div>
      </div>

      {/* Step 2 — Name */}
      <div className={`screen scr ${v(2)}`} style={{ padding: "0 28px", display: "flex", flexDirection: "column" }}>
        <div style={{ paddingTop: 100, flex: 1 }}>
          <div style={{ fontFamily: "var(--f-b)", fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--w35)", marginBottom: 14 }} className="fu">당신의 이름</div>
          <h2 style={{ fontFamily: "var(--f-d)", fontSize: 34, color: "white", marginBottom: 12, lineHeight: 1.1 }} className="fu fu1">당신을 뭐라고<br />불러드릴까요?</h2>
          <p style={{ fontFamily: "var(--f-b)", fontSize: 14, fontWeight: 500, color: "var(--w60)", lineHeight: 1.8, marginBottom: 36 }} className="fu fu2">본명이 아니어도 됩니다.<br />불리고 싶은 이름이면 충분해요.</p>
          <div className="fu fu3">
            <input ref={inputRef} className="ob-input" placeholder="이름을 입력하세요" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && name.trim() && next()} maxLength={20} />
            {name && <p style={{ textAlign: "center", marginTop: 14, fontFamily: "var(--f-b)", fontSize: 14, color: "var(--w35)", fontStyle: "italic" }}>안녕하세요, {name}님.</p>}
          </div>
        </div>
        <div style={{ padding: "24px 0 calc(36px + env(safe-area-inset-bottom, 0px))" }}><button className="btn btn-white btn-full" disabled={!name.trim()} onClick={next}>{name ? `안녕하세요, ${name}님` : "이름을 입력해주세요"}</button></div>
      </div>

      {/* Step 3 — Soul */}
      <div className={`screen scr ${v(3)}`} style={{ padding: "0 20px" }}>
        <div style={{ paddingTop: 96, paddingBottom: 110 }}>
          <div style={{ fontFamily: "var(--f-b)", fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--w35)", marginBottom: 12 }} className="fu">당신의 영혼 동반자</div>
          <h2 style={{ fontFamily: "var(--f-d)", fontSize: 32, color: "white", marginBottom: 24 }} className="fu fu1">당신을 닮은<br />모습을 골라주세요</h2>
          <div className="soul-grid fu fu2">
            {SOULS.map((s, i) => (
              <div key={s.id} className={`soul-card ${soulId === s.id ? "sel" : ""}`}
                style={{ borderColor: soulId === s.id ? s.color : "var(--rim2)", background: soulId === s.id ? s.color + "22" : "var(--w08)" }}
                onClick={() => setSoulId(s.id)}>
                <Soul id={s.id} size={0.82} glow={soulId === s.id} anim={["fa", "fb", "fc", "fa"][i]} />
                <div style={{ fontFamily: "var(--f-d)", fontSize: 14, color: "white" }}>{s.name}</div>
                <div style={{ fontSize: 11, color: "var(--w35)", textAlign: "center", lineHeight: 1.4, whiteSpace: "pre-line" }}>{s.trait}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: "sticky", bottom: 0, background: "linear-gradient(to top,rgba(9,7,26,.95) 60%,transparent)", padding: "16px 0 28px" }}>
          <button className="btn btn-white btn-full" disabled={!soulId} onClick={next}>{soulId ? `${SOULS.find((s) => s.id === soulId)?.name}와 함께할게요` : "영혼을 선택해주세요"}</button>
        </div>
      </div>

      {/* Step 4 — First Q typewriter */}
      <FirstQuestion v={v(4)} active={step === 4} name={name} soulId={soulId} onNext={next} />

      {/* Step 5 — Notify */}
      <div className={`screen scr ${v(5)}`} style={{ padding: "0 24px", display: "flex", flexDirection: "column" }}>
        <div style={{ paddingTop: 96, flex: 1 }}>
          <div style={{ fontFamily: "var(--f-b)", fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--w35)", marginBottom: 12 }} className="fu">질문 받을 시간</div>
          <h2 style={{ fontFamily: "var(--f-d)", fontSize: 32, color: "white", marginBottom: 28 }} className="fu fu1">언제 질문을<br />받고 싶으세요?</h2>
          <div className="time-grid fu fu2">
            {TIMES.map((t) => (
              <div key={t.id} className={`time-chip ${notify === t.id ? "sel" : ""}`} onClick={() => setNotify(t.id)}>
                <span style={{ fontSize: 20 }}>{t.icon}</span><span className="tc-l">{t.label}</span><span className="tc-v">{t.val}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "28px 0 calc(36px + env(safe-area-inset-bottom, 0px))" }}><button className="btn btn-white btn-full" disabled={!notify} onClick={next}>설정 완료</button></div>
      </div>

      {/* Step 6 — Done */}
      <OnboardingDone v={v(6)} active={step === 6} name={name} soulId={soulId} purpose={purpose}
        onDone={() => onDone({ name, purpose, soulId, notifyTime: notify })} />
    </div>
  );
}

function FirstQuestion({ v, active, name, soulId, onNext }) {
  const [typed, setTyped] = useState("");
  const full = name ? `${name}님, 가장 처음\n기억하는 냄새는\n무엇인가요?` : `가장 처음\n기억하는 냄새는\n무엇인가요?`;
  const c = SOULS.find((s) => s.id === soulId)?.color || "#1B4AEF";
  useEffect(() => {
    if (!active) { setTyped(""); return; }
    let i = 0; setTyped("");
    const t = setInterval(() => { i++; setTyped(full.slice(0, i)); if (i >= full.length) clearInterval(t); }, 42);
    return () => clearInterval(t);
  }, [active]);
  return (
    <div className={`screen ${v}`} style={{ padding: "0 28px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ opacity: 0.2, position: "absolute", bottom: 120, right: 8, pointerEvents: "none" }}><Soul id={soulId || "orb"} size={1.2} glow anim="fa" /></div>
      <div style={{ width: "100%" }}>
        <div style={{ fontFamily: "var(--f-b)", fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--w35)", marginBottom: 16, textAlign: "center" }}>오늘의 첫 번째 질문</div>
        <div className="card-dark" style={{ padding: "32px 28px", marginBottom: 28, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: c + "20", filter: "blur(20px)" }} />
          <div style={{ position: "absolute", top: 14, left: 16, width: 8, height: 8, borderRadius: "50%", background: c, animation: "pulse 2s infinite" }} />
          <p style={{ fontFamily: "var(--f-d)", fontSize: 26, color: "white", whiteSpace: "pre-line", minHeight: 110, lineHeight: 1.4 }}>{typed}<span style={{ opacity: typed.length < full.length ? 1 : 0 }}>|</span></p>
        </div>
        <p style={{ fontFamily: "var(--f-b)", fontSize: 13, fontWeight: 500, color: "var(--w35)", textAlign: "center", marginBottom: 32, lineHeight: 1.8 }}>매일 이런 질문들이 찾아올 거예요.</p>
        <button className="btn btn-white btn-full fu fu3" onClick={onNext}>준비됐어요</button>
      </div>
    </div>
  );
}

function OnboardingDone({ v, active, name, soulId, purpose, onDone }) {
  const [in_, setIn] = useState(false);
  useEffect(() => { if (active) setTimeout(() => setIn(true), 150); else setIn(false); }, [active]);
  const soul = SOULS.find((s) => s.id === soulId) || SOULS[0];
  const pm = { me: "당신의 이야기를 기다릴게요.", someone: "함께 이 시간을 기록해요.", lost: "그분의 기억을 소중히 간직할게요.", together: "함께 남기는 이야기가 시작됩니다." };
  return (
    <div className={`screen ${v}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 32px" }}>
      <div style={{ position: "absolute", width: 380, height: 380, top: "45%", left: "50%", transform: "translate(-50%,-50%)", borderRadius: "50%", background: `radial-gradient(circle,${soul.color}18,transparent 70%)`, opacity: in_ ? 1 : 0, transition: "opacity 1.2s", pointerEvents: "none" }} />
      <div style={{ transform: in_ ? "scale(1) translateY(0)" : "scale(.6) translateY(40px)", transition: "transform .8s cubic-bezier(.34,1.56,.64,1)", opacity: in_ ? 1 : 0, marginBottom: 24 }}>
        <Soul id={soul.id} size={1.7} color={soul.color} glow anim="fa" />
      </div>
      {SOULS.filter((s) => s.id !== soul.id).map((s, i) => (
        <div key={s.id} style={{ position: "absolute", opacity: 0.1, pointerEvents: "none", left: i === 0 ? 18 : undefined, right: i === 1 ? 18 : undefined, top: i === 0 ? 110 : i === 1 ? 170 : undefined, bottom: i === 2 ? 110 : undefined }}>
          <Soul id={s.id} size={0.5} color={s.color} anim={["fb", "fc", "fa"][i]} />
        </div>
      ))}
      <div style={{ textAlign: "center", opacity: in_ ? 1 : 0, transform: in_ ? "translateY(0)" : "translateY(20px)", transition: "all .6s ease .4s", marginBottom: 32 }}>
        <div style={{ fontFamily: "var(--f-b)", fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--w35)", marginBottom: 12 }}>Remain과 함께</div>
        <h2 style={{ fontFamily: "var(--f-d)", fontSize: 38, color: "white", marginBottom: 14, lineHeight: 1.1 }}>{name ? `${name}님,` : "환영합니다,"}<br /><span style={{ color: soul.color }}>여기에 있어요.</span></h2>
        <p style={{ fontFamily: "var(--f-b)", fontSize: 14, fontWeight: 500, color: "var(--w60)", maxWidth: 260, margin: "0 auto", lineHeight: 1.8 }}>{pm[purpose] || "당신의 이야기를 기다릴게요."}</p>
      </div>
      <div style={{ width: "100%", opacity: in_ ? 1 : 0, transform: in_ ? "translateY(0)" : "translateY(16px)", transition: "all .5s ease .7s", display: "flex", flexDirection: "column", gap: 12 }}>
        <button className="btn btn-white btn-full" style={{ fontFamily: "var(--f-d)", fontSize: 15 }} onClick={onDone}>첫 번째 이야기 남기기</button>
        <button style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--f-b)", fontSize: 13, fontWeight: 700, color: "var(--w35)" }} onClick={onDone}>홈으로 이동</button>
      </div>
    </div>
  );
}
