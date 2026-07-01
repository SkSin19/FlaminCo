"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const LEFT_LINES = [
  "We build worlds that live",
  "at the edge of imagination —",
  "part story, part simulation,",
  "part playground.",
];

const RIGHT_LINES = [
  "Every pixel is intentional.",
  "Every motion carries weight.",
  "We craft experiences that",
  "invite you to stay a while.",
];

function Box({ lines, align }: { lines: string[]; align: "left" | "right" }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;

    const els = lineRefs.current.filter(Boolean) as HTMLDivElement[];
    gsap.set(els, { yPercent: 120, opacity: 0 });

    const st = ScrollTrigger.create({
      trigger: box,
      start: "top 80%",
      once: true,
      onEnter: () => {
        gsap.to(els, {
          yPercent: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.18,
        });
      },
    });

    return () => st.kill();
  }, []);

  return (
    <div
      ref={boxRef}
      className={`flex flex-col gap-2 ${
        align === "right" ? "items-end text-right" : "items-start text-left"
      }`}
    >
      {lines.map((line, i) => (
        <div key={i} className="overflow-hidden">
          <div
            ref={(el) => {
              lineRefs.current[i] = el;
            }}
            className="text-lg font-light text-white/85 md:text-2xl"
          >
            {line}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AboutContent() {
  return (
    <section className="relative z-30 min-h-screen w-full bg-black px-6 py-32 md:px-16">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-16 md:grid-cols-2">
        <Box lines={LEFT_LINES} align="left" />
        <Box lines={RIGHT_LINES} align="right" />
      </div>
    </section>
  );
}