"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

import {
  playerPosition,
} from "./PlayerRef";

const CAMERA_HEIGHT = 2;
const CAMERA_DISTANCE = 6;

export default function ThirdPersonCamera() {
  const { camera } = useThree();

  const desiredPosition = useRef(new THREE.Vector3());
  const desiredLook = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const offset = new THREE.Vector3(
        0,
        CAMERA_HEIGHT,
        CAMERA_DISTANCE
        );


    desiredPosition.current
      .copy(playerPosition)
      .add(offset);

    desiredLook.current
      .copy(playerPosition)
      .add(new THREE.Vector3(0, 1.3, 0));

    camera.position.lerp(
      desiredPosition.current,
      1 - Math.exp(-delta * 6)
    );

    camera.lookAt(desiredLook.current);
  });

  return null;
}