"use client";

import { useEffect, useRef, useState } from "react";
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
import { exitSequence } from "../ExitSequence/ExitSequence";
import ExitSequenceCamera from "../ExitSequence/ExitSequenceCamera";


type Props = {
  progress: number;
  started: boolean;
  onExit: () => void;
};

export default function Scene({ progress, started, onExit }: Props) {
  const landingRef = useRef<THREE.Group>(null);
  const [exitPhase, setExitPhase] = useState(exitSequence.phase);

  useEffect(() => {
    const interval = setInterval(() => {
      setExitPhase((prev) =>
        prev !== exitSequence.phase ? exitSequence.phase : prev,
      );
    }, 100);
    return () => clearInterval(interval);
  }, []);

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
      {started && exitPhase === "idle" && <ThirdPersonCamera />}
      {started && exitPhase !== "idle" && <ExitSequenceCamera />}
      <Preload all />
    </>
  );
}
