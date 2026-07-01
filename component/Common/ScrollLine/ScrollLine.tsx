/* eslint-disable react-hooks/refs */
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  ReactNode,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────────────────────────────────
   SCROLL LINE  (context-based, DOM-order safe)

   WHY THIS SHAPE
   The old version wrapped a whole section from the outside and gave its
   SVG overlay an explicit z-index, assuming that would slot it "above
   backgrounds, below content" inside whatever it wrapped. That doesn't
   work: a section using `position: relative` (needed so its own absolutely
   positioned children lay out correctly) is itself a single positioned box
   from the outside. CSS stacking-context rules make it atomic — the whole
   section, background and content together, sits at ONE stacking slot
   relative to a sibling overlay. No z-index on the outer overlay can
   reach "between" that section's own background and its own content,
   because that comparison never happens at the outer level — it only
   exists inside the section's own stacking context.

   THE FIX
   The beam now physically lives in the DOM between a section's background
   and its foreground content, instead of wrapping the section from
   outside. Two pieces:

     <ScrollLineTrack>   → wraps everything the line should run through
                            (one section or many). Purely structural —
                            renders no visuals, just measures total height
                            and drives one continuous scroll-scrubbed path.

     <ScrollLineBeam />  → drop this INSIDE each section, as a normal
                            sibling placed AFTER the section's own
                            background elements and BEFORE its foreground
                            content in JSX. DOM order is what makes this
                            work now — within a single stacking context,
                            later siblings paint above earlier ones by
                            default. The beam's own z-index (default 1)
                            only needs to beat non-positioned/low bg
                            content; anything you want above the line
                            just needs to come after it in the section's
                            JSX (or use z-index 2+, same as before).

   USAGE
     <ScrollLineTrack>
       <SectionA>
         <SectionABackground />   // canvas / bg colour / bg image
         <ScrollLineBeam />
         <SectionAContent />      // headings, cards, buttons
       </SectionA>
       <SectionB>
         <SectionBBackground />
         <ScrollLineBeam />
         <SectionBContent />
       </SectionB>
     </ScrollLineTrack>

   Every <ScrollLineBeam /> in the tree shares ONE continuous path and ONE
   scroll-driven dash offset — each just gets clipped to the section it's
   placed in, so the line appears to run seamlessly from section to
   section as the page scrolls, correctly sandwiched in each one.

   SHAPE (unchanged from before)
   Enters from the LEFT edge at the top of the track, sweeps into the
   centre and coils through the middle (semicircles, near-full circular
   loops, occasional sideways bezier drifts), then sweeps back out to the
   BOTTOM-RIGHT corner at the bottom of the track. Every join is
   tangent-continuous. No randomness — same width/height always produces
   the same shape.
───────────────────────────────────────────────────────────────────────── */

const LINE_COLOR_START = "#2f8fe0";
const LINE_COLOR_MID = "#64dcff";
const LINE_COLOR_END = "#bdf3ff";

const STROKE_WIDTH = 40;
const GLOW_WIDTH = 70;

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

  const startX = 0;
  const endX = width;

  const leadInHeight = Math.max(height * 0.12, r * 4);
  const leadOutHeight = Math.max(height * 0.34, width * 0.4, r * 10);

  let x = startX;
  let y = 0;
  const cmds: string[] = [`M ${x.toFixed(1)} ${y.toFixed(1)}`];

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

  const loopFloor = height - leadOutHeight;
  let dir = 1;
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

  const settleY = y + r * 1.2;
  cmds.push(`L ${x.toFixed(1)} ${settleY.toFixed(1)}`);
  y = settleY;

  {
    const endY = height - leadOutHeight * 0.15;
    const cp1x = x;
    const cp1y = y + (endY - y) * 0.5;
    const cp2x = endX;
    const cp2y = y + (endY - y) * 0.5;
    cmds.push(
      `C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`,
    );
  }

  return cmds.join(" ");
}

type BeamRefs = {
  wrapperEl: HTMLDivElement;
  svgEl: SVGSVGElement;
  pathEl: SVGPathElement;
  glowEl: SVGPathElement;
};

type TrackApi = {
  register: (id: number, refs: BeamRefs) => void;
  unregister: (id: number) => void;
};

const TrackContext = createContext<TrackApi | null>(null);

