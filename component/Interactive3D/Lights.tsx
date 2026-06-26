"use client";

export default function Lights() {
  return (
    <>
      {/* Moon Sun */}
      <directionalLight
        castShadow
        intensity={4.5}
        color="#fff8ea"
        position={[25, 30, 15]}
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-near={1}
        shadow-camera-far={150}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-bias={-0.00008}
      />

      {/* Extremely weak ambient */}
      <ambientLight intensity={0.08} color="#1b2236" />

      {/* Earth bounce light */}
      <hemisphereLight
        args={["#6ea8ff", "#0a0a0a", 0.18]}
      />

      {/* Blue rim light */}
      <directionalLight
        intensity={0.45}
        color="#6aa9ff"
        position={[-20, 8, -18]}
      />

      {/* Very faint fill light */}
      <pointLight
        intensity={0.12}
        color="#6e7bff"
        position={[0, 8, 0]}
        distance={80}
      />
    </>
  );
}