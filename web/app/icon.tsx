import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          borderRadius: 8,
          border: "1px solid rgba(200,255,0,0.35)",
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 800, color: "#c8ff00" }}>x</span>
      </div>
    ),
    { ...size }
  );
}
