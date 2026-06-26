"use client";

import { useKeyboardControls } from "@react-three/drei";
import {
  CapsuleCollider,
  RigidBody,
  RapierRigidBody,
} from "@react-three/rapier";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { playerPosition, playerRotation } from "./PlayerRef";
import Character from "./Character";
import { Controls } from "./Keyboard";
import { playerInput } from "./PlayerInput";

export default function Player() {
  const body = useRef<RapierRigidBody>(null);

  const [, getKeys] = useKeyboardControls<Controls>();

  const velocity = useRef(new THREE.Vector3());

  const SPEED = 4;
  const SPRINT = 7;
  const JUMP = 5;

  useFrame((state) => {
    if (!body.current) return;

    const keys = getKeys();

    const forward = keys.forward || playerInput.moveY > 0;

    const backward = keys.backward || playerInput.moveY < 0;

    const left = keys.left || playerInput.moveX < 0;

    const right = keys.right || playerInput.moveX > 0;

    const jump = keys.jump || playerInput.jump;

    const run = keys.run || playerInput.run;

    const direction = new THREE.Vector3();

    if (forward) direction.z += 1;
    if (backward) direction.z -= 1;
    if (left) direction.x += 1;
    if (right) direction.x -= 1;

    if (direction.lengthSq() > 0) {
      direction.normalize();

      // Camera-relative movement
      const camera = state.camera;

      // Camera forward
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      // Camera right
      const right = new THREE.Vector3();
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0));
      right.normalize();

      const move = new THREE.Vector3();

      // Forward / Back
      move.addScaledVector(forward, direction.z);

      // Left / Right
      move.addScaledVector(right, -direction.x);

      if (move.lengthSq() > 0) {
        move.normalize();
      }

      const speed = run ? SPRINT : SPEED;

      velocity.current.lerp(move.multiplyScalar(speed), 0.15);

      const current = body.current.linvel();

      body.current.setLinvel(
        {
          x: velocity.current.x,
          y: current.y,
          z: velocity.current.z,
        },
        true,
      );

      // Rotate character
      const angle =
        Math.atan2(velocity.current.x, velocity.current.z) + Math.PI;

      body.current.setRotation(
        {
          x: 0,
          y: Math.sin(angle / 2),
          z: 0,
          w: Math.cos(angle / 2),
        },
        true,
      );
    } else {
      velocity.current.lerp(new THREE.Vector3(), 0.2);

      const current = body.current.linvel();

      body.current.setLinvel(
        {
          x: velocity.current.x,
          y: current.y,
          z: velocity.current.z,
        },
        true,
      );
    }

    // Jump
    if (jump) {
      const current = body.current.linvel();

      if (Math.abs(current.y) < 0.05) {
        body.current.setLinvel(
          {
            x: current.x,
            y: JUMP,
            z: current.z,
          },
          true,
        );
      }
    }

    // Update global player transform
    const translation = body.current.translation();

    playerPosition.set(translation.x, translation.y, translation.z);

    playerRotation.set(
      body.current.rotation().x,
      body.current.rotation().y,
      body.current.rotation().z,
      body.current.rotation().w,
    );
  });

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={[0, 1.2, 0]}
      mass={1}
      lockRotations
    >
      <CapsuleCollider args={[0.6, 0.35]} />

      <Character />
    </RigidBody>
  );
}
