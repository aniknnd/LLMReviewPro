import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

export const alt = `${site.name} — LLM news, reviews & benchmarks`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0a0f0d",
          color: "#f5f5f4",
        }}
      >
        <div style={{ fontSize: "64px", fontWeight: 800, lineHeight: 1.1 }}>
          {site.name}
        </div>
        <div style={{ marginTop: "20px", fontSize: "32px", color: "#a8a29e" }}>
          LLM news, reviews &amp; benchmarks
        </div>
        <div style={{ marginTop: "40px", fontSize: "22px", color: "#34d399" }}>
          Tested, not hyped.
        </div>
      </div>
    ),
    { ...size },
  );
}
