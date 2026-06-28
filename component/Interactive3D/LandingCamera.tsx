"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { RefObject } from "react";
import * as THREE from "three";

type Props = {
  astronaut: RefObject<THREE.Group | null>;
  progress: number;
};

// =========================
// Tweak these to control the "stars only" intro
// =========================
const REVEAL_START = 0.04; // camera starts swinging toward the astronaut
const REVEAL_END = 0.28;   // camera fully revealed by here

// Static pose during the stars-only phase — pointed away from the
// astronaut/Earth/moon axis (which sits along x=0, z=0) so only
// background stars are in frame.
const STARS_POSITION = new THREE.Vector3(0, 4, 14);
const STARS_LOOK_AT = new THREE.Vector3(40, 12, 30);

export default function LandingCamera({ astronaut, progress }: Props) {
  const { camera } = useThree();

  const desiredPosition = new THREE.Vector3();
  const finalLookAt = new THREE.Vector3();

  useFrame((_, delta) => {
    if (!astronaut.current) return;

    const pos = astronaut.current.position;
    const tilt = THREE.MathUtils.clamp((progress - 0.65) / 0.35, 0, 1);
    const eased = THREE.MathUtils.smoothstep(progress, 0, 1);
    const reveal = THREE.MathUtils.smoothstep(progress, REVEAL_START, REVEAL_END);

    // Tracking shot (same as before)
    desiredPosition.set(
      0,
      THREE.MathUtils.lerp(pos.y + 1.5, pos.y + 5.5, eased),
      THREE.MathUtils.lerp(6, 11, eased),
    );

    finalLookAt.set(0, THREE.MathUtils.lerp(pos.y, pos.y - 10, tilt), 0);

    // Blend in the static starfield pose for the intro
    desiredPosition.lerp(STARS_POSITION, 1 - reveal);
    finalLookAt.lerp(STARS_LOOK_AT, 1 - reveal);

    camera.position.lerp(desiredPosition, 1 - Math.exp(-delta * 5));
    camera.lookAt(finalLookAt);
  });

  return null;
}