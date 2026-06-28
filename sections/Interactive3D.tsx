"use client";

import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Canvas } from "@react-three/fiber";

import Keyboard from "@/component/Interactive3D/Keyboard";
import Scene from "@/component/Interactive3D/Scene";
import ScreenController from "@/component/Interactive3D/ScreenController";
import SpeechBubbles from "@/component/Interactive3D/SpeechBubbles";

// Register once at module level, not inside the component
gsap.registerPlugin(ScrollTrigger);

export default function Interactive3D() {
  const [progress, setProgress] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);

  const started = progress >= 0.98;
  const startedRef = useRef(started);
  useEffect(() => {
    startedRef.current = started;
  }, [started]);

  // Block Space + arrow keys from scrolling the page while the game is active
  useEffect(() => {
    const SCROLL_KEYS = ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    const handleKeyDown = (e: KeyboardEvent) => {
      if (startedRef.current && SCROLL_KEYS.includes(e.code)) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => setProgress(self.progress),
    });
    return () => trigger.kill();
  }, []);

  // Speech bubbles only visible during the cinematic (not after landing)
  const showBubbles = progress > 0.18 && progress < 0.66;

  return (
    // 800vh — gives all phases enough breathing room
    <section
      ref={sectionRef}
      id="interactive-3d"
      className="relative h-[800vh] w-full bg-black"
    >
      <Keyboard>
        <div className="sticky top-0 h-screen">
          <Canvas>
            <Scene progress={progress} started={started} />
          </Canvas>

          {/* Speech bubbles — DOM overlay, inside the sticky div so they
              stay pinned to the canvas while scrolling */}
          {showBubbles && <SpeechBubbles progress={progress} />}
        </div>

        {started && <ScreenController />}
      </Keyboard>
    </section>
  );
}