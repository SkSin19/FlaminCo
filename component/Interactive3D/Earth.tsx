/* eslint-disable react-hooks/immutability */
"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// =========================
// Tweak these three values
// =========================
const EARTH_POSITION: [number, number, number] = [0, 40, -400];
const EARTH_SCALE = 45;
const ROTATION_SPEED = 0.02;

export default function Earth() {
  const earthRef = useRef<THREE.Group>(null);

  const { scene } = useGLTF("/models/earth.glb");

  const earth = useMemo(() => {
    const clone = scene.clone();

    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
        child.receiveShadow = false;

        if (Array.isArray(child.material)) {
          child.material.forEach((m) => {
            m.side = THREE.FrontSide;
          });
        } else if (child.material) {
          child.material.side = THREE.FrontSide;
        }
      }
    });

    return clone;
  }, [scene]);

  useFrame((_, delta) => {
    if (!earthRef.current) return;

    earthRef.current.rotation.y += delta * ROTATION_SPEED;
  });

  return (
    <group
      ref={earthRef}
      position={EARTH_POSITION}
      rotation={[0.18, 0.45, 0]}
      scale={EARTH_SCALE}
    >
      <primitive object={earth} />

      {/* Atmosphere */}
      <mesh scale={1.08}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial
          color="#73c2ff"
          transparent
          opacity={0.18}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Outer Glow */}
      <mesh scale={1.18}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#4da6ff"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

useGLTF.preload("/models/earth.glb");