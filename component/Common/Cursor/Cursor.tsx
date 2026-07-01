"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export default function Cursor() {
  const cursor = useRef<HTMLDivElement>(null);

  const target = useRef({ x: 0, y: 0 });

  const pos = useRef({ x: 0, y: 0 });

  const vel = useRef({ x: 0, y: 0 });

  const [isTouchDevice, setIsTouchDevice] = useState(true); // default true so it doesn't flash on first paint

  useEffect(() => {
    const check = () => {
      const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
      const smallScreen = window.innerWidth < 1024; // tablets and below
      setIsTouchDevice(coarsePointer || smallScreen);
    };

    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (isTouchDevice) return;

    let frame: number;

    const animate = () => {
      const stiffness = 0.9;
      const damping = 0.52;

      vel.current.x += (target.current.x - pos.current.x) * stiffness;
      vel.current.y += (target.current.y - pos.current.y) * stiffness;

      vel.current.x *= damping;
      vel.current.y *= damping;

      pos.current.x += vel.current.x;
      pos.current.y += vel.current.y;

      const speed = Math.hypot(vel.current.x, vel.current.y);

      const stretch = Math.min(speed * 0.02, 0.35);

      gsap.set(cursor.current, {
        x: pos.current.x,
        y: pos.current.y,
        xPercent: -50,
        yPercent: -50,

        scaleX: 1 + stretch,
        scaleY: 1 - stretch,
      });

      frame = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(frame);
  }, [isTouchDevice]);

  const move = (e: MouseEvent) => {
    target.current.x = e.clientX;
    target.current.y = e.clientY;
  };

  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (isTouchDevice) return;

    const selectors = "button,a,input,textarea,[role='button'],[data-cursor]";

    const elements = document.querySelectorAll(selectors);

    const enter = () => setHover(true);
    const leave = () => setHover(false);

    elements.forEach((el) => {
      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
    });

    return () => {
      elements.forEach((el) => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      });
    };
  }, [isTouchDevice]);
  useEffect(() => {
    if (isTouchDevice) return;

    window.addEventListener("mousemove", move);

    return () => {
      window.removeEventListener("mousemove", move);
    };
  }, [isTouchDevice]);

  if (isTouchDevice) return null;

  return (
    <div
      ref={cursor}
      className="
      fixed
      top-0
      left-0
      pointer-events-none
      z-999999
      -translate-x-1/2
      -translate-y-1/2
      "
    >
      {/* Glow */}

      <div
        className={`
        absolute
        inset-0
        rounded-full
        transition-all
        duration-300
        ${
          hover
            ? "scale-[1.45] opacity-100 blur-sm bg-cyan-400/30"
            : "scale-100 opacity-0"
        }
      `}
      />

      {/* Glass */}

      <div
        className={`
        relative
        rounded-full
        overflow-hidden
        transition-all
        duration-300
        backdrop-blur-xl
        border
        ${hover ? "w-16 h-16 border-cyan-300/60" : "w-12 h-12 border-white/25"}
      `}
        style={{
          background:
            "radial-gradient(circle at 35% 30%, rgba(255,255,255,.18), rgba(255,255,255,.04) 55%, rgba(255,255,255,.015) 100%)",
          boxShadow: hover
            ? "0 0 20px rgba(110,220,255,.45), inset 0 1px 2px rgba(255,255,255,.4)"
            : "inset 0 1px 2px rgba(255,255,255,.35)",
        }}
      >
        {/* Dark rim */}

        <div
          className="
          absolute
          inset-0
          rounded-full
          border
          border-black/20
        "
        />

        {/* Inner refraction */}

        <div
          className="
    absolute
    inset-[14%]
    rounded-full
    backdrop-blur-[0.5px]
  "
          style={{
            background:
              "radial-gradient(circle at center, rgba(255,255,255,0.008) 0%, rgba(255,255,255,0.003) 60%, rgba(255,255,255,0) 100%)",
          }}
        />
      </div>
    </div>
  );
}
