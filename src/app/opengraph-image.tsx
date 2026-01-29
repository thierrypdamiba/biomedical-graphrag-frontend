import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "PubMed Navigator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0B1220 0%, #141E30 50%, #1a1040 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Subtle grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.05,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            display: "flex",
          }}
        />

        {/* Qdrant logo SVG */}
        <svg
          width="80"
          height="90"
          viewBox="0 0 57 64"
          fill="#DC244C"
          style={{ marginBottom: 32 }}
        >
          <path d="M28.335 0 .62 16v32l27.714 16 10.392-6V46l-10.392 6-17.32-10V22l17.32-10 17.32 10v40l10.393-6V16z" />
          <path d="M17.943 26v12l10.392 6 10.392-6V26l-10.392-6z" />
        </svg>

        {/* Title */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "white",
            letterSpacing: "-0.02em",
            display: "flex",
          }}
        >
          PubMed Navigator
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: "rgba(255,255,255,0.6)",
            marginTop: 16,
            display: "flex",
            textAlign: "center",
            maxWidth: 700,
          }}
        >
          AI-powered research assistant combining vector search with knowledge graphs
        </div>

        {/* Bottom bar */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            alignItems: "center",
            gap: 24,
            color: "rgba(255,255,255,0.4)",
            fontSize: 18,
          }}
        >
          <span>Qdrant</span>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>+</span>
          <span>Neo4j</span>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>+</span>
          <span>PubMed</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
