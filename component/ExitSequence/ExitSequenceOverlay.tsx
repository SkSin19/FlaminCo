"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { exitSequence } from "./ExitSequence";

const LINES = ["Mission complete.", "Earth awaits.", "Welcome back."];

type Props = {
  onFinished: () => void;
};

export default function ExitSequenceOverlay({ onFinished }: Props) {
  const [active, setActive] = useState(false);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (exitSequence.phase === "panning" && !active) {
        setActive(true);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [active]);

  useEffect(() => {
    if (!active) return;

    const lines = lineRefs.current.filter(Boolean) as HTMLDivElement[];
    gsap.set(lines, { opacity: 0, y: 20 });

    const tl = gsap.timeline({
      delay: 1.2,
      onComplete: () => {
        exitSequence.phase = "done";

        window.dispatchEvent(new Event("astronautExited"));

        onFinished();
      },
    });

    lines.forEach((el, i) => {
      // Line rises into place...
      tl.to(
        el,
        { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
        i * 1.1,
      );

      const isLast = i === lines.length - 1;

      if (!isLast) {
        // ...then fades before the next one, as before.
        tl.to(
          el,
          { opacity: 0, duration: 0.5, ease: "power1.in" },
          i * 1.1 + 0.9,
        );
      } else {
        // The final line slides all the way up off the top of the
        // screen, handing off visually into the About section below.
        tl.to(
          el,
          {
            y: "-100vh",
            opacity: 0,
            duration: 0.9,
            ease: "power2.in",
          },
          i * 1.1 + 0.9,
        );
      }
    });

    return () => {
      tl.kill();
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 z-9998 flex items-center justify-center pointer-events-none overflow-hidden">
      {LINES.map((line, i) => (
        <div
          key={i}
          ref={(el) => {
            lineRefs.current[i] = el;
          }}
          className="absolute text-center text-white font-bold"
          style={{
            fontFamily: "Orbitron, monospace",
            fontSize: "clamp(28px, 6vw, 64px)",
          }}
        >
          {line}
        </div>
      ))}
    </div>
  );
}
