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
import Character, { CharacterHandle } from "./Character";
import { Controls } from "./Keyboard";
import { playerInput } from "./PlayerInput";
import { EXIT_POSITION } from "./ExitPortal";
import { exitProgress } from "./ExitProgress";

type Props = {
  onExit: () => void;
};

export default function Player({ onExit }: Props) {
  const body = useRef<RapierRigidBody>(null);
  const characterRef = useRef<CharacterHandle>(null);

  const grounded = useRef(false);
  const wasGrounded = useRef(true);

  const [, getKeys] = useKeyboardControls<Controls>();

  const velocity = useRef(new THREE.Vector3());

  // Run feature removed — normal movement now uses the old sprint speed,
  // so the pan-out feel is always the "running" one.
  const SPEED = 7;
  const JUMP = 5;

  const EXIT_POS = EXIT_POSITION;
  const EXIT_RADIUS = 5;

  const insideTime = useRef(0);

  useFrame((state, delta) => {
    if (!body.current) return;

    const keys = getKeys();

    const forward = keys.forward || playerInput.moveY > 0;

    const backward = keys.backward || playerInput.moveY < 0;

    const left = keys.left || playerInput.moveX < 0;

    const right = keys.right || playerInput.moveX > 0;

    const jump = keys.jump || playerInput.jump;

    const direction = new THREE.Vector3();

    if (forward) direction.z += 1;
    if (backward) direction.z -= 1;
    if (left) direction.x += 1;
    if (right) direction.x -= 1;

    const isMoving = direction.lengthSq() > 0;
    characterRef.current?.setMoving(isMoving);

    if (isMoving) {
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

      velocity.current.lerp(move.multiplyScalar(SPEED), 0.15);

      const current = body.current.linvel();

      // Don't overwrite Rapier if we're blocked
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

    const current = body.current.linvel();
    const translation = body.current.translation();

    const isGrounded = Math.abs(current.y) < 0.1 && translation.y <= 1.05;

    if (!isGrounded) {
      if (current.y > 0.4) {
        characterRef.current?.jump();
      } else {
        characterRef.current?.fall();
      }
    } else if (!wasGrounded.current) {
      characterRef.current?.land();
    }

    wasGrounded.current = isGrounded;

    // Jump
    if (jump) {
      const current = body.current.linvel();
      const translation = body.current.translation();

      grounded.current = Math.abs(current.y) < 0.1 && translation.y <= 1.05;

      if (jump && grounded.current) {
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

    playerPosition.set(translation.x, translation.y, translation.z);
    playerRotation.set(
      body.current.rotation().x,
      body.current.rotation().y,
      body.current.rotation().z,
      body.current.rotation().w,
    );

    const dist = playerPosition.distanceTo(EXIT_POS);

    if (dist < EXIT_RADIUS) {
      insideTime.current += delta;

      exitProgress.inside = true;
      exitProgress.progress = Math.min(insideTime.current / 3, 1);

      if (insideTime.current >= 3) {
        insideTime.current = -999;
        onExit();
      }
    } else {
      insideTime.current = Math.max(insideTime.current - delta * 1.4, 0);

      exitProgress.progress = insideTime.current / 3;
      exitProgress.inside = false;
    }
  });

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={[0, 0.95, 0]}
      mass={1}
      lockRotations
    >
      <CapsuleCollider args={[0.6, 0.35]} />

      <Character ref={characterRef} />
    </RigidBody>
  );
}
