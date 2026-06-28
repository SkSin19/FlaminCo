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

import CinematicAstronaut from "./CinematicAstronaut";
import LandingCamera from "./LandingCamera";

import { Preload } from "@react-three/drei";

type Props = {
  progress: number;
  started: boolean;
  onExit: () => void;
};

export default function Scene({ progress, started, onExit }: Props) {
  const landingRef = useRef<THREE.Group>(null);

  return (
    <>
      <color attach="background" args={["#000000"]} />

      <Lights />

      <Stars />

      <Earth />

      {!started && <CinematicAstronaut ref={landingRef} progress={progress} />}
      {!started && <LandingCamera astronaut={landingRef} progress={progress} />}

      <PhysicsWorld>
        <Moon progress={progress} />

        {started && <Player onExit={onExit} />}
      </PhysicsWorld>

      {started && <ThirdPersonCamera />}
      <Preload all />
    </>
  );
}
