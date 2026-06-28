"use client";

import { useRef } from "react";
import * as THREE from "three";

import PhysicsWorld from "./PhysicsWorld";
import Lights from "./Lights";
import Earth from "./Earth";
import Moon from "./Moon";
import Stars from "./Stars";
import ThirdPersonCamera from "./ThirdPersonCamera";
import Player from "./Player";

import LandingAstronaut from "./LandingAstronaut";
import LandingCamera from "./LandingCamera";

type Props = {
  progress: number;
  started: boolean;
};

export default function Scene({
  progress,

  started,
}: Props) {
  const landingRef = useRef<THREE.Group>(null);

  return (
    <>
      <color attach="background" args={["#000000"]} />

      <Lights />

      <Stars />

      <Earth />

      {!started && <LandingAstronaut ref={landingRef} progress={progress} />}

      {!started && <LandingCamera astronaut={landingRef} progress={progress} />}

      <PhysicsWorld>
        <Moon progress={progress} />

        {started && <Player />}
      </PhysicsWorld>

      {started && <ThirdPersonCamera />}
    </>
  );
}
