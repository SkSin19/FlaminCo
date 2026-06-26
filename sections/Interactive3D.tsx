"use client";

import { useState } from "react";

import Keyboard from "@/component/Interactive3D/Keyboard";
import Scene from "@/component/Interactive3D/Scene";

import { Canvas } from "@react-three/fiber";

export default function Interactive3D() {
  const [started, setStarted] = useState(false);

  return (
    <section
      id="interactive-3d"
      className="relative h-screen w-full overflow-hidden bg-black"
    >
      <Keyboard>
        <Canvas shadows>
          <Scene gameStarted={started} />
        </Canvas>
      </Keyboard>

      {!started && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-md ">
          <div
            className="
              flex
              w-[90%]
              max-w-2xl
              flex-col
              items-center
              gap-8
              rounded-3xl
              border border-white/10
              bg-white/[0.04]
              px-16
              py-24
              text-center
              backdrop-blur-2xl
              shadow-[0_0_100px_rgba(0,0,0,0.5)]
            "
          >
            <span
              className="
                inline-block
                rounded-full
                border border-white/10
                bg-white/5
                px-5
                py-10
                text-[11px]
                font-medium
                uppercase
                tracking-[0.35em]
                text-cyan-200/80
              "
            >
              Flaminco
            </span>

            <h1 className="text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              Explore Our Universe
            </h1>

            <div className="h-px w-20 bg-linear-to-r from-transparent via-cyan-400/50 to-transparent" />

            <button
              onClick={() => setStarted(true)}
              className="
                group
                relative
                mt-6
                inline-flex
                items-center
                justify-center
                overflow-hidden
                rounded-xl
                border border-white/15
                bg-white
                px-12
                py-5
                text-sm
                font-medium
                uppercase
                tracking-[0.2em]
                text-black

                transition-all
                duration-500

                hover:border-cyan-300/60
                hover:shadow-[0_0_40px_rgba(34,211,238,0.25)]
                active:scale-[0.97]
              "
            >
              <span className="relative z-10">Check Our Works</span>

              <div
                className="
                  absolute
                  inset-0
                  -translate-x-full

                  bg-linear-to-r
                  from-transparent
                  via-cyan-200/40
                  to-transparent

                  transition-transform
                  duration-700

                  group-hover:translate-x-full
                "
              />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}