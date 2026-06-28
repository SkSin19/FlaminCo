"use client";

import { useRef, useState } from "react";
import { useEffect } from "react";
import Keyboard from "@/component/Interactive3D/Keyboard";
import Scene from "@/component/Interactive3D/Scene";
import ScreenController from "@/component/Interactive3D/ScreenController";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { Canvas } from "@react-three/fiber";

export default function Interactive3D() {
  const [started, setStarted] = useState(false);

  const [progress, setProgress] = useState(0);

  const sectionRef = useRef<HTMLDivElement>(null);

  gsap.registerPlugin(ScrollTrigger);

  useEffect(() => {
    ScrollTrigger.create({
      trigger: sectionRef.current,

      start: "top top",

      end: "bottom bottom",

      scrub: true,

      onUpdate: (self) => {
        setProgress(self.progress);
      },
    });
  }, []);

  return (
    <section
      ref={sectionRef}
      id="interactive-3d"
      className="relative h-[500vh] w-full overflow-hidden bg-black"
    >
      <div className="fixed top-5 left-5 z-99999 text-white text-5xl">
        {progress.toFixed(2)}
      </div>
      <Keyboard>
        <div className="sticky top-0 h-screen">
          <Canvas>
            <Scene progress={progress} started={progress > 0.98} />
          </Canvas>
        </div>

        {progress > 0.98 && <ScreenController />}
      </Keyboard>
    </section>
  );
}
