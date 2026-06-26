/* eslint-disable react-hooks/purity */
"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const STAR_COUNT = 12000;
const STAR_RADIUS = 900;

export default function Stars() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3);
    const colors = new Float32Array(STAR_COUNT * 3);

    const colorChoices = [
      new THREE.Color("#ffffff"),
      new THREE.Color("#dbeafe"),
      new THREE.Color("#93c5fd"),
      new THREE.Color("#fef3c7"),
      new THREE.Color("#fde68a"),
    ];

    for (let i = 0; i < STAR_COUNT; i++) {
      const radius = STAR_RADIUS * (0.55 + Math.random() * 0.45);

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() - 0.5) * 2);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);

      positions[i * 3 + 1] = radius * Math.cos(phi);

      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

      const c = colorChoices[Math.floor(Math.random() * colorChoices.length)];

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    return { positions, colors };
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;

    pointsRef.current.rotation.y += delta * 0.002;
    pointsRef.current.rotation.x += delta * 0.00025;
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />

        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>

      <pointsMaterial
        size={1.8}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.95}
        depthWrite={false}
      />
    </points>
  );
}
