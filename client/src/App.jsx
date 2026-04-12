import { useState, useEffect, useMemo } from "react";
import Onboarding from "./components/Onboarding";
import HomeTab from "./components/HomeTab";
import WriteFlow from "./components/WriteFlow";
import ChatTab from "./components/ChatTab";
import { ArchiveTab, PremiumTab } from "./components/OtherTabs";
import Soul from "./components/Soul";
import { HomeIcon, WriteIcon, ChatIcon, ArchiveIcon, StarIcon } from "./components/NavIcons";
import { SOULS, STARS, QUESTIONS } from "./utils/constants";
import { saveToNotion } from "./utils/api";
import Store from "./utils/storage";
import { formatDateKey, getNotifyTimeValue, isWithinNotifyWindow } from "./utils/time";

function NavItem({ icon, label, on, onClick }) {
  return (
    <div className={`nav-item ${on ? "on" : ""}`} onClick={onClick}>
      {icon}
      <span className="nav-label">{label}</span>
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState("loading"); // loading | onboarding | main
  const [tab, setTab] = useState("home");
  const [user, setUser] = useState({ name: "", purpose: null, soulId: null, notifyTime: null, notifyAtIso: null, notifyAtMs: null });
  const [memories, setMemories] = useState([]);
  const [writeStep, setWriteStep] = useState("card");
  const [qIdx, setQIdx] = useState(0);
  const [toast, setToast] = useState(null);
  const [notifyState, setNotifyState] = useState({ shouldPrompt: false, lastCheckAt: null, todayTarget: null, alreadyShown: false, mode: null, elapsedMs: null, customToken: null, checkSeq: 0 });

  // Load persisted data on mount
  useEffect(() => {
    (async () => {
      const saved = await Store.get("remain:user");
      if (saved?.name && saved?.soulId) {
        setUser(saved);
        const keys = await Store.keys("remain:mem:");
        const mems = await Promise.all(keys.map((k) => Store.get(k)));
        setMemories(mems.filter(Boolean).sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt)));
        setPhase("main");
      } else {
        setPhase("onboarding");
      }
    })();
  }, []);


  const debugNotify = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("debugNotify") === "1" || params.get("debugnotify") === "1";
  }, []);

  useEffect(() => {
    if (phase !== "main") return;

    let mounted = true;

    const checkNotify = async () => {
      if (!mounted) return;
      const now = new Date();
      const dateKey = formatDateKey(now);
      const notifyId = user?.notifyTime;
      const hhmm = getNotifyTimeValue(notifyId);

      let targetForDebug = hhmm;
      let shouldPrompt = false;
      let alreadyShown = false;
      let mode = "preset";
      let elapsedMs = null;
      let customToken = null;

      if (notifyId === "custom" && (user?.notifyAtMs || user?.notifyAtIso)) {
        mode = "custom";
        const targetMs = Number(user?.notifyAtMs || new Date(user.notifyAtIso).getTime());
        customToken = targetMs;
        const customKey = `remain:notify:custom:lastShown:${targetMs}`;
        alreadyShown = !!(await Store.get(customKey));
        elapsedMs = now.getTime() - targetMs;
        shouldPrompt = !alreadyShown && elapsedMs >= 0 && elapsedMs <= 15000; // fire only after target time, within 15s
        targetForDebug = new Date(targetMs).toISOString();
      } else {
        const storageKey = `remain:notify:lastShown:${dateKey}`;
        alreadyShown = !!(await Store.get(storageKey));
        shouldPrompt = !alreadyShown && !!hhmm && isWithinNotifyWindow(now, hhmm, 5);
      }

      if (!mounted) return;
      setNotifyState((prev) => ({
        shouldPrompt,
        lastCheckAt: now.toISOString(),
        todayTarget: targetForDebug,
        alreadyShown,
        mode,
        elapsedMs,
        customToken,
        checkSeq: (prev?.checkSeq || 0) + 1,
      }));
    };

    checkNotify();
    const timer = window.setInterval(checkNotify, 3000);

    const onVisible = () => {
      if (document.visibilityState === "visible") checkNotify();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      mounted = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [phase, user?.notifyTime, user?.notifyAtIso]);

  const handleSnoozeNotify = async () => {
    const nowIso = new Date().toISOString();
    if (user?.notifyTime === "custom" && (user?.notifyAtMs || user?.notifyAtIso)) {
      const customToken = Number(user?.notifyAtMs || new Date(user.notifyAtIso).getTime());
      await Store.set(`remain:notify:custom:lastShown:${customToken}`, { at: nowIso, action: "later" });
    } else {
      const dateKey = formatDateKey(new Date());
      await Store.set(`remain:notify:lastShown:${dateKey}`, { at: nowIso, action: "later" });
    }
    setNotifyState((s) => ({ ...s, shouldPrompt: false, alreadyShown: true }));
  };

  const handleWriteFromNotify = async () => {
    const nowIso = new Date().toISOString();
    if (user?.notifyTime === "custom" && (user?.notifyAtMs || user?.notifyAtIso)) {
      const customToken = Number(user?.notifyAtMs || new Date(user.notifyAtIso).getTime());
      await Store.set(`remain:notify:custom:lastShown:${customToken}`, { at: nowIso, action: "write" });
    } else {
      const dateKey = formatDateKey(new Date());
      await Store.set(`remain:notify:lastShown:${dateKey}`, { at: nowIso, action: "write" });
    }
    setNotifyState((s) => ({ ...s, shouldPrompt: false, alreadyShown: true }));
    setTab("write");
    setWriteStep("card");
  };

  const showToast = (msg, dur = 3200) => {
    setToast({ msg, hiding: false });
    setTimeout(() => setToast((t) => (t ? { ...t, hiding: true } : null)), dur - 400);
    setTimeout(() => setToast(null), dur);
  };

  const saveMemory = async (data) => {
    const key = "remain:mem:" + Date.now();
    const full = { ...data, id: key, savedAt: new Date().toISOString() };
    await Store.set(key, full);
    setMemories((p) => [full, ...p]);
    // Async Notion sync
    saveToNotion(full, user.name).then((r) => {
      showToast(r.ok ? "✓ Notion에 저장됐어요" : "💾 로컬에 저장됐어요");
    });
    return full;
  };

  const finishOnboarding = async (u) => {
    setUser(u);
    await Store.set("remain:user", u);
    setPhase("main");
  };

  const updateNotifyTime = async (notifyTime) => {
    const nextUser = { ...user, notifyTime, notifyAtIso: null, notifyAtMs: null };
    setUser(nextUser);
    await Store.set("remain:user", nextUser);
    showToast("질문 시간이 업데이트됐어요");
  };

  const setNotifyAfterSeconds = async (seconds = 10) => {
    const targetMs = Date.now() + seconds * 1000;
    const target = new Date(targetMs).toISOString();
    const nextUser = { ...user, notifyTime: "custom", notifyAtIso: target, notifyAtMs: targetMs };
    setUser(nextUser);
    setNotifyState((s) => ({ ...s, shouldPrompt: false, alreadyShown: false, todayTarget: target, lastCheckAt: new Date().toISOString(), mode: "custom", elapsedMs: null, customToken: targetMs }));
    await Store.set("remain:user", nextUser);
    showToast(`테스트 알림: ${seconds}초 후`);
  };

  const soul = SOULS.find((s) => s.id === user.soulId) || SOULS[0];
  const q = QUESTIONS[qIdx];
  const showNav = !(tab === "write" && writeStep !== "card");

  if (phase === "loading") {
    return (
      <div className="app-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <Soul id="orb" size={1.1} color="#1B4AEF" glow anim="fa" />
          <div style={{ width: 22, height: 22, border: "2px solid rgba(255,255,255,.2)", borderTopColor: "white", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Stars */}
      {STARS.map((s, i) => (
        <div key={i} className="star" style={{ left: s.x, top: s.y, width: s.r * 2, height: s.r * 2, "--lo": s.lo, "--hi": s.hi, "--d": `${s.d}s`, "--del": `${s.del}s` }} />
      ))}

      {/* Toast */}
      {toast && <div className={`toast ${toast.hiding ? "hide" : ""}`}>{toast.msg}</div>}

      {debugNotify && (
        <div style={{ position: "absolute", top: 10, left: 10, zIndex: 2400, background: "rgba(0,0,0,.72)", color: "#8CFF9E", border: "1px solid rgba(140,255,158,.35)", borderRadius: 8, padding: "8px 10px", fontFamily: "monospace", fontSize: 11, lineHeight: 1.35 }}>
{`debugNotify #${notifyState.checkSeq || 0}\nnotifyId:${user?.notifyTime || "-"}\nmode:${notifyState.mode || "-"}\ntarget:${notifyState.todayTarget || "-"}\ncustomToken:${notifyState.customToken ?? "-"}\nnow:${new Date().toLocaleTimeString("ko-KR")}\nlast:${notifyState.lastCheckAt ? new Date(notifyState.lastCheckAt).toLocaleTimeString("ko-KR") : "-"}\nelapsedMs:${notifyState.elapsedMs ?? "-"}\nshown:${String(notifyState.alreadyShown)}\nprompt:${String(notifyState.shouldPrompt)}`}
        </div>
      )}

      {phase === "onboarding" ? (
        <div className="app-main app-main--full">
          <Onboarding onDone={finishOnboarding} />
        </div>
      ) : (
        <>
          {/* Background */}
          <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(165deg,#100D22,#09071A 60%,#0D1018 100%)" }} />
          <div className="blob" style={{ width: 280, height: 280, top: -80, left: -80, background: `${soul.color}10`, opacity: 1, zIndex: 2, "--bd": "14s", "--tx": "20px", "--ty": "10px" }} />
          <div className="blob" style={{ width: 220, height: 220, bottom: 100, right: -60, background: "rgba(155,48,255,.06)", opacity: 1, zIndex: 2, "--bd": "11s", "--tx": "-15px", "--ty": "-20px" }} />

          {/* Screens */}
          <div className={`app-main ${showNav ? "" : "app-main--full"}`}>
            <HomeTab active={tab === "home"} user={user} soul={soul} memories={memories}
              notifyState={notifyState}
              onSnoozeNotify={handleSnoozeNotify}
              onNotifyWrite={handleWriteFromNotify}
              onWrite={() => { setTab("write"); setWriteStep("card"); }}
              onChat={() => setTab("chat")} />
            <WriteFlow active={tab === "write"} step={writeStep} setStep={setWriteStep}
              q={q} qIdx={qIdx} setQIdx={setQIdx} soul={soul} saveMemory={saveMemory}
              user={user}
              onUpdateNotifyTime={updateNotifyTime}
              onSetNotifyAfterSeconds={setNotifyAfterSeconds}
              onBack={() => { setWriteStep("card"); setTab("home"); }} />
            <ChatTab active={tab === "chat"} user={user} soul={soul} />
            <ArchiveTab active={tab === "archive"} soul={soul} memories={memories} />
            <PremiumTab active={tab === "premium"} soul={soul} />
          </div>

          {/* Bottom Nav */}
          {showNav && (
            <nav className="nav">
              <NavItem icon={<HomeIcon on={tab === "home"} />} label="홈" on={tab === "home"} onClick={() => setTab("home")} />
              <NavItem icon={<WriteIcon on={tab === "write"} />} label="기록" on={tab === "write"} onClick={() => { setTab("write"); setWriteStep("card"); }} />
              <NavItem icon={<ChatIcon on={tab === "chat"} />} label="채팅" on={tab === "chat"} onClick={() => setTab("chat")} />
              <NavItem icon={<ArchiveIcon on={tab === "archive"} />} label="아카이브" on={tab === "archive"} onClick={() => setTab("archive")} />
              <NavItem icon={<StarIcon on={tab === "premium"} />} label="프리미엄" on={tab === "premium"} onClick={() => setTab("premium")} />
            </nav>
          )}
        </>
      )}
    </div>
  );
}
