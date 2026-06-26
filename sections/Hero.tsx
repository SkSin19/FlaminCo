"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────────────────────────────────────
   STARFIELD HOOK
───────────────────────────────────────────────────────────────────────────── */
function useStarfield(
  ref: React.RefObject<HTMLCanvasElement | null>,
  isVisibleRef: React.RefObject<boolean>,
) {
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    type Star = {
      x: number;
      y: number;
      r: number;
      twinkleSpeed: number;
      twinkleOffset: number;
      color: string;
    };

    let stars: Star[] = [];
    let bgCache: HTMLCanvasElement | null = null;
    let W = 0,
      H = 0,
      frame = 0,
      raf = 0;

    const buildBgCache = () => {
      bgCache = document.createElement("canvas");
      bgCache.width = W;
      bgCache.height = H;
      const bctx = bgCache.getContext("2d")!;

      const bg = bctx.createRadialGradient(
        W * 0.5,
        H * 0.3,
        0,
        W * 0.5,
        H * 0.3,
        W,
      );
      bg.addColorStop(0, "#060a18");
      bg.addColorStop(0.4, "#020510");
      bg.addColorStop(1, "#000003");
      bctx.fillStyle = bg;
      bctx.fillRect(0, 0, W, H);

      [
        [W * 0.15, H * 0.18, W * 0.38, "rgba(38,12,95,0.24)"],
        [W * 0.85, H * 0.42, W * 0.42, "rgba(10,28,82,0.2)"],
        [W * 0.5, H * 0.78, W * 0.52, "rgba(15,8,52,0.16)"],
        [W * 0.3, H * 0.6, W * 0.3, "rgba(20,5,60,0.12)"],
      ].forEach(([nx, ny, nr, nc]) => {
        const n = bctx.createRadialGradient(+nx, +ny, 0, +nx, +ny, +nr);
        n.addColorStop(0, nc as string);
        n.addColorStop(1, "transparent");
        bctx.fillStyle = n;
        bctx.fillRect(0, 0, W, H);
      });
    };

    const init = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      // Fewer stars for perf
      const count = Math.min(Math.floor((W * H) / 900), 800);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.6 + 0.1,
        twinkleSpeed: 0.003 + Math.random() * 0.015,
        twinkleOffset: Math.random() * Math.PI * 2,
        color:
          Math.random() > 0.88
            ? Math.random() > 0.5
              ? "#aaddff"
              : "#ffd0aa"
            : "#ffffff",
      }));
      buildBgCache();
    };

    // Throttle starfield to ~24fps — twinkling doesn't need 60fps
    const STAR_INTERVAL = 1000 / 24;
    let lastStarTime = 0;

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!isVisibleRef.current) return;
      if (now - lastStarTime < STAR_INTERVAL) return;
      lastStarTime = now;

      ctx.clearRect(0, 0, W, H);
      if (bgCache) ctx.drawImage(bgCache, 0, 0);

      for (const s of stars) {
        const tw =
          0.28 +
          0.72 *
            (0.5 + 0.5 * Math.sin(frame * s.twinkleSpeed + s.twinkleOffset));
        ctx.globalAlpha = tw;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.r > 1.2) {
          ctx.globalAlpha = tw * 0.3;
          ctx.strokeStyle = s.color;
          ctx.lineWidth = 0.5;
          const sp = s.r * 4.5;
          ctx.beginPath();
          ctx.moveTo(s.x - sp, s.y);
          ctx.lineTo(s.x + sp, s.y);
          ctx.moveTo(s.x, s.y - sp);
          ctx.lineTo(s.x, s.y + sp);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      frame++;
    };

    window.addEventListener("resize", init);
    init();
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", init);
    };
  }, [ref, isVisibleRef]);
}

