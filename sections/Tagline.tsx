/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Box,
  Boxes,
  Cloud,
  Cpu,
  Database,
  GitBranch,
  Globe,
  Layers,
  Network,
  Orbit,
  Radar,
  Satellite,
  Shapes,
  Sparkles,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { ScrollLineBeam } from "@/component/Common/ScrollLine/ScrollLine";
import BottomBlur from "@/component/Common/Blurs/BottomBlur";
import TopBlur from "@/component/Common/Blurs/TopBlur";
gsap.registerPlugin(ScrollTrigger);

type BgTool = {
  Icon: LucideIcon;
  top: string; // % from top of track
  left: string; // % from left of track — final resting spot mid-animation
  size: number; // px square (base size, before the in-motion growth)
  label: string; // shown on hover, in place of the icon
};

/* Loosely mirrors the scattered/masonry feel of the reference screenshot —
   mixed sizes, uneven vertical rhythm, clustered toward the outer thirds
   with a calmer gap in the middle where the heading sits. */
const BACKGROUND_TOOLS: BgTool[] = [
  { Icon: Orbit, top: "6%", left: "6%", size: 64, label: "Orbit Sync" },
  { Icon: Satellite, top: "34%", left: "4%", size: 56, label: "Telemetry" },
  { Icon: Radar, top: "62%", left: "10%", size: 60, label: "Discovery" },
  { Icon: Globe, top: "10%", left: "20%", size: 52, label: "Global Reach" },
  { Icon: Network, top: "70%", left: "22%", size: 58, label: "Mesh Network" },
  { Icon: Cpu, top: "44%", left: "30%", size: 50, label: "Compute" },
  { Icon: Database, top: "8%", left: "78%", size: 58, label: "Database" },
  { Icon: Cloud, top: "36%", left: "84%", size: 64, label: "Cloud Storage" },
  { Icon: Boxes, top: "64%", left: "76%", size: 56, label: "Containers" },
  { Icon: Layers, top: "16%", left: "92%", size: 50, label: "Pipelines" },
  { Icon: GitBranch, top: "72%", left: "90%", size: 54, label: "Versioning" },
  { Icon: Workflow, top: "48%", left: "94%", size: 46, label: "Automation" },
  { Icon: Shapes, top: "24%", left: "62%", size: 44, label: "Custom Tools" },
  { Icon: Box, top: "80%", left: "56%", size: 48, label: "Packages" },
];

/* Mobile layout: far fewer tiles, smaller, and confined to a thin band at
   the very top and very bottom of the section — the vertical middle is
   reserved for the heading + stacked feature cards on narrow screens. */
const BACKGROUND_TOOLS_MOBILE: BgTool[] = [
  { Icon: Orbit, top: "3%", left: "8%", size: 36, label: "Orbit Sync" },
  { Icon: Satellite, top: "5%", left: "64%", size: 32, label: "Telemetry" },
  { Icon: Globe, top: "11%", left: "32%", size: 28, label: "Global Reach" },
  { Icon: Cpu, top: "10%", left: "86%", size: 30, label: "Compute" },
  { Icon: Database, top: "90%", left: "10%", size: 34, label: "Database" },
  { Icon: Cloud, top: "92%", left: "62%", size: 32, label: "Cloud Storage" },
  { Icon: Boxes, top: "83%", left: "84%", size: 28, label: "Containers" },
  { Icon: Layers, top: "85%", left: "34%", size: 26, label: "Pipelines" },
];

const FEATURE_CARDS = [
  {
    Icon: Sparkles,
    title: "Discovers",
    body: "Surfaces the right tool for the task the moment it's needed, no manual wiring.",
    detail:
      "Matches incoming requests to capability fingerprints across the full catalog in real time.",
  },
  {
    Icon: Zap,
    title: "Connects",
    body: "Speaks every tool's native protocol so nothing gets lost in translation.",
    detail:
      "Adapts on the fly to REST, GraphQL, gRPC, and MCP without any custom glue code.",
  },
  {
    Icon: Network,
    title: "Orchestrates",
    body: "Sequences dozens of tools in parallel across a single, coherent run.",
    detail:
      "Runs dependent and independent tool calls side by side while keeping one execution trace.",
  },
];

/* Lightweight, self-contained starfield — deliberately quieter than the Hero's,
   just enough ambient motion to read as "space" without competing with the cards. */
function useSectionStarfield(ref: React.RefObject<HTMLCanvasElement | null>) {
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let stars: { x: number; y: number; r: number; tw: number; off: number }[] =
      [];
    let W = 0,
      H = 0,
      raf = 0,
      frame = 0;

    const init = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      W = canvas.width = rect.width;
      H = canvas.height = rect.height;
      const count = Math.min(Math.floor((W * H) / 1800), 220);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.3 + 0.2,
        tw: 0.002 + Math.random() * 0.005,
        off: Math.random() * Math.PI * 2,
      }));
    };

    const draw = () => {
      raf = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, W, H);
      for (const s of stars) {
        const a = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(frame * s.tw + s.off));
        ctx.globalAlpha = a;
        ctx.fillStyle = "#bfe7ff";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      frame++;
    };

    const ro = new ResizeObserver(init);
    ro.observe(canvas.parentElement!);
    init();
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [ref]);
}

