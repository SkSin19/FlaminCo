"use client";

import { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Canvas } from "@react-three/fiber";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import Keyboard from "@/component/Interactive3D/Keyboard";
import Scene from "@/component/Interactive3D/Scene";
import ScreenController from "@/component/Interactive3D/ScreenController";
import SpeechBubbles from "@/component/Interactive3D/SpeechBubbles";
import ExitBar from "@/component/Interactive3D/ExitBar";

// Register once at module level, not inside the component
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

export default function Interactive3D() {
  const [progress, setProgress] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const snappedRef = useRef(false);

  const [started, setStarted] = useState(false);
  const startedRef = useRef(started);

  const handleExit = () => {
    setGameActive(false);
    setStarted(false);
    snappedRef.current = false;
    gsap.to(window, {
      scrollTo: {
        y: sectionRef.current!.offsetTop + sectionRef.current!.offsetHeight,
      },
      duration: 1.5,
      ease: "power2.inOut",
    });
  };

  useEffect(() => {
    document.body.style.overflow = gameActive ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [gameActive]);

  useEffect(() => {
    startedRef.current = started;
  }, [started]);

  // Block Space + arrow keys from scrolling the page while the game is active
  useEffect(() => {
    const SCROLL_KEYS = [
      "Space",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
    ];
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

      onUpdate: (self) => {
        if (startedRef.current) return; // once game has started, ignore all scroll-driven progress

        setProgress(self.progress);

        // Snap once when the cinematic is almost finished
        if (self.progress >= 0.98 && !snappedRef.current) {
          snappedRef.current = true;

          setGameActive(true);
          setStarted(true);

          gsap.to(window, {
            scrollTo: {
              y:
                sectionRef.current!.offsetTop +
                sectionRef.current!.offsetHeight -
                window.innerHeight,
            },
            duration: 0.7,
            ease: "power2.out",
          });
        }

        // Reset if user scrolls back up
        if (self.progress < 0.9) {
          snappedRef.current = false;
        }
      },
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
          <Canvas shadows>
            <Scene progress={progress} started={started} onExit={handleExit} />
          </Canvas>
          <ExitBar />

          {/* Speech bubbles — DOM overlay, inside the sticky div so they
              stay pinned to the canvas while scrolling */}
          {showBubbles && <SpeechBubbles progress={progress} />}

          {started && <ScreenController />}
        </div>
      </Keyboard>
    </section>
  );
}