/* ─────────────────────────────────────────────────────────────────────────────
   HERO COMPONENT
───────────────────────────────────────────────────────────────────────────── */
export default function Hero() {
  const bgRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<HTMLCanvasElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(true);

  useStarfield(bgRef, isVisibleRef);

  useEffect(() => {
    if (!glRef.current || !heroRef.current) return;

    const W = window.innerWidth;
    const H = window.innerHeight;
    const isDesktop = W >= 1024;

    /* ── Renderer ──────────────────────────────────────────────────────── */
    const renderer = new THREE.WebGLRenderer({
      canvas: glRef.current,
      alpha: true,
      antialias: W > 1200, // disable AA on smaller screens for perf
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(0.75);
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = false;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 1000);
    camera.position.set(0, 2, 10);
    camera.lookAt(0, 0, 0);

    /* ── Post-processing ───────────────────────────────────────────────── */
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(W * 0.5, H * 0.5),
      0.35,
      0.55,
      0.82,
    );
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    /* ── Lighting ──────────────────────────────────────────────────────── */
    const sunLight = new THREE.DirectionalLight(0xfff8e7, 3.5);
    sunLight.position.set(8, 5, 6);
    sunLight.castShadow = false;
    scene.add(sunLight);
    scene.add(new THREE.AmbientLight(0x0d1a3a, 1.2));
    const earthshine = new THREE.DirectionalLight(0x2255aa, 0.6);
    earthshine.position.set(-6, -3, -4);
    scene.add(earthshine);
    const fillLight = new THREE.PointLight(0x112244, 0.8, 20);
    fillLight.position.set(0, -6, 3);
    scene.add(fillLight);

    /* ── Loaders ───────────────────────────────────────────────────────── */
    const gltfLoader = new GLTFLoader();

    /* ── Scene state ───────────────────────────────────────────────────── */
    let earthGroup: THREE.Group | null = null;
    let shipGroup: THREE.Group | null = null;
    let earthMixer: THREE.AnimationMixer | null = null;
    let shipMixer: THREE.AnimationMixer | null = null;
    let scrollProgress = 0;

    // Earth scale constants
    // Starts huge (fills viewport feel), shrinks to the normal target by scroll 0.45
    const EARTH_SCALE_START = isDesktop ? 22 : 16;
    const EARTH_SCALE_END = isDesktop ? 14 : 7.5;

    // Earth Y position constants — starts centred (big), drops down as it shrinks
    const EARTH_Y_START = -7; // centred on screen when huge
    const EARTH_Y_END = -4.2; // normal resting position once small

    // We store the normalised-to-1 scale factor separately from the group scale
    let earthNormScale = 1.0; // scale factor from box normalisation (set on load)

    /* ── LOAD EARTH ────────────────────────────────────────────────────── */
    gltfLoader.load(
      "/models/earth.glb",

      (gltf) => {
        earthGroup = gltf.scene;

        earthGroup.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          child.castShadow = false;
          child.receiveShadow = false;
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.envMapIntensity = 1.4;
            child.material.roughness = Math.min(child.material.roughness, 0.75);
            child.material.needsUpdate = true;
          }
          if (child.material instanceof THREE.MeshPhongMaterial) {
            child.material.shininess = 40;
            child.material.needsUpdate = true;
          }
        });

        // Normalise: compute per-unit scale so we can drive size via a scalar
        const box = new THREE.Box3().setFromObject(earthGroup);
        const size = box.getSize(new THREE.Vector3()).length();

        // earthNormScale = scale needed to make it 1 unit — we multiply by
        // the desired diameter each frame
        earthNormScale = 1.0 / size;

        // Apply starting (huge) scale
        const initScale = EARTH_SCALE_START * earthNormScale;
        earthGroup.scale.setScalar(initScale);

        // Centre pivot
        const centred = box
          .getCenter(new THREE.Vector3())
          .multiplyScalar(-initScale);
        earthGroup.position.copy(centred);
        earthGroup.position.y = EARTH_Y_START;
        earthGroup.position.z = -1;
        earthGroup.rotation.z = 0.1;

        let triangles = 0;
        let meshes = 0;

        earthGroup.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            meshes++;

            const g = child.geometry;

            triangles += g.index
              ? g.index.count / 3
              : g.attributes.position.count / 3;
          }
        });

        console.log("Meshes:", meshes);
        console.log("Triangles:", triangles);

        scene.add(earthGroup);

        if (gltf.animations.length) {
          earthMixer = new THREE.AnimationMixer(earthGroup);
          gltf.animations.forEach((clip) =>
            earthMixer!.clipAction(clip).play(),
          );
        }
      },
      undefined,
      (err) => console.error("Earth load error:", err),
    );

    /* ── LOAD SPACESHIP ────────────────────────────────────────────────── */
    gltfLoader.load(
      "/models/space-shuttle.glb",
      (gltf) => {
        shipGroup = gltf.scene;

        shipGroup.traverse((child) => {
          if (!(child instanceof THREE.Mesh)) return;
          child.castShadow = false;
          child.receiveShadow = false;
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.envMapIntensity = 2.0;
            child.material.metalness = Math.max(child.material.metalness, 0.6);
            child.material.roughness = Math.min(child.material.roughness, 0.4);
            child.material.needsUpdate = true;
          }
        });

        const box = new THREE.Box3().setFromObject(shipGroup);
        const size = box.getSize(new THREE.Vector3()).length();
        const TARGET = 5;
        const scale = TARGET / size;
        shipGroup.scale.setScalar(scale);

        const centred = box
          .getCenter(new THREE.Vector3())
          .multiplyScalar(-scale);
        shipGroup.position.copy(centred);

        // Ship starts far below — it will rise as Earth shrinks (scroll 0→0.45)
        // and land at its final position (y=1.8) exactly when Earth finishes shrinking
        shipGroup.position.y = -18;
        shipGroup.position.x = 0.4;
        shipGroup.position.z = 2.5;
        shipGroup.rotation.x = Math.PI; // nose up

        scene.add(shipGroup);

        if (gltf.animations.length) {
          shipMixer = new THREE.AnimationMixer(shipGroup);
          gltf.animations.forEach((clip) => shipMixer!.clipAction(clip).play());
        }

        setupGSAP();
      },
      undefined,
      (err) => console.error("Ship load error:", err),
    );

    /* ── ENVIRONMENT MAP ───────────────────────────────────────────────── */
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x000008);
    const envTexture = pmremGenerator.fromScene(envScene).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();

    /* ── GSAP SCROLL SETUP ─────────────────────────────────────────────── */
    function setupGSAP() {
      if (!shipGroup || !heroRef.current) return;

      // Proxy objects for GSAP — we read these in the render loop
      // Phase 1 (scroll 0 → 0.45): Earth shrinks, ship rises simultaneously
      //   Earth: EARTH_SCALE_START → EARTH_SCALE_END  (driven via earthProxy.diameter)
      //   Earth Y: EARTH_Y_START → EARTH_Y_END
      //   Ship Y: -18 → 1.8  (arrives at its hover position)
      //
      // Phase 2 (scroll 0.55 → 0.85): ship exits upward, text fades
      //   Ship Y: 1.8 → 14

      const earthProxy = { diameter: EARTH_SCALE_START, posY: EARTH_Y_START };
      const shipProxy = { y: -18, x: 0.4 };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 2.0, // slightly higher scrub = smoother feel
          onUpdate: (self) => {
            scrollProgress = self.progress;
          },
        },
      });

      // ── Phase 1: Earth shrinks + ship rises (0 → 0.45) ──────────────
      tl.to(
        earthProxy,
        {
          diameter: EARTH_SCALE_END,
          posY: EARTH_Y_END,
          ease: "power2.inOut",
          duration: 0.45,
          onUpdate: () => {
            if (!earthGroup) return;
            const s = earthProxy.diameter * earthNormScale;
            earthGroup.scale.setScalar(s);
            earthGroup.position.y = earthProxy.posY;
          },
        },
        0,
      )

        .to(
          shipProxy,
          {
            y: 1.8,
            x: 0,
            ease: "power2.inOut",
            duration: 0.45,
            onUpdate: () => {
              if (shipGroup) {
                shipGroup.position.y = shipProxy.y;
                shipGroup.position.x = shipProxy.x;
              }
            },
          },
          0, // starts at same time as Earth shrink
        )

        // Camera gentle pull-back as Earth fills screen, then settles
        .to(
          camera.position,
          { z: 9.2, ease: "power1.inOut", duration: 0.45 },
          0,
        )

        // ── Text reveals after Earth has settled (0.42 → 0.65) ──────────
        .to(
          "#h-eyebrow",
          { opacity: 1, y: 0, ease: "power3.out", duration: 0.14 },
          0.42,
        )
        .to(
          "#h-title",
          { opacity: 1, y: 0, ease: "power3.out", duration: 0.18 },
          0.48,
        )
        .to(
          "#h-sub",
          { opacity: 1, y: 0, ease: "power3.out", duration: 0.14 },
          0.55,
        )
        .to(
          "#h-cta",
          { opacity: 1, y: 0, ease: "power3.out", duration: 0.14 },
          0.61,
        )

        // ── Phase 2: ship exits upward (0.72 → 1.0) ─────────────────────
        .to(
          shipProxy,
          {
            y: 14,
            ease: "power2.in",
            duration: 0.28,
            onUpdate: () => {
              if (shipGroup) shipGroup.position.y = shipProxy.y;
            },
          },
          0.72,
        )
        .to(
          ["#h-eyebrow", "#h-title", "#h-sub", "#h-cta"],
          {
            opacity: 0,
            y: -28,
            stagger: 0.03,
            ease: "power2.in",
            duration: 0.16,
          },
          0.74,
        );

      // Scroll indicator
      gsap.to("#h-scroll", {
        opacity: 1,
        delay: 1.4,
        duration: 0.9,
        ease: "power2.out",
      });
      ScrollTrigger.create({
        trigger: heroRef.current,
        start: "top+=60 top",
        onEnter: () => gsap.to("#h-scroll", { opacity: 0, duration: 0.4 }),
        onLeaveBack: () => gsap.to("#h-scroll", { opacity: 1, duration: 0.4 }),
      });
    }

    /* ── THRUSTER PLUME ────────────────────────────────────────────────── */
    // Reduced particle count for perf
    const PLUME_COUNT = 60;
    const pPos = new Float32Array(PLUME_COUNT * 3);
    for (let i = 0; i < PLUME_COUNT; i++) {
      const t = Math.random();
      const sp = t * 0.16;
      pPos[i * 3] = (Math.random() - 0.5) * sp;
      pPos[i * 3 + 1] = -t * 1.8;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * sp;
    }
    const plumeGeo = new THREE.BufferGeometry();
    plumeGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const plumeMat = new THREE.PointsMaterial({
      color: 0x88ccff,
      size: 0.055,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const plumePoints = new THREE.Points(plumeGeo, plumeMat);

    const INNER_COUNT = 20;
    const innerPos = new Float32Array(INNER_COUNT * 3);
    for (let i = 0; i < INNER_COUNT; i++) {
      const t = Math.random() * 0.55;
      innerPos[i * 3] = (Math.random() - 0.5) * 0.04;
      innerPos[i * 3 + 1] = -t * 0.7;
      innerPos[i * 3 + 2] = (Math.random() - 0.5) * 0.04;
    }
    const innerGeo = new THREE.BufferGeometry();
    innerGeo.setAttribute("position", new THREE.BufferAttribute(innerPos, 3));
    const innerMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.036,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const innerPoints = new THREE.Points(innerGeo, innerMat);

    const plumeGroup = new THREE.Group();
    plumeGroup.add(plumePoints, innerPoints);
    plumeGroup.visible = false;
    scene.add(plumeGroup);

    /* ── RENDER LOOP ───────────────────────────────────────────────────── */
    const clock = new THREE.Clock();
    let raf = 0;
    // Frame-rate limiter: target 45fps max to spare the GPU
    const TARGET_FPS = 45;
    const FRAME_MS = 1000 / TARGET_FPS;
    let lastRenderTime = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!isVisibleRef.current) return;

      // Throttle: skip frame if not enough time has passed
      if (now - lastRenderTime < FRAME_MS) return;
      lastRenderTime = now;

      const t = clock.getElapsedTime();
      const dt = Math.min(clock.getDelta(), 0.05); // clamp large deltas

      // Earth slow rotation — unchanged by scroll phase
      if (earthGroup) {
        let earthRotVel = 0;

        earthRotVel += 0.00003;
        earthRotVel *= 0.985;

        earthGroup.rotation.y += earthRotVel;
        earthGroup.rotation.z = 0.1 + Math.sin(t * 0.18) * 0.01;
      }
      if (earthMixer) earthMixer.update(dt);

      // Ship hover + plume
      if (shipGroup) {
        const isMidFlight = scrollProgress > 0.02 && scrollProgress < 0.72;
        if (!isMidFlight) {
          shipGroup.rotation.z = Math.sin(t * 0.9) * 0.04;
          shipGroup.position.y += Math.sin(t * 0.85) * 0.0006;
        } else {
          shipGroup.rotation.z += (0 - shipGroup.rotation.z) * 0.06;
        }
        shipGroup.rotation.x = Math.sin(t * 0.55) * 0.016;

        plumeGroup.visible = true;
        plumeGroup.position.set(
          shipGroup.position.x,
          shipGroup.position.y - 0.85,
          shipGroup.position.z,
        );
      }
      if (shipMixer) shipMixer.update(dt);

      // Animate plume
      const pp = plumeGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < PLUME_COUNT; i++) {
        const k = i * 3;
        pp[k + 1] -= 0.016;
        if (pp[k + 1] < -2.0) {
          const tt = Math.random() * 0.12;
          pp[k] = (Math.random() - 0.5) * tt * 0.08;
          pp[k + 1] = 0;
          pp[k + 2] = (Math.random() - 0.5) * tt * 0.08;
        }
        pp[k] *= 1.008;
        pp[k + 2] *= 1.008;
      }
      plumeGeo.attributes.position.needsUpdate = true;
      plumeMat.opacity = 0.5 + Math.sin(t * 4.0) * 0.2;

      const ip = innerGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < INNER_COUNT; i++) {
        const k = i * 3;
        ip[k + 1] -= 0.028;
        if (ip[k + 1] < -0.75) {
          ip[k] = (Math.random() - 0.5) * 0.038;
          ip[k + 1] = 0;
          ip[k + 2] = (Math.random() - 0.5) * 0.038;
        }
      }
      innerGeo.attributes.position.needsUpdate = true;
      innerMat.opacity = 0.85 + Math.sin(t * 6.5) * 0.1;

      bloomPass.strength = 0.3 + scrollProgress * 0.22;

      renderer.render(scene, camera);
    };

    raf = requestAnimationFrame(tick);

    /* ── VISIBILITY OBSERVER ───────────────────────────────────────────── */
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    observer.observe(heroRef.current);

    /* ── RESIZE ────────────────────────────────────────────────────────── */
    const onResize = () => {
      const w = window.innerWidth,
        h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
      bloomPass.setSize(w * 0.5, h * 0.5);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      observer.disconnect();
      renderer.dispose();
      composer.dispose();
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  /* ── JSX ───────────────────────────────────────────────────────────── */
  return (
    <div ref={heroRef} className="relative" style={{ height: "400vh" }}>
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Starfield */}
        <canvas
          ref={bgRef}
          className="absolute inset-0 w-full h-full"
          style={{ zIndex: 0 }}
        />

        {/* Three.js */}
        <canvas
          ref={glRef}
          className="absolute inset-0 w-full h-full"
          style={{ zIndex: 1 }}
        />

        {/* Hero copy */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none"
          style={{ zIndex: 2 }}
        >
          <p
            id="h-eyebrow"
            className="text-[11px] tracking-[0.45em] uppercase mb-4"
            style={{
              fontFamily: "Orbitron, monospace",
              color: "rgba(100,220,255,0.72)",
              opacity: 0,
              transform: "translateY(40px)",
            }}
          >
            Beyond the known frontier
          </p>

          <h1
            id="h-title"
            className="text-center font-black leading-[1.06]"
            style={{
              fontFamily: "Orbitron, monospace",
              fontSize: "clamp(30px, 6vw, 78px)",
              letterSpacing: "1px",
              textShadow: "0 0 70px rgba(100,180,255,0.28)",
              opacity: 0,
              transform: "translateY(60px)",
            }}
          >
            Feel the
            <span className="block text-gradient">Digital Experience</span>
          </h1>

          <p
            id="h-sub"
            className="text-center mt-5 tracking-[0.22em] uppercase"
            style={{
              fontFamily: "Space Mono, monospace",
              fontSize: "clamp(10px, 1.2vw, 13px)",
              color: "rgba(175,215,255,0.52)",
              opacity: 0,
              transform: "translateY(38px)",
            }}
          >
            Mission control · Deep space navigation · 2047
          </p>

          <div
            id="h-cta"
            className="mt-9 pointer-events-auto"
            style={{ opacity: 0, transform: "translateY(28px)" }}
          >
            <button
              className="clip-cta group relative overflow-hidden border px-10 py-3.5
                         text-[10px] tracking-[0.38em] uppercase transition-colors duration-300
                         hover:bg-[rgba(100,220,255,0.06)]"
              style={{
                fontFamily: "Orbitron, monospace",
                color: "#64dcff",
                borderColor: "rgba(100,220,255,0.35)",
              }}
              onMouseEnter={(e) => {
                const b = e.currentTarget;
                b.style.borderColor = "rgba(100,220,255,0.85)";
                b.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                const b = e.currentTarget;
                b.style.borderColor = "rgba(100,220,255,0.35)";
                b.style.color = "#64dcff";
              }}
            >
              <span
                className="absolute inset-0 -translate-x-full
                           bg-linear-to-r from-transparent via-[rgba(100,220,255,0.07)] to-transparent
                           group-hover:translate-x-full transition-transform duration-700 ease-in-out"
              />
              Launch Mission
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          id="h-scroll"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
          style={{ zIndex: 3, opacity: 0 }}
        >
          <span
            className="text-[9px] tracking-[0.42em] uppercase"
            style={{
              fontFamily: "Space Mono, monospace",
              color: "rgba(100,220,255,0.42)",
            }}
          >
            Scroll
          </span>
          <div
            className="w-px h-12 animate-scroll-pulse"
            style={{
              background:
                "linear-gradient(to bottom, rgba(100,220,255,0.55), transparent)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
