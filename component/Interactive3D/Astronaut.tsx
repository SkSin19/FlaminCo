"use client";

import { forwardRef, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const Astronaut = forwardRef<THREE.Group>(function Astronaut(_, ref) {
  const { scene } = useGLTF("/models/astronaut.glb");

  const model = useMemo(() => scene.clone(true), [scene]);

  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    child.castShadow = true;
    child.receiveShadow = true;

    if (child.material instanceof THREE.MeshStandardMaterial) {
      child.material.envMapIntensity = 1.5;
    }
  });

  return (
    <group ref={ref}>
      <primitive object={model} />
    </group>
  );
});

export default Astronaut;

useGLTF.preload("/models/astronaut.glb");