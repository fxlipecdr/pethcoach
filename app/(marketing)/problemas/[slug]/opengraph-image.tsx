import { ImageResponse } from "next/og";
import { findProblem } from "@/content/problems";

export const alt = "PethCoach — orientação baseada em recompensa";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const toneColors = {
  sage: "#ddf3ef",
  peach: "#fde8e2",
  lavender: "#e7ebf0",
};

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const problem = findProblem((await params).slug);
  if (!problem) return new Response("Não encontrado", { status: 404 });

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        padding: "64px",
        background: toneColors[problem.tone],
        color: "#062549",
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          border: "2px solid rgba(6,37,73,0.14)",
          borderRadius: "36px",
          padding: "54px",
          background: "rgba(255,255,255,0.42)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "0.12em",
          }}
        >
          <span>PETHCOACH</span>
          <span>{problem.category}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              maxWidth: 930,
              fontSize: 72,
              lineHeight: 1.05,
              fontWeight: 650,
              letterSpacing: "-0.045em",
            }}
          >
            {problem.title}
          </div>
          <div
            style={{
              marginTop: 28,
              maxWidth: 830,
              fontSize: 30,
              lineHeight: 1.35,
              color: "rgba(6,37,73,0.78)",
            }}
          >
            {problem.description}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 24 }}>
          Recompensa, respeito e passos possíveis.
        </div>
      </div>
    </div>,
    size,
  );
}
