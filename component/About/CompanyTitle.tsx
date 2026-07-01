"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AboutParticles from "./AboutParticles";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const WORD = "FLAMINCO";

export default function FlaminicoTitle() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const bigRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const smallRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const letters = WORD.split("");
    const setters = bigRefs.current.map((el) =>
      el ? gsap.quickSetter(el, "css") : null,
    );

    let bigRects: DOMRect[] = [];
    let smallRects: DOMRect[] = [];

    const measure = () => {
      // Reset transforms before measuring so rects are the "resting" ones.
      bigRefs.current.forEach(
        (el) => el && gsap.set(el, { clearProps: "transform" }),
      );
      bigRects = bigRefs.current.map((el) => el!.getBoundingClientRect());
      smallRects = smallRefs.current.map((el) => el!.getBoundingClientRect());
    };

    measure();

    const st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "+=1600",
      pin: true,
      scrub: 0.6,
      snap: {
        snapTo: [0, 1],
        duration: { min: 0.2, max: 0.5 },
        ease: "power1.inOut",
      },
      onRefresh: measure,
      onUpdate: (self) => {
        const progress = self.progress;
        const windowSize = 0.55;

        letters.forEach((_, i) => {
          const setter = setters[i];
          const bigRect = bigRects[i];
          const smallRect = smallRects[i];
          if (!setter || !bigRect || !smallRect) return;

          // Each letter gets its own offset window within the scroll range
          // so they peel off toward the corner in sequence.
          const start = (i / letters.length) * (1 - windowSize);
          const end = start + windowSize;
          let t = (progress - start) / (end - start);
          t = Math.max(0, Math.min(1, t));
          const eased = gsap.parseEase("power2.inOut")(t);

          const bigCenterX = bigRect.left + bigRect.width / 2;
          const smallCenterX = smallRect.left + smallRect.width / 2;

          const bigCenterY = bigRect.top + bigRect.height / 2;
          const smallCenterY = smallRect.top + smallRect.height / 2;

          const dx = smallCenterX - bigCenterX;
          const dy = smallCenterY - bigCenterY;

          const scaleTarget = smallRect.width / bigRect.width;
          const scale = 1 + (scaleTarget - 1) * eased;

          setter({
            transform: `translate(${dx * eased}px, ${dy * eased}px) scale(${scale})`,
            opacity: 1,
          });
        });
      },
    });

    window.addEventListener("resize", measure);

    return () => {
      st.kill();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-screen w-full overflow-hidden bg-black"
    >
      <AboutParticles />

      {/* Target position (top-left, small) — invisible, used only to measure
          where each letter should land and to reserve the final layout. */}
      <div
        className="pointer-events-none absolute left-6 top-6 z-10 flex items-center select-none"
        style={{ fontFamily: "Orbitron, monospace", gap: 0 }}
      >
        {WORD.split("").map((ch, i) => (
          <span
            key={i}
            ref={(el) => {
              smallRefs.current[i] = el;
            }}
            className="inline-block text-2xl font-bold text-white opacity-0"
          >
            {ch}
          </span>
        ))}
      </div>

      {/* Big centered letters — these are the ones that actually animate. */}
      <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
        <div className="flex" style={{ fontFamily: "Orbitron, monospace" }}>
          {WORD.split("").map((ch, i) => (
            <span
              key={i}
              ref={(el) => {
                bigRefs.current[i] = el;
              }}
              className="text-white inline-block font-black leading-none"
              style={{
                fontSize: "clamp(3rem, 12vw, 11rem)",
                willChange: "transform",
              }}
            >
              {ch}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