export function ScrollLineTrack({ children }: { children: ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const beamsRef = useRef<Map<number, BeamRefs>>(new Map());
  const stRef = useRef<ScrollTrigger | null>(null);
  const rafRef = useRef(0);

  const build = () => {
    const wrapper = wrapperRef.current;
    if (!wrapper || beamsRef.current.size === 0) return;

    const height = wrapper.offsetHeight;
    const width = window.innerWidth;
    if (height < 10) return;

    const d = buildCircularChainPath(width, height);
    const wrapperRect = wrapper.getBoundingClientRect();

    // Offscreen sampler purely to measure total path length for the scrub.
    const sampler = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    sampler.setAttribute("d", d);
    const totalLength = sampler.getTotalLength();

    beamsRef.current.forEach(({ wrapperEl, svgEl, pathEl, glowEl }) => {
      const sectionRect = wrapperEl.getBoundingClientRect();
      const offsetTop = sectionRect.top - wrapperRect.top;
      const sectionHeight = wrapperEl.offsetHeight;

      svgEl.setAttribute(
        "viewBox",
        `0 ${offsetTop.toFixed(1)} ${width} ${sectionHeight}`,
      );

      pathEl.setAttribute("d", d);
      glowEl.setAttribute("d", d);

      [pathEl, glowEl].forEach((p) => {
        p.style.strokeDasharray = `${totalLength}`;
        p.style.strokeDashoffset = `${totalLength}`;
      });
    });

    stRef.current?.kill();
    stRef.current = ScrollTrigger.create({
      trigger: wrapper,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.4,
      onUpdate: (self) => {
        const offset = totalLength * (1 - self.progress);
        const targets: SVGPathElement[] = [];
        beamsRef.current.forEach(({ pathEl, glowEl }) => {
          targets.push(pathEl, glowEl);
        });
        gsap.to(targets, {
          strokeDashoffset: offset,
          ease: "none",
          duration: 0.3,
          overwrite: "auto",
        });
      },
    });

    ScrollTrigger.refresh();
  };

  const scheduleRebuild = () => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(build);
  };

  const apiRef = useRef<TrackApi>({
    register: (id, refs) => {
      beamsRef.current.set(id, refs);
      scheduleRebuild();
    },
    unregister: (id) => {
      beamsRef.current.delete(id);
      scheduleRebuild();
    },
  });

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    scheduleRebuild();

    const onResize = () => scheduleRebuild();
    window.addEventListener("resize", onResize);

    const ro = new ResizeObserver(() => scheduleRebuild());
    ro.observe(wrapper);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
      stRef.current?.kill();
    };
  }, []);

  return (
    <TrackContext.Provider value={apiRef.current}>
      <div ref={wrapperRef} style={{ position: "relative" }}>
        {children}
      </div>
    </TrackContext.Provider>
  );
}

let beamIdSeq = 0;

/** Place this INSIDE a section, after its background and before its
 *  foreground content. `zIndex` defaults to 1 — enough to sit above plain
 *  non-positioned background content; give your foreground content
 *  z-index 2+ (or just place it after this in JSX) to keep it on top. */
export function ScrollLineBeam({ zIndex = 1 }: { zIndex?: number }) {
  const api = useContext(TrackContext);
  const idRef = useRef<number | null>(null);
  if (idRef.current === null) idRef.current = beamIdSeq++;
  const uid = idRef.current;

  const wrapperElRef = useRef<HTMLDivElement>(null);
  const svgElRef = useRef<SVGSVGElement>(null);
  const pathElRef = useRef<SVGPathElement>(null);
  const glowElRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (
      !api ||
      !wrapperElRef.current ||
      !svgElRef.current ||
      !pathElRef.current ||
      !glowElRef.current
    ) {
      return;
    }
    api.register(uid, {
      wrapperEl: wrapperElRef.current,
      svgEl: svgElRef.current,
      pathEl: pathElRef.current,
      glowEl: glowElRef.current,
    });
    return () => api.unregister(uid);
  }, [api, uid]);

  if (!api) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "<ScrollLineBeam /> must be rendered inside a <ScrollLineTrack>.",
      );
    }
    return null;
  }

  const gradientId = `scroll-line-gradient-${uid}`;
  const glowFilterId = `scroll-line-glow-${uid}`;

  return (
    <div
      ref={wrapperElRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        zIndex,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <svg
        ref={svgElRef}
        preserveAspectRatio="none"
        style={{ display: "block", width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={LINE_COLOR_START} />
            <stop offset="50%" stopColor={LINE_COLOR_MID} />
            <stop offset="100%" stopColor={LINE_COLOR_END} />
          </linearGradient>

          <filter
            id={glowFilterId}
            x="-60%"
            y="-60%"
            width="220%"
            height="220%"
          >
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>

        <path
          ref={glowElRef}
          d=""
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={GLOW_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.4}
          filter={`url(#${glowFilterId})`}
        />

        <path
          ref={pathElRef}
          d=""
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}