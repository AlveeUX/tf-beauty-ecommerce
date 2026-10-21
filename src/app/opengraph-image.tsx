import { ImageResponse } from "next/og";
import { site } from "@/config/site";

export const alt = `${site.name} | ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Share preview drawn in code (no photograph), so the template ships no image it cannot redistribute. */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#241c1b",
        color: "#fdfbf8",
      }}
    >
      <div style={{ fontSize: 120, letterSpacing: 24, textTransform: "uppercase" }}>
        {site.name}
      </div>
      <div style={{ marginTop: 24, fontSize: 36, letterSpacing: 6, color: "#c7332b" }}>
        {site.tagline.toUpperCase()}
      </div>
    </div>,
    size,
  );
}