export default function TaglineTools() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const starCanvasRef = useRef<HTMLCanvasElement>(null);
  const bgCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const featureCardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const featureTextRefs = useRef<(HTMLDivElement | null)[]>([]);
  const headingRefs = useRef<(HTMLHeadingElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hoveredBg, setHoveredBg] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useSectionStarfield(starCanvasRef);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const bgCards = bgCardRefs.current.filter(Boolean) as HTMLDivElement[];
    const featureCards = featureCardRefs.current.filter(
      Boolean,
    ) as HTMLDivElement[];
    const featureTexts = featureTextRefs.current.filter(
      Boolean,
    ) as HTMLDivElement[];
    const headings = headingRefs.current.filter(
      Boolean,
    ) as HTMLHeadingElement[];

    // Start state: background cards off-screen left, smaller than their
    // resting size (so they visibly grow as they travel in). Feature cards
    // start further off-screen left and scaled down to the same small
    // "icon card" footprint as the background tiles — their inner text is
    // hidden until they've nearly finished growing into the full card.
    gsap.set(bgCards, { x: "-70vw", opacity: 0, scale: 0.55 });
    gsap.set(featureCards, { x: "-40vw", opacity: 0, scale: 0.24 });
    gsap.set(featureTexts, { opacity: 0 });
    // Headings start fully invisible — nothing on screen yet.
    gsap.set(headings, { opacity: 0, filter: "blur(26px)" });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "+=300%",
        scrub: 1.1,
        pin: true,
        anticipatePin: 1,
      },
    });

    // Heading reveal: nothing → a blurred ghost fades in → blur resolves
    // into sharp, readable text. Two overlapping stages so it reads as one
    // continuous "coming into focus" motion rather than two separate beats.
    tl.to(
      headings,
      {
        opacity: 1,
        ease: "power1.out",
        duration: 0.16,
        stagger: { each: 0.06, from: "start" },
      },
      0,
    ).to(
      headings,
      {
        filter: "blur(0px)",
        ease: "power2.out",
        duration: 0.22,
        stagger: { each: 0.06, from: "start" },
      },
      0.06,
    );

    // Phase 1: background tool cards drift in from the left, staggered,
    // settling into their scattered resting spots — growing past their
    // resting size on the way in so the motion itself reads as "bigger".
    tl.to(
      bgCards,
      {
        x: "0vw",
        opacity: 1,
        scale: 1.2,
        ease: "power2.out",
        duration: 0.4,
        stagger: { each: 0.025, from: "start" },
      },
      0,
    );

    // Phase 2: background cards keep drifting right, grow a touch more,
    // and fade away, while the 3 feature cards arrive from the left at
    // their small footprint and scale up into the final centered row —
    // the "stuck" moment. Their text fades in once they're most of the
    // way through growing, so it never reads as squashed/illegible.
    tl.to(
      bgCards,
      {
        x: "55vw",
        opacity: 0,
        scale: 1.45,
        ease: "power1.in",
        duration: 0.32,
        stagger: { each: 0.018, from: "start" },
      },
      0.42,
    )
      .to(
        featureCards,
        {
          x: "0vw",
          opacity: 1,
          scale: 1,
          ease: "back.out(1.4)",
          duration: 0.34,
          stagger: { each: 0.08, from: "start" },
        },
        0.46,
      )
      .to(
        featureTexts,
        {
          opacity: 1,
          ease: "power1.in",
          duration: 0.16,
          stagger: { each: 0.08, from: "start" },
        },
        0.64,
      )
      .call(() => {
        window.dispatchEvent(new Event("startLanding"));
      });

    // Phase 3 (0.78 → 1.0): hold — no tweens, the pin keeps the 3 cards on
    // screen for the remainder of the scroll range.

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen overflow-hidden"
      style={{
        background: "#000003",
      }}
    >
      <canvas
        ref={starCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 0 }}
      />
      <ScrollLineBeam />
      <TopBlur height={180} color="#000003" className="z-10" />
      <BottomBlur height={180} color="#000003" className="z-10" />

      <div
        ref={trackRef}
        className="absolute inset-0 -translate-y-30"
        style={{ zIndex: 3 }}
      >
        {/* Heading */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pointer-events-none select-none">
          <h2
            ref={(el) => {
              headingRefs.current[0] = el;
            }}
            className="text-center"
            style={{
              fontFamily: "Orbitron, monospace",
              fontWeight: 700,
              fontSize: "clamp(28px, 5vw, 52px)",
              color: "#eaf6ff",
              lineHeight: 1.25,
            }}
          >
            Engineered to operate
          </h2>
          <h2
            ref={(el) => {
              headingRefs.current[1] = el;
            }}
            className="text-center"
            style={{
              fontFamily: "Orbitron, monospace",
              fontWeight: 700,
              fontSize: "clamp(28px, 5vw, 52px)",
              lineHeight: 1.25,
              background:
                "linear-gradient(90deg, #9ff7e0 0%, #64dcff 45%, #5b8dee 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            across a universe of tools
          </h2>
        </div>

        {/* Background scatter of tool cards — hover enabled with a water-fill
            reveal that swaps the icon for the tool's label. */}
        {BACKGROUND_TOOLS.map(({ Icon, top, left, size, label }, i) => {
          const isHovered = hoveredBg === i;
          return (
            <div
              key={i}
              ref={(el) => {
                bgCardRefs.current[i] = el;
              }}
              onMouseEnter={() => setHoveredBg(i)}
              onMouseLeave={() => setHoveredBg(null)}
              className="absolute rounded-2xl flex items-center justify-center overflow-hidden cursor-pointer"
              style={{
                top,
                left,
                width: size,
                height: size,
                background: "rgba(140,180,255,0.07)",
                border: isHovered
                  ? "1px solid rgba(150,225,255,0.55)"
                  : "1px solid rgba(140,190,255,0.16)",
                boxShadow: isHovered
                  ? "0 0 26px rgba(110,200,255,0.35)"
                  : "0 0 24px rgba(100,180,255,0.06)",
                transition: "border-color 0.4s ease, box-shadow 0.4s ease",
                zIndex: 2,
              }}
            >
              {/* water fill */}
              <div
                className="absolute inset-x-0 bottom-0"
                style={{
                  height: isHovered ? "100%" : "0%",
                  background:
                    "linear-gradient(180deg, rgba(140,235,255,0.92) 0%, rgba(70,140,255,0.92) 100%)",
                  transition: "height 0.55s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
              <Icon
                size={size * 0.42}
                color="rgba(170,210,255,0.65)"
                strokeWidth={1.4}
                style={{
                  position: "relative",
                  zIndex: 1,
                  opacity: isHovered ? 0 : 1,
                  transition: "opacity 0.25s ease",
                }}
              />
              <span
                className="absolute inset-0 flex items-center justify-center text-center px-1"
                style={{
                  fontFamily: "Space Mono, monospace",
                  fontSize: Math.max(8, size * 0.16),
                  fontWeight: 600,
                  color: "#031019",
                  opacity: isHovered ? 1 : 0,
                  transition: "opacity 0.3s ease 0.1s",
                  zIndex: 2,
                }}
              >
                {label}
              </span>
            </div>
          );
        })}

        {/* Feature cards — final settled row, hover-lock interaction.
            Each card is hover enabled with the same water-fill treatment,
            and swaps its body copy for a more specific detail line while
            active. */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 flex gap-3 md:gap-5 px-4 md:px-6 ${
            isMobile ? "flex-col" : "flex-row"
          }`}
          style={{
            top: isMobile ? "56%" : "62%",
            zIndex: 3,
            width: "min(920px, 92vw)",
          }}
        >
          {FEATURE_CARDS.map(({ Icon, title, body, detail }, i) => {
            const isActive = activeIndex === i;
            return (
              <div
                key={title}
                ref={(el) => {
                  featureCardRefs.current[i] = el;
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className="relative rounded-2xl cursor-pointer overflow-hidden"
                style={{
                  flexGrow: isMobile ? undefined : isActive ? 2.4 : 1,
                  flexBasis: isMobile ? "auto" : 0,
                  minWidth: isMobile ? "auto" : 200,
                  width: isMobile ? "100%" : undefined,
                  boxSizing: "border-box",
                  padding: isMobile ? "16px" : "24px",
                  transition: "flex-grow 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
                  background: "rgba(255,255,255,0.035)",
                  border: isActive
                    ? "1px solid rgba(120,190,255,0.45)"
                    : "1px solid rgba(140,190,255,0.14)",
                  boxShadow: isActive
                    ? "0 0 40px rgba(100,180,255,0.22)"
                    : "none",
                }}
              >
                {/* water fill */}
                <div
                  className="absolute inset-x-0 bottom-0"
                  style={{
                    height: isActive ? "100%" : "0%",
                    background:
                      "linear-gradient(180deg, rgba(90,170,255,0.18) 0%, rgba(30,55,115,0.42) 100%)",
                    transition: "height 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
                    zIndex: 0,
                  }}
                />

                <div
                  ref={(el) => {
                    featureTextRefs.current[i] = el;
                  }}
                  style={{ position: "relative", zIndex: 1 }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{
                      background: "rgba(100,220,255,0.12)",
                      border: "1px solid rgba(100,220,255,0.3)",
                    }}
                  >
                    <Icon size={20} color="#9fe7ff" strokeWidth={1.6} />
                  </div>
                  <h3
                    style={{
                      fontFamily: "Orbitron, monospace",
                      fontSize: 16,
                      fontWeight: 600,
                      color: "#eaf6ff",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {title}
                  </h3>
                  <p
                    className="mt-2"
                    style={{
                      fontFamily: "Space Mono, monospace",
                      fontSize: 12.5,
                      lineHeight: 1.6,
                      color: "rgba(190,215,240,0.7)",
                      wordBreak: "break-word",
                    }}
                  >
                    {isActive ? detail : body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
