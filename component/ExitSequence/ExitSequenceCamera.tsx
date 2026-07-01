"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { playerPosition } from "@/component/Interactive3D/PlayerRef";
import { exitSequence } from "@/component/ExitSequence/ExitSequence";

const PAN_DURATION = 4; // seconds — must roughly match text timeline below

export default function ExitSequenceCamera() {
  const { camera } = useThree();
  const elapsed = useRef(0);
  const startPos = useRef(new THREE.Vector3());
  const started = useRef(false);

  useFrame((_, delta) => {
    if (exitSequence.phase !== "panning") return;

    if (!started.current) {
      started.current = true;
      startPos.current.copy(camera.position);
    }

    elapsed.current += delta;
    const t = THREE.MathUtils.clamp(elapsed.current / PAN_DURATION, 0, 1);
    const eased = THREE.MathUtils.smoothstep(t, 0, 1);

    // Pull back and up, keeping player centered underneath
    const offset = new THREE.Vector3(0, 5.5, 10).lerp(
      new THREE.Vector3(0, 40, 65),
      eased,
    );

    const desired = new THREE.Vector3(
      playerPosition.x,
      playerPosition.y,
      playerPosition.z,
    ).add(offset);

    camera.position.lerp(desired, 1 - Math.exp(-delta * 2));
    camera.lookAt(playerPosition.x, playerPosition.y + 1, playerPosition.z);

    if (t >= 1) {
      exitSequence.phase = "done";
    }
  });

  return null;
}