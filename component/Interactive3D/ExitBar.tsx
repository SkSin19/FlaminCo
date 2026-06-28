"use client";

import { useEffect, useState } from "react";
import { exitProgress } from "./ExitProgress";

export default function ExitBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame: number;

    const update = () => {
      setProgress(exitProgress.progress);
      frame = requestAnimationFrame(update);
    };

    update();

    return () => cancelAnimationFrame(frame);
  }, []);

  if (progress <= 0.001) return null;

  return (
    <div className="pointer-events-none absolute left-1/2 top-8 z-50 w-[340px] -translate-x-1/2">
      <div className="h-2 overflow-hidden rounded-full bg-white/15 backdrop-blur">
        <div
          className="h-full rounded-full bg-white transition-[width] duration-75"
          style={{
            width: `${progress * 100}%`,
          }}
        />
      </div>
    </div>
  );
}