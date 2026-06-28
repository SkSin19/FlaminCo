"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import Astronaut from "./Astronaut";

type Props = {
  progress: number;
};

// =========================
// Scroll phase boundaries  (800vh total)
// =========================
// 0.00–0.05  pure stars, astronaut hidden below screen
// 0.05–0.20  astronaut SLOWLY rises from below into center
// 0.20–0.72  astronaut floats gently upward (camera tracks)
// 0.72–0.88  moon rises into view
// 0.82–0.96  astronaut descends to land on moon
export const SLIDE_IN_START = 0.05;
export const SLIDE_IN_END   = 0.20;
export const DESCENT_START  = 0.82;
export const DESCENT_END    = 0.96;

const LandingAstronaut = forwardRef<THREE.Group, Props>(
  function LandingAstronaut({ progress }, ref) {
    const group = useRef<THREE.Group>(null);

    useImperativeHandle(ref, () => group.current!);

    useFrame(() => {
      if (!group.current) return;

      let targetY: number;
      let targetRotY: number;

      if (progress < SLIDE_IN_START) {
        // Far below — invisible
        targetY    = -14;
        targetRotY = 0;
      } else if (progress < SLIDE_IN_END) {
        // Slow rise from below
        const t = THREE.MathUtils.smoothstep(progress, SLIDE_IN_START, SLIDE_IN_END);
        targetY    = THREE.MathUtils.lerp(-14, 2, t);
        targetRotY = 0;
      } else if (progress < DESCENT_START) {
        // Gentle upward drift as scroll advances
        const t = (progress - SLIDE_IN_END) / (DESCENT_START - SLIDE_IN_END);
        targetY    = THREE.MathUtils.lerp(2, 8, t);
        targetRotY = 0;
      } else {
        // Descent onto moon surface
        const t    = THREE.MathUtils.smoothstep(progress, DESCENT_START, DESCENT_END);
        targetY    = THREE.MathUtils.lerp(8, 3, t);
        targetRotY = THREE.MathUtils.lerp(0, Math.PI, t);
      }

      group.current.position.y = targetY;
      group.current.rotation.y = targetRotY;
    });

    return (
      <group ref={group} position={[0, -14, 0]}>
        <Astronaut />
      </group>
    );
  },
);

export default LandingAstronaut;