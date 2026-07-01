"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const TRIGGER = 0.92;

export default function ReturnSlider() {
  const sliderRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const dragging = useRef(false);
  const startY = useRef(0);

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const knob = knobRef.current!;
    const slider = sliderRef.current!;
    const overlay = overlayRef.current!;

    const getMax = () => slider.clientHeight - knob.clientHeight;

    const update = (p: number) => {
      p = Math.max(0, Math.min(1, p));

      setProgress(p);

      gsap.set(knob, {
        y: p * getMax(),
      });

      gsap.set(overlay, {
        opacity: p,
      });
    };

    const down = (e: PointerEvent) => {
      dragging.current = true;
      startY.current = e.clientY - progress * getMax();

      knob.setPointerCapture(e.pointerId);
    };

    const move = (e: PointerEvent) => {
      if (!dragging.current) return;

      const y = e.clientY - startY.current;

      update(y / getMax());
    };

    const up = () => {
      dragging.current = false;

      if (progress >= TRIGGER) {
        gsap.to(overlay, {
          opacity: 1,
          duration: 0.4,
          onComplete: () => {
            window.dispatchEvent(new Event("returnToMoon"));
            document
              .getElementById("interactive-3d")
              ?.scrollIntoView({
                behavior: "instant",
                block: "start",
              });

            window.dispatchEvent(new Event("returnToMoon"));

            gsap.to(overlay, {
              opacity: 0,
              duration: 0.8,
            });

            update(0);
          },
        });
      } else {
        gsap.to(knob, {
          y: 0,
          duration: 0.5,
          ease: "power3.out",
        });

        gsap.to(overlay, {
          opacity: 0,
          duration: 0.5,
        });

        setProgress(0);
      }
    };

    knob.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);

    return () => {
      knob.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [progress]);

  return (
    <>
      {/* Fade Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-99998 bg-black pointer-events-none"
        style={{ opacity: 0 }}
      />

      {/* Slider */}
      <div
        ref={sliderRef}
        className="fixed left-5 top-1/2 -translate-y-1/2 z-99999 h-80 w-5 rounded-full bg-white/15 backdrop-blur-md"
      >
        <div
          ref={knobRef}
          className="absolute left-1/2 h-10 w-10 -translate-x-1/2 cursor-grab rounded-full border border-white bg-white active:cursor-grabbing"
        />
      </div>
    </>
  );
}