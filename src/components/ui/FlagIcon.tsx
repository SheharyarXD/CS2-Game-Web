/**
 * Inline SVG flags for the language selector.
 *
 * Regional-indicator emoji are not usable here: Windows ships no flag
 * glyphs at all and renders them as bare letter pairs ("GB", "ES"), so the
 * flags are drawn as simplified vectors instead. They are deliberately
 * schematic — recognisable at 20px rather than heraldically exact.
 */
export function FlagIcon({ code, className = "h-[14px] w-[20px]" }: { code: string; className?: string }) {
  const common = {
    viewBox: "0 0 30 20",
    className: `${className} shrink-0 border border-black/40`,
    "aria-hidden": true as const,
  };

  switch (code) {
    case "en":
      return (
        <svg {...common}>
          <rect width="30" height="20" fill="#012169" />
          <path d="M0 0 30 20M30 0 0 20" stroke="#fff" strokeWidth="4" />
          <path d="M0 0 30 20M30 0 0 20" stroke="#C8102E" strokeWidth="2" />
          <path d="M15 0v20M0 10h30" stroke="#fff" strokeWidth="6" />
          <path d="M15 0v20M0 10h30" stroke="#C8102E" strokeWidth="3.5" />
        </svg>
      );
    case "es":
      return (
        <svg {...common}>
          <rect width="30" height="20" fill="#AA151B" />
          <rect y="5" width="30" height="10" fill="#F1BF00" />
        </svg>
      );
    case "pt-BR":
      return (
        <svg {...common}>
          <rect width="30" height="20" fill="#009B3A" />
          <path d="M15 3 27 10 15 17 3 10Z" fill="#FEDF00" />
          <circle cx="15" cy="10" r="4.2" fill="#002776" />
          <path d="M10.9 8.9a10 10 0 0 1 8.2 2" stroke="#fff" strokeWidth="1.1" fill="none" />
        </svg>
      );
    case "fr":
      return (
        <svg {...common}>
          <rect width="30" height="20" fill="#fff" />
          <rect width="10" height="20" fill="#002395" />
          <rect x="20" width="10" height="20" fill="#ED2939" />
        </svg>
      );
    case "de":
      return (
        <svg {...common}>
          <rect width="30" height="20" fill="#000" />
          <rect y="6.67" width="30" height="6.67" fill="#DD0000" />
          <rect y="13.33" width="30" height="6.67" fill="#FFCE00" />
        </svg>
      );
    case "it":
      return (
        <svg {...common}>
          <rect width="30" height="20" fill="#fff" />
          <rect width="10" height="20" fill="#009246" />
          <rect x="20" width="10" height="20" fill="#CE2B37" />
        </svg>
      );
    case "pl":
      return (
        <svg {...common}>
          <rect width="30" height="20" fill="#fff" />
          <rect y="10" width="30" height="10" fill="#DC143C" />
        </svg>
      );
    case "ru":
      return (
        <svg {...common}>
          <rect width="30" height="20" fill="#fff" />
          <rect y="6.67" width="30" height="6.67" fill="#0039A6" />
          <rect y="13.33" width="30" height="6.67" fill="#D52B1E" />
        </svg>
      );
    case "tr":
      return (
        <svg {...common}>
          <rect width="30" height="20" fill="#E30A17" />
          <circle cx="12" cy="10" r="5" fill="#fff" />
          <circle cx="13.6" cy="10" r="4" fill="#E30A17" />
          <path d="m19 10 1.4.9-.5-1.6 1.3-1h-1.6L19 6.7l-.6 1.6h-1.6l1.3 1-.5 1.6Z" fill="#fff" />
        </svg>
      );
    case "zh-CN":
      return (
        <svg {...common}>
          <rect width="30" height="20" fill="#DE2910" />
          <path d="m6 3 1.2 3.6H11L7.9 8.8 9 12.4 6 10.2 3 12.4l1.1-3.6L1 6.6h3.8Z" fill="#FFDE00" />
          <circle cx="13" cy="3.5" r="1" fill="#FFDE00" />
          <circle cx="16" cy="6" r="1" fill="#FFDE00" />
          <circle cx="16" cy="9.5" r="1" fill="#FFDE00" />
          <circle cx="13" cy="12" r="1" fill="#FFDE00" />
        </svg>
      );
    case "ja":
      return (
        <svg {...common}>
          <rect width="30" height="20" fill="#fff" />
          <circle cx="15" cy="10" r="5.5" fill="#BC002D" />
        </svg>
      );
    case "ko":
      return (
        <svg {...common}>
          <rect width="30" height="20" fill="#fff" />
          <path d="M15 5.5a4.5 4.5 0 0 1 0 9 4.5 4.5 0 0 1 0-9Z" fill="#CD2E3A" />
          <path d="M15 5.5a4.5 4.5 0 0 0 0 9 2.25 2.25 0 0 0 0-4.5 2.25 2.25 0 0 1 0-4.5Z" fill="#0047A0" />
          <g stroke="#000" strokeWidth="0.9">
            <path d="M4.5 5.5 7 3.4M4.8 6.4 7.3 4.3M5.1 7.3 7.6 5.2" />
            <path d="M22.4 14.8 24.9 16.7M22.7 13.9 25.2 15.8M23 13 25.5 14.9" />
          </g>
        </svg>
      );
    default:
      return <span className={`${className} shrink-0 bg-cs-panel3`} aria-hidden />;
  }
}
