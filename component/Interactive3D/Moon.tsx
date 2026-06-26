/* eslint-disable react-hooks/purity */
"use client";

import { useMemo } from "react";
import { RigidBody } from "@react-three/rapier";

type Rock = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
};

export default function Moon() {
  const rocks = useMemo<Rock[]>(() => {
    const arr: Rock[] = [];

    for (let i = 0; i < 120; i++) {
      const x = (Math.random() - 0.5) * 180;
      const z = (Math.random() - 0.5) * 180;

      // Keep the player spawn area clear
      if (Math.abs(x) < 12 && Math.abs(z) < 12) continue;

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
      {/* Ground */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          receiveShadow
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[250, 250]} />

          <meshStandardMaterial
            color="#777777"
            roughness={1}
            metalness={0}
          />
        </mesh>
      </RigidBody>

      {/* Spawn Area */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
      >
        <circleGeometry args={[8, 64]} />

        <meshStandardMaterial
          color="#8c8c8c"
        />
      </mesh>

      {/* Rocks */}
      {rocks.map((rock, index) => (
        <RigidBody
          key={index}
          type="fixed"
          colliders="hull"
        >
          <mesh
            castShadow
            receiveShadow
            position={rock.position}
            rotation={rock.rotation}
            scale={rock.scale}
          >
            <dodecahedronGeometry args={[0.5, 0]} />

            <meshStandardMaterial
              color="#666666"
              roughness={1}
            />
          </mesh>
        </RigidBody>
      ))}

      {/* Direction Marker */}
      <mesh
        position={[0, 0.03, -20]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.8, 1.2, 32]} />

        <meshBasicMaterial
          color="#00aaff"
          side={2}
        />
      </mesh>
    </>
  );
}