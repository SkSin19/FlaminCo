/* eslint-disable react-hooks/purity */
"use client";

import { useMemo, useRef } from "react";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { EXIT_POSITION } from "./ExitPortal";
import { exitProgress } from "./ExitProgress";
import { exitSequence } from "../ExitSequence/ExitSequence";

type Props = {
  progress: number;
};

type Rock = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
};

const RISE_START = 0.72;
const RISE_END = 0.9;
const MAP_SIZE = 500;
const WALL_OFFSET = 245;
const EXIT_POS: [number, number, number] = [
  EXIT_POSITION.x,
  EXIT_POSITION.y,
  EXIT_POSITION.z,
];

// ─── Radial fog shader ────────────────────────────────────────────────────────
// Sits flat on the ground, transparent center → opaque black at edges.
// FOG_INNER: fraction of MAP_SIZE where fog starts (0.0 = dead center)
// FOG_OUTER: fraction where fog is fully opaque (1.0 = exact edge)
const fogVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fogFragmentShader = /* glsl */ `
  uniform vec3  uFogColor;
  uniform float uInner;   // UV radius where fog begins  (e.g. 0.25)
  uniform float uOuter;   // UV radius where fog is full (e.g. 0.50)
  varying vec2  vUv;

  void main() {
    // Distance from center in UV space (0 = center, 0.5 = corner)
    vec2  centered = vUv - 0.5;
    float dist     = length(centered);          // 0 → ~0.707 at corners
    float normDist = dist / 0.5;               // normalise so edge = 1.0

    float alpha = smoothstep(uInner, uOuter, normDist);
    if (alpha < 0.001) discard;

    gl_FragColor = vec4(uFogColor, alpha);
  }
`;

function MoonFog({ size }: { size: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null!);

  const uniforms = useMemo(
    () => ({
      uFogColor: { value: new THREE.Color("#000000") },
      uInner: { value: 0.3 }, // fog starts 30% out from center
      uOuter: { value: 0.5 }, // fully opaque at the edge (UV=0.5)
    }),
    [],
  );

  return (
    // Slightly above ground so it doesn't z-fight with the terrain
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.8, 0]}
      renderOrder={1}
    >
      <planeGeometry args={[size, size, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={fogVertexShader}
        fragmentShader={fogFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        // Render on top of the ground but behind rocks/player
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

export default function Moon({ progress }: Props) {
  const exitRing = useRef<THREE.Mesh>(null);

  const [colorMap, aoMap, displacementMap] = useTexture([
    "/textures/moon/moon_meteor_02_diff_4k.jpg",
    "/textures/moon/moon_meteor_02_ao_4k.jpg",
    "/textures/moon/moon_meteor_02_disp_4k.png",
  ]);

  useFrame((state) => {
    if (!exitRing.current) return;

    const s = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.08;

    exitRing.current.scale.setScalar(s);
  });

  const moonProgress = THREE.MathUtils.smoothstep(
    progress,
    RISE_START,
    RISE_END,
  );
  const moonY = THREE.MathUtils.lerp(-180, 0, moonProgress);

  [colorMap, aoMap, displacementMap].forEach((tex) => {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(30, 30);
  });

  const rocks = useMemo<Rock[]>(() => {
    const arr: Rock[] = [];
    for (let i = 0; i < 120; i++) {
      const x = (Math.random() - 0.5) * 420;
      const z = (Math.random() - 0.5) * 420;
      if (Math.abs(x) < 20 && Math.abs(z) < 20) continue;
      arr.push({
        position: [x, 0.3, z],
        rotation: [
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI,
        ],
        scale: Math.random() * 1.5 + 0.3,
      });
    }
    return arr;
  }, []);

  return (
    <>
      {/* ─── Physics colliders — always at world y=0 ─────────────────────── */}
      <RigidBody type="fixed" colliders={false} position={[0, -0.5, 0]}>
        <CuboidCollider args={[MAP_SIZE / 2, 0.5, MAP_SIZE / 2]} />
      </RigidBody>
      <RigidBody type="fixed" colliders={false} position={[0, 6, -WALL_OFFSET]}>
        <CuboidCollider args={[250, 6, 1]} />
      </RigidBody>
      <RigidBody type="fixed" colliders={false} position={[0, 6, WALL_OFFSET]}>
        <CuboidCollider args={[250, 6, 1]} />
      </RigidBody>
      <RigidBody type="fixed" colliders={false} position={[-WALL_OFFSET, 6, 0]}>
        <CuboidCollider args={[1, 6, 250]} />
      </RigidBody>
      <RigidBody type="fixed" colliders={false} position={[WALL_OFFSET, 6, 0]}>
        <CuboidCollider args={[1, 6, 250]} />
      </RigidBody>

      {/* ─── Visual mesh — animates with moonY ───────────────────────────── */}
      <group position={[0, moonY, 0]}>
        {/* Terrain */}
        <mesh
          receiveShadow
          rotation={[-Math.PI / 2, 0, 0]}
          onUpdate={(self) => {
            self.geometry.setAttribute("uv2", self.geometry.attributes.uv);
          }}
        >
          <planeGeometry args={[MAP_SIZE, MAP_SIZE, 512, 512]} />
          <meshStandardMaterial
            map={colorMap}
            aoMap={aoMap}
            displacementMap={displacementMap}
            displacementScale={0.6}
            metalness={0}
            roughness={1}
          />
        </mesh>

        {/* Radial edge fog — hides the hard boundary of the terrain plane */}
        <MoonFog size={MAP_SIZE} />

        {/* Spawn circle */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <circleGeometry args={[8, 64]} />
          <meshStandardMaterial color="#8c8c8c" />
        </mesh>

        {/* Exit Portal */}
        <mesh
          position={EXIT_POS}
          rotation={[-Math.PI / 2, 0, 0]}
          ref={exitRing}
        >
          <ringGeometry args={[4.5, 5, 64]} />
          <meshBasicMaterial
            color={exitProgress.inside ? "#5c0000" : "#b11f1f"}
            transparent
            opacity={exitSequence.phase === "idle" ? 0.9 : 0}
          />
        </mesh>

        <mesh
          position={[EXIT_POS[0], 0.02, EXIT_POS[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[4.5, 64]} />
          <meshBasicMaterial color={exitProgress.inside ? "#5c0000" : "#b11f1f"} transparent opacity={0.15} />
        </mesh>

        {/* Direction marker */}
        <mesh position={[0, 0.03, -20]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1.2, 32]} />
          <meshBasicMaterial color="#00aaff" side={2} />
        </mesh>

        {/* Rocks */}
        {rocks.map((rock, index) => (
          <mesh
            key={index}
            castShadow
            receiveShadow
            position={rock.position}
            rotation={rock.rotation}
            scale={rock.scale}
          >
            <dodecahedronGeometry args={[0.5, 0]} />
            <meshStandardMaterial color="#666666" roughness={1} />
          </mesh>
        ))}

        <mesh position={[120, 0.02, -80]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.5, 5, 64]} />
          <meshBasicMaterial color="#00ffff" transparent opacity={0.9} />
        </mesh>
      </group>
    </>
  );
}
