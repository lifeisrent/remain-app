import { useState, useEffect, useRef } from "react";
import Soul from "./Soul";
import { askClaude, transcribeAudio } from "../utils/api";
import Store from "../utils/storage";

const MODES = ["자유 대화", "감정 탐색", "편지 쓰기", "정리 중"];
const SHOW_QUICK_REPLIES = false;

export default function ChatTab({ active, user, soul }) {
  const [msgs, setMsgs] = useState([]);
  const [hist, setHist] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState(0);
  const [ready, setReady] = useState(false);

  const [rec, setRec] = useState(false);
  const [audioState, setAudioState] = useState("idle"); // idle | recording | transcribing | error
  const [audioErr, setAudioErr] = useState("");
  const [audioSec, setAudioSec] = useState(0);
  const [waveLevels, setWaveLevels] = useState(Array(30).fill(8));

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const discardRef = useRef(false);
  const autoSendRef = useRef(false);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const freqDataRef = useRef(null);
  const rafRef = useRef(null);
  const maxSec = 220;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  useEffect(() => {
    if (!active || ready) return;
    (async () => {
      const saved = await Store.get("remain:chat");
      if (saved?.msgs?.length) {
        setMsgs(saved.msgs);
        setHist(saved.hist || []);
        setReady(true);
      } else {
        await init();
        setReady(true);
      }
    })();
  }, [active]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  const init = async () => {
    const sys = { id: Date.now(), role: "system", text: "아카이비스트와의 자유 대화가 시작됐어요", ts: "오늘" };
    setMsgs([sys]);
    setLoading(true);

    const q = user.name
      ? `안녕하세요. 저는 ${user.name}이에요. 지금부터 자유롭게 대화하고 싶어요.`
      : "새 사용자가 접속했습니다. 따뜻하게 맞이해주세요.";

    const h = [{ role: "user", content: q }];
    const r = await askClaude(h, 0);
    const ai = {
      id: Date.now() + 1,
      role: "ai",
      text: r.text,
      qr: r.qr || [],
      ts: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    };

    const nm = [sys, ai];
    const nh = [...h, { role: "assistant", content: JSON.stringify(r) }];
    setMsgs(nm);
    setHist(nh);
    setLoading(false);
    await Store.set("remain:chat", { msgs: nm, hist: nh });
  };

  const send = async (t) => {
    const txt = t || input.trim();
    if (!txt || loading) return;

    setInput("");
    const ts = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    const um = { id: Date.now(), role: "user", text: txt, ts };
    const nm = [...msgs, um];

    setMsgs(nm);
    setLoading(true);

    const nh = [...hist, { role: "user", content: txt }];
    const r = await askClaude(nh, mode);
    const ai = {
      id: Date.now() + 1,
      role: "ai",
      text: r.text,
      qr: r.qr || [],
      ts: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    };

    const fm = [...nm, ai];
    const fh = [...nh, { role: "assistant", content: JSON.stringify(r) }];
    setMsgs(fm);
    setHist(fh);
    setLoading(false);
    await Store.set("remain:chat", { msgs: fm, hist: fh });
  };

  const clear = async () => {
    await Store.del("remain:chat");
    setMsgs([]);
    setHist([]);
    setReady(false);
  };

  const startVoiceRecord = async () => {
    try {
      setAudioErr("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          audioCtxRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.8;
          source.connect(analyser);
          analyserRef.current = analyser;
          freqDataRef.current = new Uint8Array(analyser.frequencyBinCount);

          const tick = () => {
            const a = analyserRef.current;
            const data = freqDataRef.current;
            if (!a || !data) return;
            a.getByteTimeDomainData(data);

            let peak = 0;
            for (let i = 0; i < data.length; i++) {
              const v = Math.abs(data[i] - 128);
              if (v > peak) peak = v;
            }
            const ampNorm = Math.min(1, peak / 50);
            setWaveLevels((prev) => prev.map((_, i) => {
              const shape = 1 - Math.abs((i - 14.5) / 14.5) * 0.4;
              const h = 8 + Math.round(ampNorm * 26 * shape);
              return h;
            }));
            rafRef.current = requestAnimationFrame(tick);
          };
          rafRef.current = requestAnimationFrame(tick);
        }
      } catch {}

      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];
      setAudioSec(0);
      setWaveLevels(Array(30).fill(8));
      setAudioState("recording");
      setRec(true);

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        setRec(false);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        if (audioCtxRef.current) {
          audioCtxRef.current.close().catch(() => {});
          audioCtxRef.current = null;
        }

        const shouldDiscard = discardRef.current;
        const shouldAutoSend = autoSendRef.current;
        discardRef.current = false;
        autoSendRef.current = false;

        if (shouldDiscard) {
          setAudioState("idle");
          setWaveLevels(Array(30).fill(8));
          return;
        }

        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (blob.size > 0) runTranscribe(blob, { autoSend: shouldAutoSend });
        else {
          setAudioState("idle");
          setWaveLevels(Array(30).fill(8));
        }
      };

      mr.start();
      timerRef.current = setInterval(() => {
        setAudioSec((s) => {
          const next = s + 1;
          if (next >= maxSec) {
            try { mr.stop(); } catch {}
            return maxSec;
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      setAudioErr("마이크 권한을 확인해 주세요.");
      setAudioState("error");
      setRec(false);
    }
  };

  const stopVoiceRecord = ({ discard = false, autoSend = false } = {}) => {
    try {
      discardRef.current = discard;
      autoSendRef.current = autoSend;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    } catch {}
  };

  const cancelVoiceRecord = () => stopVoiceRecord({ discard: true });

  const runTranscribe = async (blob, { autoSend = false } = {}) => {
    try {
      setAudioErr("");
      setAudioState("transcribing");
      const r = await transcribeAudio(blob, { language: "ko", fileName: `chat-${Date.now()}.webm` });
      const t = (r?.text || "").trim();
      setWaveLevels(Array(30).fill(8));
      if (t) {
        if (autoSend) {
          await send(t);
        } else {
          setInput(t);
          requestAnimationFrame(() => inputRef.current?.focus());
        }
      }
      setAudioState("idle");
    } catch (err) {
      setAudioErr(err?.message || "음성 변환에 실패했어요.");
      setAudioState("error");
      setWaveLevels(Array(30).fill(8));
    }
  };

  const toggleVoice = () => {
    if (loading || audioState === "transcribing") return;
    if (audioState === "recording") stopVoiceRecord();
    else startVoiceRecord();
  };

  return (
    <div className={`screen ${active ? "enter" : "exit-down"}`} style={{ bottom: 0, background: "linear-gradient(165deg,#0E0B1E,#09071A)" }}>
      {/* Header */}
      <div style={{ padding: "46px 18px 12px", borderBottom: "1px solid var(--rim)", display: "flex", alignItems: "center", gap: 12, background: "rgba(9,7,26,.92)", backdropFilter: "blur(20px)" }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: "var(--cobalt)", display: "grid", placeItems: "center", flexShrink: 0 }}><Soul id="orb" size={0.6} color="white" /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--f-d)", fontSize: 17, color: "white" }}>아카이비스트</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: loading ? "var(--gold)" : "var(--mint)", animation: "pulse 2s infinite" }} />
            <span style={{ fontFamily: "var(--f-b)", fontSize: 11, fontWeight: 700, color: loading ? "var(--gold)" : "var(--mint)" }}>
              {loading ? "응답 생성 중…" : "Claude AI 연결됨"}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span className="badge badge-ok" style={{ fontSize: 9 }}>Notion ✓</span>
          <button onClick={clear} style={{ background: "var(--w08)", border: "1px solid var(--rim2)", borderRadius: "50%", width: 30, height: 30, cursor: "pointer", color: "var(--w35)", fontSize: 14, display: "grid", placeItems: "center" }} title="초기화">↺</button>
        </div>
      </div>

      {/* Messages */}
      <div className="scr" style={{ position: "absolute", top: 110, bottom: 112, left: 0, right: 0, padding: "14px 14px 8px", display: "flex", flexDirection: "column" }}>
        {msgs.map((m, i) => <ChatMsg key={m.id} msg={m} prevRole={msgs[i - 1]?.role} isLast={i === msgs.length - 1} onQR={send} />)}
        {loading && (
          <div className="msg-ai" style={{ marginBottom: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: "var(--cobalt)", display: "grid", placeItems: "center", flexShrink: 0, marginBottom: 2 }}><Soul id="orb" size={0.42} color="white" /></div>
            <div className="typing-bbl"><div className="tdot" /><div className="tdot" /><div className="tdot" /></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(0deg,rgba(9,7,26,1),rgba(9,7,26,.9))", backdropFilter: "blur(20px)", borderTop: "1px solid var(--rim)", padding: "10px 14px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", gap: 5 }}>
          {MODES.map((m, i) => <button key={m} className={`mode-chip ${mode === i ? "on" : "off"}`} onClick={() => setMode(i)}>{m}</button>)}
        </div>

        {audioState === "recording" ? (
          <div style={{
            background: "rgba(255,255,255,.04)",
            border: "1.5px solid var(--rim2)",
            borderRadius: 22,
            padding: "12px 12px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            minHeight: 56,
          }}>
            <button
              onClick={cancelVoiceRecord}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "none",
                background: "var(--w08)",
                color: "var(--w80)",
                fontSize: 20,
                cursor: "pointer",
                flexShrink: 0,
              }}
              title="녹음 취소"
            >
              ×
            </button>

            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 4, overflow: "hidden", height: 24 }}>
              {waveLevels.map((h, i) => (
                <span
                  key={`wv-${i}`}
                  style={{
                    width: 4,
                    borderRadius: 999,
                    background: "rgba(255,255,255,.7)",
                    height: `${h}px`,
                    display: "inline-block",
                    transition: "height 80ms linear",
                  }}
                />
              ))}
            </div>

            <button
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: "white",
                border: "none",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
              onClick={() => stopVoiceRecord({ autoSend: true })}
              title="녹음 종료"
            >
              <span style={{ color: "var(--night)", fontSize: 20, fontWeight: 900 }}>↑</span>
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, width: "100%" }}>
            <div style={{ flex: 1, minWidth: 0, background: "var(--surface)", border: "1.5px solid var(--rim2)", borderRadius: 22, display: "flex", alignItems: "flex-end", gap: 7, padding: "9px 11px" }}>
              <textarea
                ref={inputRef}
                rows={1}
                placeholder="지금 떠오르는 이야기를 자유롭게 적어보세요."
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                style={{ flex: 1, minWidth: 0, width: "100%", background: "transparent", border: "none", outline: "none", resize: "none", fontFamily: "var(--f-b)", fontSize: 14, fontWeight: 500, color: "var(--w95)", lineHeight: 1.5, maxHeight: 96, scrollbarWidth: "none" }}
              />
            </div>

            <button
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "var(--w08)",
                border: "none",
                cursor: loading || audioState === "transcribing" ? "default" : "pointer",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                transition: "all .2s",
              }}
              onClick={toggleVoice}
              disabled={loading || audioState === "transcribing"}
              title="음성 입력"
            >
              <span style={{ color: "white", fontSize: 14 }}>🎙</span>
            </button>

            <button
              style={{ width: 38, height: 38, borderRadius: "50%", background: input.trim() && !loading ? "white" : "var(--w08)", border: "none", cursor: input.trim() && !loading ? "pointer" : "default", display: "grid", placeItems: "center", flexShrink: 0, transition: "all .2s" }}
              onClick={() => send()}
              disabled={!input.trim() || loading}
            >
              <span style={{ color: input.trim() && !loading ? "var(--night)" : "white", fontSize: 17, fontWeight: 900 }}>↑</span>
            </button>
          </div>
        )}

        {(audioState === "transcribing" || audioState === "error") && (
          <div style={{ marginTop: 4, fontFamily: "var(--f-b)", fontSize: 11, color: audioState === "error" ? "#ff8f8f" : "var(--w60)" }}>
            {audioState === "transcribing" && "음성 변환 중…"}
            {audioState === "error" && (audioErr || "음성 변환 실패")}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatMsg({ msg, prevRole, isLast, onQR }) {
  const showAv = msg.role === "ai" && prevRole !== "ai";
  if (msg.role === "system") return (
    <div>
      <div className="divider"><div className="dv-l" /><span className="dv-t">{msg.ts}</span><div className="dv-l" /></div>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
        <div style={{ background: "rgba(245,196,0,.1)", border: "1px solid rgba(245,196,0,.2)", borderRadius: 12, padding: "8px 14px", fontFamily: "var(--f-b)", fontSize: 12, fontWeight: 700, color: "var(--gold)" }}>{msg.text}</div>
      </div>
    </div>
  );
  if (msg.role === "user") return (
    <div style={{ marginBottom: 8 }}>
      <div className="msg-user"><div className="bbl-user"><div className="bbl-t" style={{ color: "white" }}>{msg.text}</div></div></div>
      {msg.ts && <div style={{ fontFamily: "var(--f-m)", fontSize: 10, color: "var(--w35)", textAlign: "right", paddingRight: 4, marginTop: 3 }}>{msg.ts}</div>}
    </div>
  );
  return (
    <div style={{ marginBottom: msg.qr?.length ? 4 : 8 }}>
      <div className="msg-ai">
        <div style={{ width: 30, height: 30, borderRadius: 9, background: showAv ? "var(--cobalt)" : "transparent", display: "grid", placeItems: "center", flexShrink: 0, marginBottom: 2, alignSelf: "flex-end" }}>
          {showAv && <Soul id="orb" size={0.42} color="white" />}
        </div>
        <div className="bbl-ai"><div className="bbl-t" style={{ color: "var(--w95)" }}>{msg.text}</div></div>
      </div>
      {msg.ts && <div style={{ fontFamily: "var(--f-m)", fontSize: 10, color: "var(--w35)", paddingLeft: 40, marginTop: 3 }}>{msg.ts}</div>}
      {SHOW_QUICK_REPLIES && msg.qr?.length > 0 && isLast && <div className="qr-row">{msg.qr.map((q) => <div key={q} className="qr-chip" onClick={() => onQR(q)}>{q}</div>)}</div>}
    </div>
  );
}
