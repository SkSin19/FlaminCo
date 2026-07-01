"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollIndicator() {
  const container = useRef<HTMLDivElement>(null);
  const topLine = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  const bottomLine = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!topLine.current || !bottomLine.current) return;

    const animate = () => {
      gsap.fromTo(
        topLine.current,
        {
          backgroundPosition: "0% 0%",
        },
        {
          backgroundPosition: "0% 100%",
          duration: 1,
          ease: "none",
        },
      );

      gsap.fromTo(
        bottomLine.current,
        {
          backgroundPosition: "0% 100%",
        },
        {
          backgroundPosition: "0% 0%",
          duration: 1,
          ease: "none",
        },
      );
    };

    animate();

    const interval = setInterval(animate, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={container}
      className="
      fixed
      right-[6px]
      top-1/2
      -translate-y-1/2
      z-999
      pointer-events-none
      select-none
      "
    >
      <div
        className="
        flex
        flex-col
        items-center
        gap-6
        "
      >
        {/* Left line */}

        <div
          ref={topLine}
          className="h-16 w-0.5 rounded-full"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,.25) 0%, rgba(255,255,255,.25) 40%, rgba(110,220,255,1) 50%, rgba(255,255,255,.25) 60%, rgba(255,255,255,.25) 100%)",
            backgroundSize: "100% 250%",
            backgroundPosition: "0% 0%",
          }}
        />

        {/* Text */}

        <span
          ref={text}
            className="
            text-white
            uppercase
            tracking-[0.45em]
            text-[10px]
            font-medium
        "
          style={{
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            fontFamily: "Orbitron, monospace",
          }}
        >
          SCROLL
        </span>

        {/* Right line */}

        <div
          ref={bottomLine}
          className="h-16 w-0.5 rounded-full"
          style={{
            background:
              "linear-gradient(to top, rgba(255,255,255,.25) 0%, rgba(255,255,255,.25) 40%, rgba(110,220,255,1) 50%, rgba(255,255,255,.25) 60%, rgba(255,255,255,.25) 100%)",
            backgroundSize: "100% 250%",
            backgroundPosition: "0% 100%",
          }}
        />
      </div>
    </div>
  );
}
