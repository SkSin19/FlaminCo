"use client";

import { useEffect, useRef, ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────────────────────────────────────
   SCROLL LINE  (scoped version)

   Wrap ONLY the sections you want the line to run through. It measures its
   own children's rendered height and the line draws itself in step with
   scroll ONLY across that span — starting the moment this wrapper enters
   the top of the viewport, finishing when it leaves the bottom.

   USAGE
     <Hero />
     <ScrollLine>
       <SectionA />
       <SectionB />
       <SectionC />
     </ScrollLine>
     <Interactive3DSection />

   The line will NOT appear over <Hero /> or <Interactive3DSection /> — only
   over whatever you put inside <ScrollLine>...</ScrollLine>. Add/remove
   sections inside it freely later; it re-measures on resize and on content
   growth (ResizeObserver on the wrapper itself).

   SHAPE
   The path now reads as a single journey across the wrapped block rather
   than a centered descent:
     - Enters from the LEFT edge at the top of the wrapped span.
     - Sweeps inward and spends the middle of the span coiling — a chain of
       semicircles and near-full circular loops with occasional sideways
       bezier drifts — centered on screen, so the looping motif visually
       happens "in the middle".
     - Sweeps back out and finishes at the BOTTOM-RIGHT corner of the
       wrapped span (which lines up with the bottom-right of the screen at
       the moment the wrapper finishes leaving the viewport).
   Every join is tangent-continuous (no sharp corners) — the lead-in and
   lead-out are bezier sweeps that match the coil's vertical tangent at the
   handoff points.

   Z-INDEX CONTRACT
   Renders at Z_INDEX (default 5).
   - Each wrapped section's bg (color/image) must be BELOW 5 (e.g. 0–1).
   - Each wrapped section's foreground content must be ABOVE 5 (e.g. 10+).
   - Section roots inside should not carry their own z-index — that creates
     a separate stacking context and breaks the layering.
───────────────────────────────────────────────────────────────────────────── */

const Z_INDEX = 2;

const LINE_COLOR_START = "#2f8fe0";
const LINE_COLOR_MID = "#64dcff";
const LINE_COLOR_END = "#bdf3ff";

const STROKE_WIDTH = 16;
const GLOW_WIDTH = 30;

/** Builds a smooth, fully deterministic path: enters from the left edge,
 *  sweeps into the centre and runs a fixed repeating chain of straight
 *  segments, S-curves, full circular loops, and semicircle bulges through
 *  the middle of the height, then sweeps back out to the bottom-right
 *  corner. No randomness — the same width/height always produces the same
 *  shape, and every join is tangent-continuous (no sharp corners). */
function buildCircularChainPath(width: number, height: number) {
  const cx = width * 0.5;
  const r = Math.min(width * 0.1, height * 0.05) || width * 0.1; // fixed, even radius
  const straightLen = r * 2.6;
  const curveShift = r * 1.8;

  // Keep the start point off the literal left edge so the glow (GLOW_WIDTH)
  // doesn't get clipped there — but the end point is meant to land exactly
  // in the bottom-right corner, so it gets no inset.
  const edgeInset = Math.max(GLOW_WIDTH, width * 0.05);
  const startX = edgeInset;
  const endX = width;

  // Lead-in band (left edge → centre) and lead-out band (centre → bottom-
  // right corner) are reserved off the top and bottom of the height; the
  // looping chain fills everything in between.
  const leadInHeight = Math.max(height * 0.12, r * 4);
  const leadOutHeight = Math.max(height * 0.16, r * 5);

  let x = startX;
  let y = 0;
  const cmds: string[] = [`M ${x.toFixed(1)} ${y.toFixed(1)}`];

  // Lead-in: sweep from the left edge into the centre, where the looping
  // chain begins.
  const leadInEndY = leadInHeight;
  {
    const cp1x = x;
    const cp1y = y + (leadInEndY - y) * 0.5;
    const cp2x = cx;
    const cp2y = y + (leadInEndY - y) * 0.5;
    cmds.push(
      `C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${cx.toFixed(1)} ${leadInEndY.toFixed(1)}`,
    );
  }
  x = cx;
  y = leadInEndY;

  // Looping chain — stays centred on cx, coiling through the middle band
  // of the height.
  const loopFloor = height - leadOutHeight;
  let dir = 1; // curve/bulge direction: 1 = right, -1 = left
  const pattern: Array<"line" | "curve" | "circle"> = [
    "line",
    "curve",
    "line",
    "circle",
    "curve",
  ];

  let i = 0;
  let guard = 0;
  while (y < loopFloor && guard < 600) {
    guard++;
    const type = pattern[i % pattern.length];
    i++;

    if (type === "line") {
      y += straightLen;
      cmds.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
    } else if (type === "curve") {
      const targetX = cx + dir * curveShift;
      const endY = y + r * 2.4;
      const cp1x = x;
      const cp1y = y + (endY - y) * 0.5;
      const cp2x = targetX;
      const cp2y = y + (endY - y) * 0.5;
      cmds.push(
        `C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${targetX.toFixed(1)} ${endY.toFixed(1)}`,
      );
      x = targetX;
      y = endY;
      dir *= -1;
    } else {
      const sweep = dir > 0 ? 1 : 0;

      const endY = y + r * 2;

      cmds.push(
        `A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 ${sweep} ${x.toFixed(1)} ${endY.toFixed(1)}`,
      );

      y = endY;

      dir *= -1;
    }
  }

  // Re-centre onto cx in case the chain happened to break mid "curve" beat,
  // so the lead-out always starts from a known, centred position.
  if (Math.abs(x - cx) > 0.5) {
    const settleEndY = y + r * 2;
    const cp1x = x;
    const cp1y = y + (settleEndY - y) * 0.5;
    const cp2x = cx;
    const cp2y = y + (settleEndY - y) * 0.5;
    cmds.push(
      `C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${cx.toFixed(1)} ${settleEndY.toFixed(1)}`,
    );
    x = cx;
    y = settleEndY;
  }

  // A short straight settle so the lead-out begins on a clean vertical
  // tangent — no kink where the coil hands off to the final sweep.
  const settleY = y + r * 1.2;
  cmds.push(`L ${x.toFixed(1)} ${settleY.toFixed(1)}`);
  y = settleY;

  // Lead-out: sweep from the centre out to the bottom-right corner of the
  // wrapped span.
  {
    const cp1x = x;
    const cp1y = y + (height - y) * 0.4;
    const cp2x = endX;
    const cp2y = y + (height - y) * 0.75;
    cmds.push(
      `C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${endX.toFixed(1)} ${height.toFixed(1)}`,
    );
  }

  return cmds.join(" ");
}

export default function ScrollLine({ children }: { children: ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const glowPathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const svg = svgRef.current;
    const path = pathRef.current;
    const glowPath = glowPathRef.current;
    if (!wrapper || !svg || !path || !glowPath) return;

    let st: ScrollTrigger | null = null;
    let ro: ResizeObserver | null = null;
    let raf = 0;

    const build = () => {
      const height = wrapper.offsetHeight;
      const width = window.innerWidth;
      if (height < 10) return;

      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.setAttribute("width", String(width));
      svg.setAttribute("height", String(height));

      const d = buildCircularChainPath(width, height);
      path.setAttribute("d", d);
      glowPath.setAttribute("d", d);

      const length = path.getTotalLength();
      [path, glowPath].forEach((p) => {
        p.style.strokeDasharray = `${length}`;
        p.style.strokeDashoffset = `${length}`;
      });

      st?.kill();
      st = ScrollTrigger.create({
        trigger: wrapper,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.4, // eased lag rather than a 1:1 linear tie to scroll
        onUpdate: (self) => {
          const offset = length * (1 - self.progress);
          gsap.to([path, glowPath], {
            strokeDashoffset: offset,
            ease: "none",
            duration: 0.3,
            overwrite: "auto",
          });
        },
      });

      ScrollTrigger.refresh();
    };

    raf = requestAnimationFrame(build);
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(build);
    };
    window.addEventListener("resize", onResize);

    ro = new ResizeObserver(() => onResize());
    ro.observe(wrapper);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
      st?.kill();
    };
  }, []);

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <div
        ref={overlayRef}
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: `${Z_INDEX} !important`,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <svg
          ref={svgRef}
          preserveAspectRatio="none"
          style={{ display: "block", width: "100%", height: "100%" }}
        >
          <defs>
            <linearGradient
              id="scroll-line-gradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={LINE_COLOR_START} />
              <stop offset="50%" stopColor={LINE_COLOR_MID} />
              <stop offset="100%" stopColor={LINE_COLOR_END} />
            </linearGradient>

            <filter
              id="scroll-line-glow"
              x="-60%"
              y="-60%"
              width="220%"
              height="220%"
            >
              <feGaussianBlur stdDeviation="9" />
            </filter>
          </defs>

          <path
            ref={glowPathRef}
            d=""
            fill="none"
            stroke="url(#scroll-line-gradient)"
            strokeWidth={GLOW_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.4}
            filter="url(#scroll-line-glow)"
          />

          <path
            ref={pathRef}
            d=""
            fill="none"
            stroke="url(#scroll-line-gradient)"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {children}
    </div>
  );
}
