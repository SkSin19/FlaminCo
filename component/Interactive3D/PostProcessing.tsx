// "use client";

// import {
//   EffectComposer,
//   Bloom,
//   Vignette,
//   ChromaticAberration,
//   ToneMapping,
//   Noise,
//   DepthOfField,
// } from "@react-three/postprocessing";

// // import { BlendFunction, ToneMappingMode } from "postprocessing";

// export default function PostProcessing() {
//   return (
//     <EffectComposer multisampling={4}>
//       {/* Bloom for bright highlights */}
//       <Bloom
//         intensity={0.45}
//         luminanceThreshold={0.75}
//         luminanceSmoothing={0.9}
//         mipmapBlur
//       />

//       {/* Slight cinematic depth of field */}
//       <DepthOfField
//         focusDistance={0.015}
//         focalLength={0.025}
//         bokehScale={2}
//         height={480}
//       />

//       {/* Filmic tone mapping */}
//       <ToneMapping
//         mode={ToneMappingMode.ACES_FILMIC}
//       />

//       {/* Very subtle chromatic aberration */}
//       <ChromaticAberration
//         blendFunction={BlendFunction.NORMAL}
//         offset={[0.0003, 0.0003]}
//       />

//       {/* Tiny amount of sensor noise */}
//       <Noise
//         opacity={0.015}
//         premultiply
//       />

//       {/* Darker cinematic edges */}
//       <Vignette
//         eskil={false}
//         offset={0.2}
//         darkness={0.85}
//       />
//     </EffectComposer>
//   );
// }