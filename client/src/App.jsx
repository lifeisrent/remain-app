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
  const [user, setUser] = useState({ name: "", purpose: null, soulId: null, notifyTime: null });
  const [memories, setMemories] = useState([]);
  const [writeStep, setWriteStep] = useState("card");
  const [qIdx, setQIdx] = useState(0);
  const [toast, setToast] = useState(null);
  const [vpStats, setVpStats] = useState(null);
  const [freezeDebug, setFreezeDebug] = useState(false);

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

  const debugViewport = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("debugViewport") === "1" || params.get("debugLayout") === "1";
  }, []);

  // Debug metrics only (layout no longer depends on JS viewport vars)
  useEffect(() => {
    if (!debugViewport) return;

    document.documentElement.setAttribute("data-debug-layout", "1");

    const collectStats = (reason = "tick") => {
      if (freezeDebug) return;
      const vv = window.visualViewport;
      const appShell = document.querySelector(".app-shell");
      const appMain = document.querySelector(".app-main");
      const nav = document.querySelector(".nav");
      const activeScreen = document.querySelector(".screen.enter");

      const appRect = appShell?.getBoundingClientRect();
      const mainRect = appMain?.getBoundingClientRect();
      const navRect = nav?.getBoundingClientRect();
      const screenRect = activeScreen?.getBoundingClientRect();

      const navStyle = nav ? window.getComputedStyle(nav) : null;
      const mainStyle = appMain ? window.getComputedStyle(appMain) : null;

      setVpStats({
        reason,
        t: new Date().toLocaleTimeString("ko-KR", { hour12: false }),
        innerW: Math.round(window.innerWidth),
        innerH: Math.round(window.innerHeight),
        docH: Math.round(document.documentElement.clientHeight),
        bodyH: Math.round(document.body.clientHeight),
        vvH: Math.round(vv?.height || window.innerHeight),
        vvTop: Math.round(vv?.offsetTop || 0),
        appTop: appRect ? Math.round(appRect.top) : null,
        appBottom: appRect ? Math.round(appRect.bottom) : null,
        appH: appRect ? Math.round(appRect.height) : null,
        mainTop: mainRect ? Math.round(mainRect.top) : null,
        mainBottom: mainRect ? Math.round(mainRect.bottom) : null,
        mainPadT: mainStyle?.paddingTop || null,
        mainPadB: mainStyle?.paddingBottom || null,
        navTop: navRect ? Math.round(navRect.top) : null,
        navBottom: navRect ? Math.round(navRect.bottom) : null,
        navH: navRect ? Math.round(navRect.height) : null,
        navPos: navStyle?.position || null,
        navBottomCss: navStyle?.bottom || null,
        navTf: navStyle?.transform || null,
        scTop: screenRect ? Math.round(screenRect.top) : null,
        scBottom: screenRect ? Math.round(screenRect.bottom) : null,
        scH: screenRect ? Math.round(screenRect.height) : null,
        scScrollTop: activeScreen?.scrollTop ?? null,
        scClientH: activeScreen?.clientHeight ?? null,
        scScrollH: activeScreen?.scrollHeight ?? null,
      });
    };

    const onResize = () => collectStats("resize");
    const onRotate = () => collectStats("orientation");
    const onVVResize = () => collectStats("vv-resize");
    const onVVScroll = () => collectStats("vv-scroll");
    const onScroll = () => collectStats("screen-scroll");

    collectStats("init");
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onRotate);
    window.visualViewport?.addEventListener("resize", onVVResize);
    window.visualViewport?.addEventListener("scroll", onVVScroll);
    window.addEventListener("scroll", onScroll, { passive: true });

    const timer = window.setInterval(() => collectStats("interval"), 800);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onRotate);
      window.visualViewport?.removeEventListener("resize", onVVResize);
      window.visualViewport?.removeEventListener("scroll", onVVScroll);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeAttribute("data-debug-layout");
    };
  }, [debugViewport, freezeDebug]);


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

      {/* Debug overlay: enable with ?debugViewport=1 */}
      {debugViewport && vpStats && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 2000,
          background: "rgba(0,0,0,0.82)",
          color: "#8CFF9E",
          border: "1px solid rgba(140,255,158,0.4)",
          borderRadius: 8,
          padding: "10px 12px",
          fontSize: 12,
          lineHeight: 1.45,
          fontFamily: "monospace",
          whiteSpace: "pre-wrap",
          width: "min(82vw, 320px)",
          pointerEvents: "auto",
        }} onClick={() => setFreezeDebug((v) => !v)}>
{`[tap: ${freezeDebug ? "resume" : "freeze"}] ${vpStats.t} ${vpStats.reason}
vw:${vpStats.innerW} vh:${vpStats.innerH} doc:${vpStats.docH} body:${vpStats.bodyH}
vvH:${vpStats.vvH} vvTop:${vpStats.vvTop}
app:${vpStats.appTop}~${vpStats.appBottom} h:${vpStats.appH}
main:${vpStats.mainTop}~${vpStats.mainBottom} pt:${vpStats.mainPadT} pb:${vpStats.mainPadB}
nav:${vpStats.navTop}~${vpStats.navBottom} h:${vpStats.navH}
navCss:${vpStats.navPos} bottom:${vpStats.navBottomCss} tf:${vpStats.navTf}
scr:${vpStats.scTop}~${vpStats.scBottom} h:${vpStats.scH}
scroll:${vpStats.scScrollTop}/${vpStats.scClientH}/${vpStats.scScrollH}`}
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
              onWrite={() => { setTab("write"); setWriteStep("card"); }} onChat={() => setTab("chat")} />
            <WriteFlow active={tab === "write"} step={writeStep} setStep={setWriteStep}
              q={q} qIdx={qIdx} setQIdx={setQIdx} soul={soul} saveMemory={saveMemory}
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
