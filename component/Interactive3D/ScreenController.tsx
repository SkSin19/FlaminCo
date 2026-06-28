"use client";

import { useEffect, useState } from "react";
import { playerInput } from "./PlayerInput";

type Props = {
  onMove?: (x: number, y: number) => void;
  onJump?: (pressed: boolean) => void;
};

export default function ScreenController({ onMove, onJump }: Props) {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const update = () => {
      setMobile(window.innerWidth < 1024);
    };

    update();

    window.addEventListener("resize", update);

    return () => window.removeEventListener("resize", update);
  }, []);

  const pressMove = (x: number, y: number) => {
    playerInput.moveX = x;
    playerInput.moveY = y;

    onMove?.(x, y);
  };

  const stopMove = () => {
    playerInput.moveX = 0;
    playerInput.moveY = 0;

    onMove?.(0, 0);
  };

  return (
    <div
      className={`pointer-events-none absolute bottom-6 z-50 flex w-full items-end justify-center px-6
      ${mobile ? "" : "justify-end"}`}
    >
      <div className="pointer-events-auto flex items-end gap-8">
        {/* Movement Pad */}
        <div className="relative h-44 w-44 rounded-full border border-cyan-400/30 bg-black/30 backdrop-blur-xl shadow-[0_0_35px_rgba(0,255,255,0.18)]">
          {/* UP */}
          <button
            onPointerDown={() => pressMove(0, 1)}
            onPointerUp={stopMove}
            onPointerLeave={stopMove}
            className="absolute left-1/2 top-2 h-14 w-14 -translate-x-1/2 rounded-xl bg-cyan-500/20 text-2xl text-cyan-100 transition active:scale-90"
          >
            ▲
          </button>

          {/* DOWN */}
          <button
            onPointerDown={() => pressMove(0, -1)}
            onPointerUp={stopMove}
            onPointerLeave={stopMove}
            className="absolute bottom-2 left-1/2 h-14 w-14 -translate-x-1/2 rounded-xl bg-cyan-500/20 text-2xl text-cyan-100 transition active:scale-90"
          >
            ▼
          </button>

          {/* LEFT */}
          <button
            onPointerDown={() => pressMove(-1, 0)}
            onPointerUp={stopMove}
            onPointerLeave={stopMove}
            className="absolute left-2 top-1/2 h-14 w-14 -translate-y-1/2 rounded-xl bg-cyan-500/20 text-2xl -rotate-90 text-cyan-100 transition active:scale-90"
          >
            ▲
          </button>

          {/* RIGHT */}
          <button
            onPointerDown={() => pressMove(1, 0)}
            onPointerUp={stopMove}
            onPointerLeave={stopMove}
            className="absolute right-2 top-1/2 h-14 w-14 -translate-y-1/2 rounded-xl rotate-90 bg-cyan-500/20 text-2xl text-cyan-100 transition active:scale-90"
          >
            ▲
          </button>

          <div className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/40 bg-cyan-400/20" />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-5">
          {/* Jump */}
          <button
            onPointerDown={() => {
              playerInput.jump = true;
              onJump?.(true);
            }}
            onPointerUp={() => {
              playerInput.jump = false;
              onJump?.(false);
            }}
            className="h-20 w-20 rounded-full border border-cyan-300/40 bg-cyan-500/20 text-lg font-bold tracking-wider text-white backdrop-blur-xl shadow-[0_0_25px_rgba(0,255,255,0.22)] transition hover:scale-105 active:scale-90"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}