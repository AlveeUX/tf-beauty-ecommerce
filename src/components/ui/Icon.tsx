import type { SVGProps } from "react";

/**
 * Line icons. The design's icon layers are named after the Feather set
 * ("chevron-down 1", "search 1", "map-pin 1", ...), so the same 24px grid
 * and geometry are used here. Decorative by default (aria-hidden).
 */
const PATHS = {
  "chevron-down": <path d="M6 9l6 6 6-6" />,
  "chevron-left": <path d="M15 18l-6-6 6-6" />,
  "chevron-right": <path d="M9 18l6-6-6-6" />,
  "chevron-up": <path d="M18 15l-6-6-6 6" />,
  // Icons below are the exact Figma geometry, drawn on the design's 18px (or 14px) grid and scaled
  // into the 24 grid, so the 1.5px design stroke stays proportional at any size.
  search: (
    <g transform="scale(1.33333) translate(1.5 1.95)" strokeWidth="1.5">
      <path d="M12.75 6.75C12.75 10.0637 10.0637 12.75 6.75 12.75C3.43629 12.75 0.75 10.0637 0.75 6.75C0.75 3.43629 3.43629 0.75 6.75 0.75C10.0637 0.75 12.75 3.43629 12.75 6.75Z" />
      <path d="M14.25 13.8L10.9875 10.5375" strokeLinecap="butt" />
    </g>
  ),
  user: (
    <g transform="scale(1.33333) translate(1.32 0.43)" strokeWidth="1.4">
      <path
        d="M0.7 16.7V10.8818H7.68182H14.6636V16.7"
        strokeLinecap="butt"
        strokeLinejoin="miter"
      />
      <path d="M11.1727 4.19091C11.1727 6.11889 9.60979 7.68182 7.68182 7.68182C5.75384 7.68182 4.19091 6.11889 4.19091 4.19091C4.19091 2.26293 5.75384 0.7 7.68182 0.7C9.60979 0.7 11.1727 2.26293 11.1727 4.19091Z" />
    </g>
  ),
  heart: (
    <g transform="scale(1.33333)" strokeWidth="1.4">
      <path d="M15.7665 3.34167C15.3756 2.95053 14.9114 2.64026 14.4005 2.42857C13.8896 2.21688 13.342 2.10792 12.789 2.10792C12.236 2.10792 11.6884 2.21688 11.1775 2.42857C10.6666 2.64026 10.2024 2.95053 9.81145 3.34167L9.00009 4.15303L8.18872 3.34167C7.39903 2.55198 6.32797 2.10833 5.21118 2.10833C4.09438 2.10833 3.02332 2.55198 2.23363 3.34167C1.44394 4.13136 1.00029 5.20242 1.00029 6.31922C1.00029 7.43601 1.44394 8.50707 2.23363 9.29676L3.04499 10.1081L9.00009 16.0632L14.9552 10.1081L15.7665 9.29676C16.1577 8.90581 16.4679 8.44163 16.6796 7.93073C16.8913 7.41983 17.0003 6.87223 17.0003 6.31922C17.0003 5.7662 16.8913 5.2186 16.6796 4.7077C16.4679 4.1968 16.1577 3.73262 15.7665 3.34167Z" />
    </g>
  ),
  // Figma bag (Group 1171277226): box with an arched handle; drawn on the 18px grid, scaled to 24
  "shopping-bag": (
    <g transform="scale(1.33333) translate(1.5 0.3)" strokeWidth="1.5">
      <path d="M11 7.7C11 4.59396 11 0.7 7.5 0.7C4 0.7 4 4.59396 4 7.7" />
      <path d="M0.658824 5.35882H14.3412V16.0412H0.658824V5.35882Z" strokeLinecap="butt" />
    </g>
  ),
  "map-pin": (
    <g transform="scale(1.71429) translate(1.54 0.45)" strokeWidth="1.1">
      <path d="M10.3682 5.45909C10.3682 9.27727 5.45909 12.55 5.45909 12.55C5.45909 12.55 0.55 9.27727 0.55 5.45909C0.55 4.15712 1.06721 2.90847 1.98784 1.98784C2.90847 1.06721 4.15712 0.55 5.45909 0.55C6.76106 0.55 8.00971 1.06721 8.93034 1.98784C9.85098 2.90847 10.3682 4.15712 10.3682 5.45909Z" />
      <path d="M7.09554 5.45909C7.09554 6.36283 6.36292 7.09546 5.45918 7.09546C4.55544 7.09546 3.82282 6.36283 3.82282 5.45909C3.82282 4.55535 4.55544 3.82273 5.45918 3.82273C6.36292 3.82273 7.09554 4.55535 7.09554 5.45909Z" />
    </g>
  ),
  bell: (
    <>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </>
  ),
  home: (
    <>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </>
  ),
  "arrow-right": (
    <>
      <path d="M4 12H19" />
      <path d="M12 5l7 7-7 7" />
    </>
  ),
  // the design draws it as the right arrow turned 45deg counter-clockwise
  "arrow-up-right": (
    <g transform="rotate(-45 12 12)">
      <path d="M4 12H19" />
      <path d="M12 5l7 7-7 7" />
    </g>
  ),
  "arrow-up": (
    <>
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </>
  ),
  x: (
    <>
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  check: <path d="M20 6L9 17l-5-5" />,
  eye: (
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  "eye-off": (
    <>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </>
  ),
  flame: (
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  ),
  package: (
    <>
      <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
      <path d="M3 8l9 5 9-5" />
      <path d="M12 13v8" />
    </>
  ),
  mortar: (
    <>
      <path d="M4 11h16a8 8 0 0 1-16 0z" />
      <path d="M9 11l7-7" />
      <path d="M15 4l3 3" />
    </>
  ),
  "user-circle": (
    <>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.5 19a6.5 6.5 0 0 1 11 0" />
    </>
  ),
  shuffle: (
    <>
      <path d="M16 3h5v5" />
      <path d="M4 20L21 3" />
      <path d="M21 16v5h-5" />
      <path d="M15 15l6 6" />
      <path d="M4 4l5 5" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </>
  ),
  list: (
    <>
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 21v-7" />
      <path d="M4 10V3" />
      <path d="M12 21v-9" />
      <path d="M12 8V3" />
      <path d="M20 21v-5" />
      <path d="M20 12V3" />
      <path d="M1 14h6" />
      <path d="M9 8h6" />
      <path d="M17 16h6" />
    </>
  ),
  droplet: <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />,
  truck: (
    <>
      <path d="M1 3h15v13H1z" />
      <path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </>
  ),
  refresh: (
    <>
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </>
  ),
  leaf: (
    <>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
    </>
  ),
  maximize: (
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  ),
  "arrow-left": (
    <>
      <path d="M20 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </>
  ),
  // Figma "exchange-horizontal": a filled glyph, drawn on the 32px button grid (icon at 8..24)
  "compare-arrows": (
    <path
      transform="scale(1.5) translate(-8 -8)"
      fill="currentColor"
      stroke="none"
      d="M18.6665 21.3334C18.5347 21.3334 18.4058 21.2942 18.2962 21.221C18.1866 21.1477 18.1012 21.0436 18.0507 20.9218C18.0003 20.8 17.9871 20.666 18.0128 20.5367C18.0385 20.4074 18.102 20.2886 18.1952 20.1954L20.3905 18.0001H10.9999C10.823 18.0001 10.6535 17.9298 10.5285 17.8048C10.4034 17.6798 10.3332 17.5102 10.3332 17.3334C10.3332 17.1566 10.4034 16.987 10.5285 16.862C10.6535 16.737 10.823 16.6667 10.9999 16.6667H21.9999C22.1317 16.6667 22.2606 16.7059 22.3702 16.7791C22.4798 16.8524 22.5652 16.9565 22.6156 17.0783C22.6661 17.2001 22.6793 17.3341 22.6536 17.4634C22.6279 17.5927 22.5644 17.7115 22.4712 17.8047L19.1379 21.1381C19.0129 21.2631 18.8433 21.3333 18.6665 21.3334ZM21.6665 14.0001C21.6665 13.8232 21.5963 13.6537 21.4713 13.5287C21.3462 13.4036 21.1767 13.3334 20.9999 13.3334H11.6092L13.8045 11.1381C13.926 11.0123 13.9932 10.8439 13.9916 10.6691C13.9901 10.4943 13.92 10.3271 13.7964 10.2035C13.6728 10.0799 13.5056 10.0098 13.3308 10.0083C13.156 10.0068 12.9876 10.0739 12.8619 10.1954L9.52852 13.5287C9.43532 13.622 9.37185 13.7407 9.34614 13.87C9.32042 13.9993 9.33363 14.1334 9.38407 14.2552C9.43452 14.377 9.51995 14.4811 9.62955 14.5543C9.73916 14.6276 9.86802 14.6667 9.99986 14.6667H20.9999C21.1767 14.6667 21.3462 14.5965 21.4713 14.4715C21.5963 14.3464 21.6665 14.1769 21.6665 14.0001Z"
    />
  ),
  "check-circle": (
    <>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="M22 4L12 14.01l-3-3" />
    </>
  ),
  // Feather "info" (Figma layer "info 1")
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </>
  ),
  rotate: (
    <>
      <path d="M1 4v6h6" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </>
  ),
  ban: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M4.93 4.93l14.14 14.14" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </>
  ),
  brush: <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />,
  flask: (
    <>
      <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
      <path d="M8.5 2h7" />
      <path d="M7 16h10" />
    </>
  ),
  "badge-check": (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  "thumbs-up": (
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  ),
  star: (
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  ),
} as const;

export type IconName = keyof typeof PATHS;

/** Every icon the template draws, for the UI kit page. */
export const ICON_NAMES = Object.keys(PATHS) as IconName[];

type IconProps = Omit<SVGProps<SVGSVGElement>, "name"> & {
  name: IconName;
  size?: number;
  /** Filled glyph (used for rating stars). */
  filled?: boolean;
  strokeWidth?: number;
};

export function Icon({ name, size = 18, filled = false, strokeWidth = 2, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
