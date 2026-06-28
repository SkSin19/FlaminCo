"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import Astronaut from "./Astronaut";

type Props = {
  progress: number;
};

// =========================
// Tweak these two values
// =========================
const FALL_START = 0;    // begin falling right at 0vh
const FALL_END = 0.95;   // finish descent just before "started" mode kicks in

const LandingAstronaut = forwardRef<THREE.Group, Props>(
  function LandingAstronaut({ progress }, ref) {
    const group = useRef<THREE.Group>(null);

    useImperativeHandle(ref, () => group.current!);

    useFrame(() => {
      if (!group.current) return;

      const astronautProgress = THREE.MathUtils.smoothstep(
        progress,
        FALL_START,
        FALL_END,
      );
      group.current.position.y = THREE.MathUtils.lerp(22, 3, astronautProgress);

      group.current.rotation.y = THREE.MathUtils.lerp(
        0,
        Math.PI,
        astronautProgress,
      );
    });

    return (
      <group ref={group}>
        <Astronaut />
      </group>
    );
  },
);

export default LandingAstronaut;