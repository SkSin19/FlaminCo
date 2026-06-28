"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { RefObject } from "react";
import * as THREE from "three";

type Props = {
  astronaut: RefObject<THREE.Group | null>;
  progress: number;
};

// =========================
// Phase boundaries — must stay in sync with LandingAstronaut.tsx
// =========================
// 0.00–0.08  STARS ONLY — camera holds on empty space
// 0.08–0.28  SLOW SWING — camera eases from stars pose toward astronaut
// 0.28–0.82  TRACKING — camera follows astronaut center, stars all around
// 0.82–0.96  PULL BACK — camera zooms out, tilts down to reveal moon
const STARS_END     = 0.08;
const REVEAL_END    = 0.28;   // much wider window = much slower swing
const DESCENT_START = 0.82;
const DESCENT_END   = 0.96;

// Stars-only pose — points into an empty quadrant (away from Earth at [0,40,-400])
const STARS_POS    = new THREE.Vector3(0, 2, 10);
const STARS_LOOKAT = new THREE.Vector3(-60, -8, 80);

export default function LandingCamera({ astronaut, progress }: Props) {
  const { camera } = useThree();

  const desiredPos  = useRef(new THREE.Vector3());
  const desiredLook = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (!astronaut.current) return;

    const pos = astronaut.current.position;

    // ── 1. Base tracking position — follows astronaut ─────────────────────────
    const trackPos  = new THREE.Vector3(0, pos.y + 1.5, 6);
    const trackLook = new THREE.Vector3(0, pos.y, 0);

    // ── 2. Pull back during descent to frame astronaut + moon together ─────────
    if (progress > DESCENT_START) {
      const t = THREE.MathUtils.smoothstep(progress, DESCENT_START, DESCENT_END);
      trackPos.z   = THREE.MathUtils.lerp(6, 16, t);
      trackPos.y   = THREE.MathUtils.lerp(pos.y + 1.5, pos.y + 7, t);
      trackLook.y  = THREE.MathUtils.lerp(pos.y, pos.y - 6, t);
    }

    // ── 3. Blend stars pose → tracking — reveal window is wide for slow swing ──
    const reveal = THREE.MathUtils.smoothstep(progress, STARS_END, REVEAL_END);

    desiredPos.current.copy(trackPos).lerp(STARS_POS, 1 - reveal);
    desiredLook.current.copy(trackLook).lerp(STARS_LOOKAT, 1 - reveal);

    // ── 4. Spring — slightly slower (delta * 3.5 instead of 5) for smoothness ──
    const speed = 1 - Math.exp(-delta * 3.5);
    camera.position.lerp(desiredPos.current, speed);
    camera.lookAt(desiredLook.current);
  });

  return null;
}