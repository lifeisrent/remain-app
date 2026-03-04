import { SOULS } from "../utils/constants";

export default function Soul({ id, size = 1, color, glow = false, anim = "fa" }) {
  const s = size;
  const c = color || SOULS.find((x) => x.id === id)?.color || "#1B4AEF";

  if (id === "tri")
    return (
      <svg width={62 * s} height={78 * s} viewBox="0 0 62 78" className={anim}>
        {glow && <circle cx="31" cy="36" r="28" fill={c} opacity=".18" />}
        <polygon points="31,3 58,56 4,56" fill={c} />
        <circle cx="24" cy="34" r="4.5" fill="white" opacity=".92" />
        <circle cx="38" cy="34" r="4.5" fill="white" opacity=".92" />
        <circle cx="25" cy="35" r="2.2" fill="#2A0A06" />
        <circle cx="39" cy="35" r="2.2" fill="#2A0A06" />
        <path d="M25 44 Q31 49 37 44" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M31 56 Q28 68 31 76" stroke={c} strokeWidth="3.5" fill="none" strokeLinecap="round" opacity=".35" />
      </svg>
    );

  if (id === "box")
    return (
      <svg width={62 * s} height={78 * s} viewBox="0 0 62 78" className={anim}>
        {glow && <circle cx="31" cy="34" r="28" fill={c} opacity=".18" />}
        <rect x="7" y="6" width="48" height="48" rx="14" fill={c} />
        <circle cx="23" cy="28" r="4.5" fill="white" opacity=".92" />
        <circle cx="39" cy="28" r="4.5" fill="white" opacity=".92" />
        <circle cx="24" cy="29" r="2.2" fill="#1A003A" />
        <circle cx="40" cy="29" r="2.2" fill="#1A003A" />
        <path d="M24 39 Q31 44 38 39" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <circle cx="7" cy="30" r="5" fill={c} stroke="white" strokeWidth="1.8" />
        <circle cx="55" cy="30" r="5" fill={c} stroke="white" strokeWidth="1.8" />
        <path d="M31 54 Q28 66 31 74" stroke={c} strokeWidth="3.5" fill="none" strokeLinecap="round" opacity=".35" />
      </svg>
    );

  if (id === "dia")
    return (
      <svg width={62 * s} height={80 * s} viewBox="0 0 62 80" className={anim}>
        {glow && <circle cx="31" cy="34" r="28" fill={c} opacity=".18" />}
        <polygon points="31,2 60,31 31,60 2,31" fill={c} />
        <circle cx="24" cy="27" r="4.5" fill="white" opacity=".92" />
        <circle cx="38" cy="27" r="4.5" fill="white" opacity=".92" />
        <circle cx="25" cy="28" r="2.2" fill="#2A1A00" />
        <circle cx="39" cy="28" r="2.2" fill="#2A1A00" />
        <path d="M25 37 Q31 42 37 37" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M31 60 Q28 70 31 78" stroke={c} strokeWidth="3.5" fill="none" strokeLinecap="round" opacity=".35" />
      </svg>
    );

  // orb (default)
  return (
    <svg width={62 * s} height={78 * s} viewBox="0 0 62 78" className={anim}>
      {glow && <circle cx="31" cy="28" r="28" fill={c} opacity=".18" />}
      <ellipse cx="31" cy="50" rx="18" ry="22" fill={c} />
      <circle cx="31" cy="18" r="16" fill={c} />
      <circle cx="24" cy="15" r="4.5" fill="white" opacity=".92" />
      <circle cx="38" cy="15" r="4.5" fill="white" opacity=".92" />
      <circle cx="25" cy="16" r="2.2" fill="#0A1A4A" />
      <circle cx="39" cy="16" r="2.2" fill="#0A1A4A" />
      <path d="M25 23 Q31 27 37 23" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M15 44 Q8 37 12 26" stroke={c} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M47 44 Q54 37 50 26" stroke={c} strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx="31" cy="71" rx="11" ry="4" fill={c} opacity=".3" />
    </svg>
  );
}
