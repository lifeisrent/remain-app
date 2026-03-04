export function HomeIcon({ on }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="9" fill={on ? "var(--cobalt-lt)" : "none"} stroke={on ? "var(--cobalt-lt)" : "var(--w35)"} strokeWidth="1.5" />
      <circle cx="11" cy="9.5" r="3" fill={on ? "white" : "var(--w35)"} />
      <path d="M6 17 Q11 13 16 17" stroke={on ? "white" : "var(--w35)"} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
export function WriteIcon({ on }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3" y="5" width="16" height="13" rx="3" fill={on ? "var(--cobalt-lt)" : "none"} stroke={on ? "var(--cobalt-lt)" : "var(--w35)"} strokeWidth="1.5" />
      <path d="M7 9.5h8M7 12.5h5" stroke={on ? "white" : "var(--w35)"} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
export function ChatIcon({ on }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M4 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8l-4 3V5z" fill={on ? "var(--cobalt-lt)" : "none"} stroke={on ? "var(--cobalt-lt)" : "var(--w35)"} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="8.5" cy="9" r="1" fill={on ? "white" : "var(--w35)"} />
      <circle cx="11.5" cy="9" r="1" fill={on ? "white" : "var(--w35)"} />
      <circle cx="14.5" cy="9" r="1" fill={on ? "white" : "var(--w35)"} />
    </svg>
  );
}
export function ArchiveIcon({ on }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <rect x="3" y="3" width="16" height="4" rx="1.5" fill={on ? "var(--cobalt-lt)" : "none"} stroke={on ? "var(--cobalt-lt)" : "var(--w35)"} strokeWidth="1.5" />
      <rect x="3" y="9.5" width="16" height="10" rx="2" fill={on ? "var(--cobalt-lt)" : "none"} stroke={on ? "var(--cobalt-lt)" : "var(--w35)"} strokeWidth="1.5" opacity=".7" />
      <path d="M8 15h6M8 12.5h3" stroke={on ? "white" : "var(--w35)"} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
export function StarIcon({ on }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 2l2.2 6.5H20l-5.6 4.1 2.2 6.5L11 15.1 5.4 19.1l2.2-6.5L2 8.5h6.8z" fill={on ? "var(--gold)" : "none"} stroke={on ? "var(--gold)" : "var(--w35)"} strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}
