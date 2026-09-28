/**
 * Inline icon set.
 *
 * Hand-rolled rather than pulled from an icon package: the app needs about a
 * dozen glyphs, and inlining them avoids shipping a library and a font for it.
 * All are decorative — every call site supplies its own accessible label.
 */
type IconProps = { className?: string };

function Svg({ children, className = "h-[18px] w-[18px]" }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const IconHome = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.8V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.8" />
  </Svg>
);

export const IconCalendar = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Svg>
);

export const IconTicket = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" />
    <path d="M14 6v12" strokeDasharray="2 3" />
  </Svg>
);

export const IconUser = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </Svg>
);

export const IconUsers = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M2.8 20a6.2 6.2 0 0 1 12.4 0" />
    <path d="M16 5.3a3.2 3.2 0 0 1 0 5.4M17.5 14.4A6.2 6.2 0 0 1 21.2 20" />
  </Svg>
);

export const IconWallet = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3 10h18" />
    <circle cx="16.5" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconBox = (p: IconProps) => (
  <Svg {...p}>
    <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
    <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
  </Svg>
);

export const IconTrophy = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
    <path d="M7 6H4.5A2.5 2.5 0 0 0 7 8.5M17 6h2.5A2.5 2.5 0 0 1 17 8.5" />
    <path d="M12 14v3M9 21h6M10 17h4" />
  </Svg>
);

export const IconBook = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z" />
    <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H19v3H6.5A2.5 2.5 0 0 1 4 20.5Z" />
  </Svg>
);

export const IconNews = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 5h13v14a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2V5Z" />
    <path d="M17 9h3v10a2 2 0 0 1-2 2M7 9h7M7 13h7M7 17h4" />
  </Svg>
);

export const IconChart = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Svg>
);

export const IconShield = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3l7.5 3v6c0 4.4-3.1 8.3-7.5 9.4C7.6 20.3 4.5 16.4 4.5 12V6L12 3Z" />
    <path d="m9.2 12 2 2 3.6-3.8" />
  </Svg>
);

export const IconSettings = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9 5.3 5.3" />
  </Svg>
);

export const IconClipboard = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="5" width="14" height="16" rx="2" />
    <path d="M9 5V3.8A.8.8 0 0 1 9.8 3h4.4a.8.8 0 0 1 .8.8V5M9 11h6M9 15h4" />
  </Svg>
);

export const IconExternal = (p: IconProps) => (
  <Svg {...p}>
    <path d="M14 4h6v6M20 4l-9 9" />
    <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </Svg>
);

export const IconCheck = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Svg>
);

export const IconAlert = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.3h.01" />
  </Svg>
);

/** A checklist: two ticked boxes and one open one. Used for Forms. */
export const IconForm = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="4" width="4" height="4" />
    <path d="m4.4 6 1 1 1.7-1.8M11 6h9.5" />
    <rect x="3.5" y="10" width="4" height="4" />
    <path d="m4.4 12 1 1 1.7-1.8M11 12h9.5" />
    <rect x="3.5" y="16" width="4" height="4" />
    <path d="M11 18h9.5" />
  </Svg>
);
