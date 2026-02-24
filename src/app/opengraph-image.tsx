import { ImageResponse } from "next/og";

export const alt = "Stock Intelligence";
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
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #09090b 0%, #1a1a2e 50%, #16213e 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
          <span style={{ fontSize: "64px", fontWeight: 700 }}>
            Stock Intelligence
          </span>
        </div>
        <p
          style={{
            fontSize: "28px",
            color: "#a1a1aa",
            margin: 0,
          }}
        >
          거시경제 + 지정학 기반 AI 투자 가이드 플랫폼
        </p>
      </div>
    ),
    { ...size },
  );
}
