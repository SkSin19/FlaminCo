"use client";

// Speech bubbles that appear alongside the astronaut during the cinematic.
// These are pure DOM — positioned with CSS relative to the sticky canvas.
//
// Bubble 1 (top-left):  visible 0.22 → 0.48
// Bubble 2 (bottom-right): visible 0.38 → 0.64
//
// Each fades in over ~0.04 of progress and fades out over ~0.04.

type Bubble = {
  text: string;
  // Which side: "left" | "right"
  side: "left" | "right";
  // Vertical anchor as % from top of the sticky canvas
  topPct: number;
  // Progress window [fadeInStart, fullyVisible, startFade, fullyGone]
  timing: [number, number, number, number];
};

const BUBBLES: Bubble[] = [
  {
    text: "Entering lunar orbit…\nAll systems nominal.",
    side: "left",
    topPct: 32,
    timing: [0.20, 0.26, 0.44, 0.50],
  },
  {
    text: "Gravity: 1.62 m/s²\nPreparing for descent.",
    side: "right",
    topPct: 52,
    timing: [0.36, 0.42, 0.58, 0.64],
  },
];

function getOpacity(
  progress: number,
  [fadeInStart, fullyVisible, startFade, fullyGone]: [number, number, number, number],
): number {
  if (progress < fadeInStart || progress > fullyGone) return 0;
  if (progress < fullyVisible) {
    return (progress - fadeInStart) / (fullyVisible - fadeInStart);
  }
  if (progress < startFade) return 1;
  return 1 - (progress - startFade) / (fullyGone - startFade);
}

type Props = { progress: number };

export default function SpeechBubbles({ progress }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {BUBBLES.map((bubble, i) => {
        const opacity = getOpacity(progress, bubble.timing);
        if (opacity <= 0) return null;

        const isLeft = bubble.side === "left";

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${bubble.topPct}%`,
              // Offset from center — astronaut is at 50% horizontal
              ...(isLeft
                ? { right: "54%", textAlign: "right" }
                : { left: "54%", textAlign: "left" }),
              opacity,
              transition: "opacity 0.1s linear",
              // Slight vertical float animation via CSS
              animation: "bubbleFloat 3s ease-in-out infinite",
            }}
          >
            {/* Bubble body */}
            <div
              style={{
                display: "inline-block",
                background: "rgba(8, 12, 24, 0.82)",
                border: "1px solid rgba(120, 180, 255, 0.35)",
                borderRadius: isLeft
                  ? "16px 16px 4px 16px"
                  : "16px 16px 16px 4px",
                padding: "10px 16px",
                backdropFilter: "blur(8px)",
                boxShadow:
                  "0 0 24px rgba(80, 140, 255, 0.15), inset 0 1px 0 rgba(255,255,255,0.06)",
                maxWidth: "220px",
              }}
            >
              {/* Typing-cursor dot */}
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#5ba3ff",
                  marginBottom: 6,
                  boxShadow: "0 0 6px #5ba3ff",
                  display: "inline-block",
                  marginRight: 6,
                  animation: "blink 1.2s step-end infinite",
                }}
              />
              <span
                style={{
                  color: "#c8dcff",
                  fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                  fontSize: "clamp(10px, 1.1vw, 13px)",
                  letterSpacing: "0.04em",
                  lineHeight: 1.6,
                  whiteSpace: "pre-line",
                }}
              >
                {bubble.text}
              </span>
            </div>

            {/* Tail pointing toward astronaut center */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                ...(isLeft
                  ? {
                      right: -8,
                      borderLeft: "8px solid rgba(8, 12, 24, 0.82)",
                      borderTop: "6px solid transparent",
                      borderBottom: "6px solid transparent",
                    }
                  : {
                      left: -8,
                      borderRight: "8px solid rgba(8, 12, 24, 0.82)",
                      borderTop: "6px solid transparent",
                      borderBottom: "6px solid transparent",
                    }),
                transform: "translateY(-50%)",
                width: 0,
                height: 0,
              }}
            />
          </div>
        );
      })}

      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes bubbleFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-5px); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
}