/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
// Character.tsx
// Starter Mixamo version (Idle + Run working, jump/fall clips loaded)

"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { useFBX, useAnimations } from "@react-three/drei";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";

export type CharacterHandle = {
  object: THREE.Group | null;
  setMoving: (moving: boolean) => void;
  jump: () => void;
  fall: (cinematic?: boolean) => void;
  land: () => void;
};

const IDLE_URL = "/models/animations/astronaut_idle.fbx";
const RUN_URL = "/models/animations/astronaut_run.fbx";
const JUMP_URL = "/models/animations/astronaut_jump.fbx";
const FALL_URL = "/models/animations/astronaut_fall.fbx";
const FALL_FLAT_URL = "/models/animations/astronaut_fallflat.fbx";
const STAND_URL = "/models/animations/astronaut_stand_after_fallflat.fbx";

const Character = forwardRef<CharacterHandle>(function Character(_, ref) {
  const group = useRef<THREE.Group>(null);

  const idleFbx = useFBX(IDLE_URL);
  const runFbx = useFBX(RUN_URL);
  const jumpFbx = useFBX(JUMP_URL);
  const fallFbx = useFBX(FALL_URL);
  const flatFbx = useFBX(FALL_FLAT_URL);
  const standFbx = useFBX(STAND_URL);

  const character = useMemo(() => clone(idleFbx) as THREE.Group, [idleFbx]);

  const clips = useMemo(() => {
    const c: THREE.AnimationClip[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const add = (fbx: any, name: string) => {
      if (fbx.animations?.[0]) {
        const clip = fbx.animations[0].clone();
        clip.name = name;
        c.push(clip);
      }
    };

    add(idleFbx, "idle");
    add(runFbx, "run");
    add(jumpFbx, "jump");
    add(fallFbx, "fall");
    add(flatFbx, "flat");
    add(standFbx, "stand");

    return c;
  }, [idleFbx, runFbx, jumpFbx, fallFbx, flatFbx, standFbx]);

  const { actions } = useAnimations(clips, character);

  useEffect(() => {
    if (!actions.idle) return;

    actions.idle.reset();
    actions.idle.setLoop(THREE.LoopRepeat, Infinity);
    actions.idle.clampWhenFinished = false;
    actions.idle.fadeIn(0.2).play();
  }, [actions]);

  const moving = useRef(false);
  const currentState = useRef<"idle" | "run" | "jump" | "fall">("idle");
  const cinematicLanding = useRef(false);

  const setMoving = (value: boolean) => {
    if (moving.current === value) return;

    moving.current = value;

    if (currentState.current === "jump" || currentState.current === "fall")
      return;

    if (!actions.idle || !actions.run) return;

    if (value) {
      currentState.current = "run";

      actions.idle.fadeOut(0.2);

      actions.run.reset();
      actions.run.setLoop(THREE.LoopRepeat, Infinity);
      actions.run.clampWhenFinished = false;
      actions.run.fadeIn(0.2).play();
    } else {
      currentState.current = "idle";

      actions.run.fadeOut(0.2);

      actions.idle.reset();
      actions.idle.setLoop(THREE.LoopRepeat, Infinity);
      actions.idle.clampWhenFinished = false;
      actions.idle.fadeIn(0.2).play();
    }
  };
  const jump = () => {
    if (currentState.current === "jump") return;

    currentState.current = "jump";

    actions.run?.fadeOut(0.15);
    actions.idle?.fadeOut(0.15);

    actions.jump?.reset();
    actions.jump?.setLoop(THREE.LoopOnce, 1);
    actions.jump!.clampWhenFinished = true;
    actions.jump?.fadeIn(0.15).play();
  };

  const fall = (cinematic = false) => {
    if (currentState.current === "fall") return;

    cinematicLanding.current = cinematic;
    currentState.current = "fall";

    actions.jump?.fadeOut(0.15);

    actions.fall?.reset();
    actions.fall?.setLoop(THREE.LoopOnce, 1);
    actions.fall!.clampWhenFinished = true;
    actions.fall?.fadeIn(0.15).play();
  };

  const land = () => {
    if (currentState.current !== "jump" && currentState.current !== "fall")
      return;

    actions.fall?.fadeOut(0.15);
    actions.jump?.fadeOut(0.15);

    if (cinematicLanding.current) {
      actions.flat?.reset();
      actions.flat?.setLoop(THREE.LoopOnce, 1);
      actions.flat!.clampWhenFinished = true;
      actions.flat?.fadeIn(0.15).play();

      cinematicLanding.current = false;

      setTimeout(() => {
        actions.flat?.fadeOut(0.15);

        actions.stand?.reset();
        actions.stand?.setLoop(THREE.LoopOnce, 1);
        actions.stand!.clampWhenFinished = true;
        actions.stand?.fadeIn(0.15).play();
      }, actions.flat?.getClip().duration! * 1000);

      return;
    }

    if (moving.current) {
      currentState.current = "run";
      actions.run?.reset();
      actions.run?.setLoop(THREE.LoopRepeat, Infinity);
      actions.run!.clampWhenFinished = false;
      actions.run?.fadeIn(0.15).play();
    } else {
      currentState.current = "idle";
      actions.idle?.reset();
      actions.idle?.setLoop(THREE.LoopRepeat, Infinity);
      actions.idle!.clampWhenFinished = false;
      actions.idle?.fadeIn(0.15).play();
    }
  };

  useImperativeHandle(ref, () => ({
    object: group.current,
    setMoving,
    jump,
    fall,
    land,
  }));

  return (
    <group ref={group} rotation={[0, Math.PI, 0]}>
      <primitive object={character} />
    </group>
  );
});

export default Character;

useFBX.preload(IDLE_URL);
useFBX.preload(RUN_URL);
useFBX.preload(JUMP_URL);
useFBX.preload(FALL_URL);
useFBX.preload(FALL_FLAT_URL);
useFBX.preload(STAND_URL);
