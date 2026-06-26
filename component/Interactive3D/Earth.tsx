"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

export default function Earth() {
  const earthRef = useRef<THREE.Group>(null);

  // Use the same model from the Hero section
  const { scene } = useGLTF("/models/earth.glb");

  useFrame((_, delta) => {
    if (!earthRef.current) return;

    // Slow realistic rotation
    earthRef.current.rotation.y += delta * 0.035;
  });

  return (
    <group
      ref={earthRef}
      position={[0, 120, -320]}
      rotation={[0.2, 0.4, 0]}
      scale={18}
    >
      <primitive object={scene.clone()} />

      {/* Atmospheric Glow */}
      <mesh scale={1.08}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial
          color="#6bb8ff"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer Glow */}
      <mesh scale={1.18}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial
          color="#4da6ff"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

useGLTF.preload("/models/earth.glb");