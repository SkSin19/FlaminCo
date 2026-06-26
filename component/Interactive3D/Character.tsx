"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import * as THREE from "three";

import Astronaut from "./Astronaut";

export type CharacterHandle = {
  object: THREE.Group | null;
};

const Character = forwardRef<CharacterHandle>(function Character(_, ref) {
  const group = useRef<THREE.Group>(null);

  useImperativeHandle(ref, () => ({
    object: group.current,
  }));

  return (
    <group ref={group} rotation={[0, Math.PI, 0]}>
      <Astronaut />
    </group>
  );
});

export default Character;
