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
import ExitSequenceOverlay from "@/component/ExitSequence/ExitSequenceOverlay";
import { exitSequence } from "@/component/ExitSequence/ExitSequence";
import { exitProgress } from "@/component/Interactive3D/ExitProgress";

type Props = {
  onLanded?: () => void;
  onExited?: () => void;
};
// Register once at module level, not inside the component
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

export default function Interactive3D({ onLanded, onExited }: Props) {
  const [progress, setProgress] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const snappedRef = useRef(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const startedRef = useRef(started);

  // Hard gate: the viewport is not allowed to scroll past this section
  // into About until this is explicitly flipped true. Without it, a fast
  // scroll (wheel fling, trackpad swipe, End key, dragging the scrollbar)
  // can jump straight past the whole 800vh cinematic before the "snap
  // into game" logic below ever gets a chance to catch it — landing the
  // user in About before the astronaut has even landed. It only gets set
  // true once our own code authorizes the hand-off scroll in handleExit,
  // i.e. after the pan-out + exit text has actually finished.
  const canLeaveRef = useRef(false);

  useEffect(() => {
    const unlock = () => {
      canLeaveRef.current = true;
    };

    window.addEventListener("returnToMoon", unlock);

    return () => window.removeEventListener("returnToMoon", unlock);
  }, []);

  const handleExit = () => {
    const overlay = overlayRef.current;
    const section = sectionRef.current;
    if (!overlay || !section) return;

    const tl = gsap.timeline({
      onComplete: () => {
        setGameActive(false);
        setStarted(false);

        exitSequence.phase = "idle";
        exitProgress.inside = false;
        exitProgress.progress = 0;
      },
    });

    tl.to(overlay, {
      opacity: 1,
      duration: 0.6,
      ease: "power2.in",
    });

    tl.call(() => {
      canLeaveRef.current = true;

      onExited?.();

      requestAnimationFrame(() => {
        document.getElementById("about")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });

      setTimeout(() => {
        canLeaveRef.current = false;
      }, 1000);
    });

    tl.to(overlay, {
      opacity: 0,
      duration: 0.9,
      ease: "power2.out",
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

          // Re-lock: if this is a replay (scrolled back up, then down
          // again), the section must be earned again before About is
          // reachable.

          setGameActive(true);
          setStarted(true);
          onLanded?.();

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

      // Fires the instant the scroll position moves past the bottom of
      // this section. If we haven't explicitly authorized a leave (see
      // canLeaveRef above), snap the scroll position back inside instead
      // of letting the user fall through into About. This is what
      // actually prevents skipping the cinematic/game via a fast scroll,
      // regardless of how that scroll happened (wheel, trackpad, keys,
      // scrollbar drag).
      onLeave: (self) => {
        if (canLeaveRef.current) return;

        gsap.to(window, {
          scrollTo: { y: self.end - 2 },
          duration: 0.4,
          ease: "power2.out",
          overwrite: true,
        });
      },

      onEnterBack: (self) => {
        if (!canLeaveRef.current) {
          gsap.to(window, {
            scrollTo: {
              y: self.end - 2,
            },
            duration: 0.35,
            overwrite: true,
            ease: "power2.out",
          });
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
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black pointer-events-none z-[9999]"
        style={{ opacity: 0 }}
      />

      <ExitSequenceOverlay onFinished={handleExit} />

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
