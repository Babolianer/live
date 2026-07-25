import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
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
          background: "#0b0b12",
          borderRadius: 96,
        }}
      >
        <div
          style={{
            width: 220,
            height: 220,
            borderRadius: "50%",
            border: "28px solid #8b7cf6",
            display: "flex",
          }}
        />
      </div>
    ),
    size
  );
}
