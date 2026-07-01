/* eslint-disable react-hooks/refs */
"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 1800;
const SPREAD_X = 16;
const SPREAD_Y = 9;

function makeBasePositions() {
  const arr = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    arr[i * 3 + 0] = (Math.random() - 0.5) * SPREAD_X;
    arr[i * 3 + 1] = (Math.random() - 0.5) * SPREAD_Y;
    arr[i * 3 + 2] = (Math.random() - 0.5) * 5 - 1.5;
  }
  return arr;
}

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);

  // Base "resting" positions the particles spring back to. This is
  // read-only after creation, so it's safe to keep as useMemo.
  const basePositions = useMemo(() => makeBasePositions(), []);

  // Live (mutable) positions + velocities, driven every frame inside
  // useFrame. Mutating a useMemo'd value breaks React's purity
  // contract for memoization, so these live in refs instead.
  const positions = useRef<Float32Array>(basePositions.slice());
  const velocities = useRef<Float32Array>(new Float32Array(COUNT * 3));

  const mouseWorld = useRef(new THREE.Vector3(9999, 9999, 0));
  const raycastVec = useRef(new THREE.Vector3());

  useFrame((state) => {
    const { pointer, camera } = state;

    // Project the 2D pointer onto the z=0 plane the particles live near.
    raycastVec.current.set(pointer.x, pointer.y, 0.5).unproject(camera);
    const dir = raycastVec.current.sub(camera.position).normalize();
    const dist = dir.z !== 0 ? (0 - camera.position.z) / dir.z : 0;
    mouseWorld.current.copy(camera.position).add(dir.multiplyScalar(dist));

    const geo = pointsRef.current?.geometry;
    if (!geo) return;
    const posAttr = geo.attributes.position as THREE.BufferAttribute;

    const REPEL_RADIUS = 2.2;
    const REPEL_STRENGTH = 0.05;
    const SPRING = 0.012;
    const DAMPING = 0.9;

    const pos = positions.current;
    const vel = velocities.current;

    for (let i = 0; i < COUNT; i++) {
      const ix = i * 3;
      const bx = basePositions[ix];
      const by = basePositions[ix + 1];

      const px = pos[ix];
      const py = pos[ix + 1];

      const dx = px - mouseWorld.current.x;
      const dy = py - mouseWorld.current.y;
      const dist2 = dx * dx + dy * dy;

      if (dist2 < REPEL_RADIUS * REPEL_RADIUS) {
        const d = Math.sqrt(dist2) || 0.001;
        const force = (1 - d / REPEL_RADIUS) * REPEL_STRENGTH;
        vel[ix] += (dx / d) * force;
        vel[ix + 1] += (dy / d) * force;
      }

      // Spring back toward resting position.
      vel[ix] += (bx - px) * SPRING;
      vel[ix + 1] += (by - py) * SPRING;

      vel[ix] *= DAMPING;
      vel[ix + 1] *= DAMPING;

      pos[ix] += vel[ix];
      pos[ix + 1] += vel[ix + 1];
    }

    posAttr.array.set(pos);
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions.current, 3]}
          count={COUNT}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#8fd8ff"
        transparent
        opacity={0.75}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export default function AboutParticles() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.75]}
      >
        <ParticleField />
      </Canvas>
    </div>
  );
}