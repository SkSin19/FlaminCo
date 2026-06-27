/* eslint-disable react-hooks/purity */
"use client";

import { useMemo } from "react";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

type Rock = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
};

export default function Moon() {
  const [colorMap, aoMap, displacementMap] = useTexture([
    "/textures/moon/moon_04_diff_4k.jpg",
    "/textures/moon/moon_04_ao_4k.jpg",
    "/textures/moon/moon_04_disp_4k.png",
  ]);

  const MAP_SIZE = 500;

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

      // Keep the player spawn area clear
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

  const WALL_OFFSET = 245;
  
  return (
    <>
      {/* Ground */}
      <RigidBody type="fixed" colliders="cuboid">
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
      </RigidBody>

      {/* North Wall */}
      <RigidBody type="fixed" colliders={false} position={[0, 6, -WALL_OFFSET]}>
        <CuboidCollider args={[250, 6, 1]} />
      </RigidBody>

      {/* South Wall */}
      <RigidBody type="fixed" colliders={false} position={[0, 6, WALL_OFFSET]}>
        <CuboidCollider args={[250, 6, 1]} />
      </RigidBody>

      {/* West Wall */}
      <RigidBody type="fixed" colliders={false} position={[-WALL_OFFSET, 6, 0]}>
        <CuboidCollider args={[1, 6, 250]} />
      </RigidBody>

      {/* East Wall */}
      <RigidBody type="fixed" colliders={false} position={[WALL_OFFSET, 6, 0]}>
        <CuboidCollider args={[1, 6, 250]} />
      </RigidBody>

      {/* Spawn Area */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[8, 64]} />

        <meshStandardMaterial color="#8c8c8c" />
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

      {/* Direction Marker */}
      <mesh position={[0, 0.03, -20]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1.2, 32]} />

        <meshBasicMaterial color="#00aaff" side={2} />
      </mesh>
    </>
  );
}
