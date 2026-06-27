/* eslint-disable react-hooks/immutability */
"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import { playerInput } from "./PlayerInput";
import { playerPosition } from "./PlayerRef";

const IDLE_OFFSET = new THREE.Vector3(0, 5.5, 10);
const WALK_OFFSET = new THREE.Vector3(0, 6.5, 13);
const RUN_OFFSET = new THREE.Vector3(0, 7.5, 17);

const IDLE_LOOK = new THREE.Vector3(0, 1.0, 0);
const WALK_LOOK = new THREE.Vector3(0, 1.1, 0);
const RUN_LOOK = new THREE.Vector3(0, 1.3, 0);

export default function ThirdPersonCamera() {
  const cameraTarget = useRef(playerPosition.clone());

  const { camera } = useThree((state) => ({
    camera: state.camera as THREE.PerspectiveCamera,
  }));
  const currentOffset = useRef(IDLE_OFFSET.clone());
  const currentLook = useRef(IDLE_LOOK.clone());

  const desiredPosition = useRef(new THREE.Vector3());
  const desiredLook = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const moving =
      Math.abs(playerInput.moveX) > 0 || Math.abs(playerInput.moveY) > 0;

    const targetOffset = playerInput.run
      ? RUN_OFFSET
      : moving
        ? WALK_OFFSET
        : IDLE_OFFSET;

    const targetLook = playerInput.run
      ? RUN_LOOK
      : moving
        ? WALK_LOOK
        : IDLE_LOOK;

    // Smooth spring interpolation
    currentOffset.current.lerp(targetOffset, 1 - Math.exp(-delta * 4.5));

    currentLook.current.lerp(targetLook, 1 - Math.exp(-delta * 5));

    // Only update target if the player has actually moved
    cameraTarget.current.lerp(playerPosition, 1 - Math.exp(-delta * 12));

    desiredPosition.current.copy(cameraTarget.current);
    desiredPosition.current.add(currentOffset.current);

    desiredLook.current.copy(cameraTarget.current).add(currentLook.current);

    camera.position.lerp(desiredPosition.current, 1 - Math.exp(-delta * 6));

    camera.lookAt(desiredLook.current);

    // Wider view while moving
    const targetFov = playerInput.run ? 68 : moving ? 63 : 58;

    camera.fov = THREE.MathUtils.lerp(
      camera.fov,
      targetFov,
      1 - Math.exp(-delta * 5),
    );

    camera.updateProjectionMatrix();
  });

  return null;
}
