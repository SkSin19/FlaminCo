/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { useAnimations, useFBX } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";

type Props = {
  progress: number;
};

export const SLIDE_IN_START = 0.05;
export const SLIDE_IN_END = 0.2;
export const DESCENT_START = 0.5;
export const DESCENT_END = 0.96;

const IDLE_URL = "/models/animations/astronaut_idle.fbx";
const FALL_URL = "/models/animations/astronaut_fall.fbx";
const FLAT_URL = "/models/animations/astronaut_fallflat.fbx";
const STAND_URL = "/models/animations/astronaut_stand_after_fallflat.fbx";

const CinematicAstronaut = forwardRef<THREE.Group, Props>(
  function CinematicAstronaut({ progress }, ref) {
    const group = useRef<THREE.Group>(null);

    const idleFbx = useFBX(IDLE_URL);
    const fallFbx = useFBX(FALL_URL);
    const flatFbx = useFBX(FLAT_URL);
    const standFbx = useFBX(STAND_URL);

    const character = useMemo(() => {
      const c = clone(idleFbx) as THREE.Group;
      c.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = false;
        }
      });
      return c;
    }, [idleFbx]);
    const clips = useMemo(() => {
      const out: THREE.AnimationClip[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const add = (fbx: any, name: string) => {
        if (fbx.animations?.[0]) {
          const c = fbx.animations[0].clone();
          c.name = name;
          out.push(c);
        }
      };
      add(idleFbx, "idle");
      add(fallFbx, "fall");
      add(flatFbx, "flat");
      add(standFbx, "stand");
      return out;
    }, [idleFbx, fallFbx, flatFbx, standFbx]);

    const { actions } = useAnimations(clips, character);

    const current = useRef("");

    const play = (name: string) => {
      if (current.current === name) return;

      current.current = name;

      Object.values(actions).forEach((a) => a?.fadeOut(0.2));

      const action = actions[name];
      if (!action) return;

      action.reset();

      if (name === "idle" || name === "fall") {
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.clampWhenFinished = false;
      } else {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
      }

      action.fadeIn(0.2).play();
    };

    useEffect(() => {
      play("idle");
    }, [actions]);

    useImperativeHandle(ref, () => group.current!);

    useFrame(() => {
      if (!group.current) return;

      let targetY: number;
      let targetRotY: number;

      if (progress < SLIDE_IN_START) {
        targetY = -14;
        targetRotY = 0;
        play("idle");
      } else if (progress < SLIDE_IN_END) {
        const t = THREE.MathUtils.smoothstep(
          progress,
          SLIDE_IN_START,
          SLIDE_IN_END,
        );
        targetY = THREE.MathUtils.lerp(-14, 2, t);
        targetRotY = 0;
        play("idle");
      } else if (progress < DESCENT_START) {
        const t = (progress - SLIDE_IN_END) / (DESCENT_START - SLIDE_IN_END);
        targetY = THREE.MathUtils.lerp(2, 8, t);
        targetRotY = 0;
        play("idle");
      } else {
        const t = THREE.MathUtils.smoothstep(
          progress,
          DESCENT_START,
          DESCENT_END,
        );

        targetY = THREE.MathUtils.lerp(8, 3, t);
        targetRotY = THREE.MathUtils.lerp(0, Math.PI, t);

        // Still descending → keep falling
        if (targetY > 3.02) {
          play("fall");
        }
        // Just touched the ground
        else if (progress < 0.985) {
          targetY = 3;
          play("flat");
        }
        // Finished lying down → stand up
        else {
          targetY = 3;
          play("stand");
        }
      }

      group.current.position.y = targetY;
      group.current.rotation.y = targetRotY;
    });

    return (
      <group ref={group} position={[0, -14, 0]}>
        <primitive object={character} />
      </group>
    );
  },
);

export default CinematicAstronaut;

useFBX.preload(IDLE_URL);
useFBX.preload(FALL_URL);
useFBX.preload(FLAT_URL);
useFBX.preload(STAND_URL);
