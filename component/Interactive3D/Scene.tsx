"use client";

import PhysicsWorld from "./PhysicsWorld";
import Lights from "./Lights";
// import { PostProcessing } from "three/webgpu";
import Earth from "./Earth";
import Moon from "./Moon";
import Stars from "./Stars";
import ThirdPersonCamera from "./ThirdPersonCamera";
import Player from "./Player";

type Props = {
    gameStarted: boolean;
};

export default function Scene({ gameStarted }: Props) {
  return (
    <>
      <color attach="background" args={["#000000"]} />

      <Lights />

      <Stars />

      <Earth />

      <PhysicsWorld>
        <Moon />
        {gameStarted && <Player />}
      </PhysicsWorld>
      <ThirdPersonCamera />

      {/* <PostProcessing /> */}
    </>
  );
}
