import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #0a0a0a, #141414)",
          borderRadius: 36,
          border: "2px solid rgba(200,255,0,0.4)",
        }}
      >
        <span style={{ fontSize: 96, fontWeight: 800, color: "#c8ff00" }}>x</span>
      </div>
    ),
    { ...size }
  );
}
