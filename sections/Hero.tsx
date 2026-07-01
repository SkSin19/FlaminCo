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
import BottomBlur from "@/component/Common/Blurs/BottomBlur";


gsap.registerPlugin(ScrollTrigger);

/* ─────────────────────────────────────────────────────────────────────────────
   CONSTELLATION DATA  (normalised 0–1 coords, will be mapped to canvas px)
   Gemini & Leo — brighter star shapes drawn on top of the regular starfield
───────────────────────────────────────────────────────────────────────────── */
const CONSTELLATIONS = [
  {
    name: "Gemini",
    // Simplified Gemini outline — two parallel stick-figures
    stars: [
      { x: 0.12, y: 0.12 },
      { x: 0.14, y: 0.18 },
      { x: 0.13, y: 0.25 },
      { x: 0.11, y: 0.31 },
      { x: 0.18, y: 0.12 },
      { x: 0.19, y: 0.18 },
      { x: 0.17, y: 0.25 },
      { x: 0.15, y: 0.31 },
      { x: 0.13, y: 0.25 }, // shared hip crossbar
      { x: 0.17, y: 0.25 },
    ],
    lines: [
      [0, 1], [1, 2], [2, 3],   // left twin
      [4, 5], [5, 6], [6, 7],   // right twin
      [0, 4],                    // head crossbar
      [2, 6],                    // hip crossbar
    ],
    color: "#aaddff",
  },
  {
    name: "Leo",
    // Sickle (head) + back triangle
    stars: [
      { x: 0.76, y: 0.14 }, // Regulus
      { x: 0.74, y: 0.20 },
      { x: 0.72, y: 0.26 },
      { x: 0.75, y: 0.30 },
      { x: 0.80, y: 0.28 },
      { x: 0.82, y: 0.22 },
      { x: 0.78, y: 0.18 },
      { x: 0.86, y: 0.20 }, // Denebola
      { x: 0.84, y: 0.27 },
    ],
    lines: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0], // sickle
      [4, 7], [7, 8], [8, 4],                                    // hindquarters
    ],
    color: "#ffddb0",
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   STARFIELD HOOK  — subtle twinkle + Gemini & Leo constellations
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
      x: number; y: number; r: number;
      twinkleSpeed: number; twinkleOffset: number; color: string;
    };
    type ShootingStar = {
      x: number; y: number; vx: number; vy: number;
      life: number; maxLife: number;
    };

    let stars: Star[] = [];
    let shootingStars: ShootingStar[] = [];
    let bgCache: HTMLCanvasElement | null = null;
    let W = 0, H = 0, frame = 0, raf = 0;

    const buildBgCache = () => {
      bgCache = document.createElement("canvas");
      bgCache.width = W; bgCache.height = H;
      const bctx = bgCache.getContext("2d")!;

      const bg = bctx.createRadialGradient(W * 0.5, H * 0.3, 0, W * 0.5, H * 0.3, W);
      bg.addColorStop(0, "#060a18");
      bg.addColorStop(0.4, "#020510");
      bg.addColorStop(1, "#000003");
      bctx.fillStyle = bg;
      bctx.fillRect(0, 0, W, H);

      [
        [W * 0.15, H * 0.18, W * 0.38, "rgba(38,12,95,0.24)"],
        [W * 0.85, H * 0.42, W * 0.42, "rgba(10,28,82,0.2)"],
        [W * 0.5,  H * 0.78, W * 0.52, "rgba(15,8,52,0.16)"],
        [W * 0.3,  H * 0.6,  W * 0.3,  "rgba(20,5,60,0.12)"],
      ].forEach(([nx, ny, nr, nc]) => {
        const n = bctx.createRadialGradient(+nx, +ny, 0, +nx, +ny, +nr);
        n.addColorStop(0, nc as string);
        n.addColorStop(1, "transparent");
        bctx.fillStyle = n;
        bctx.fillRect(0, 0, W, H);
      });
    };

    const init = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      const count = Math.min(Math.floor((W * H) / 900), 800);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.6 + 0.1,
        // ── CHANGE 4a: subtle twinkle — slow speeds, small amplitude ──
        twinkleSpeed:  0.0015 + Math.random() * 0.006,
        twinkleOffset: Math.random() * Math.PI * 2,
        color: Math.random() > 0.88
          ? (Math.random() > 0.5 ? "#aaddff" : "#ffd0aa")
          : "#ffffff",
      }));
      shootingStars = [];
      buildBgCache();
    };

    const STAR_INTERVAL = 1000 / 24;
    let lastStarTime = 0;

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (!isVisibleRef.current) return;
      if (now - lastStarTime < STAR_INTERVAL) return;
      lastStarTime = now;

      ctx.clearRect(0, 0, W, H);
      if (bgCache) ctx.drawImage(bgCache, 0, 0);

      // ── CHANGE 4b: subtle twinkle — tighter alpha range (0.45–0.95) ──
      for (const s of stars) {
        const tw = 0.45 + 0.50 * (0.5 + 0.5 * Math.sin(frame * s.twinkleSpeed + s.twinkleOffset));
        ctx.globalAlpha = tw;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.r > 1.2) {
          ctx.globalAlpha = tw * 0.25;
          ctx.strokeStyle = s.color;
          ctx.lineWidth = 0.5;
          const sp = s.r * 4.5;
          ctx.beginPath();
          ctx.moveTo(s.x - sp, s.y); ctx.lineTo(s.x + sp, s.y);
          ctx.moveTo(s.x, s.y - sp); ctx.lineTo(s.x, s.y + sp);
          ctx.stroke();
        }
      }

      // ── CHANGE 4c: draw Gemini & Leo constellations ──
      for (const con of CONSTELLATIONS) {
        const conStars = con.stars.map(s => ({ px: s.x * W, py: s.y * H }));

        // Lines — faint, dashed
        ctx.globalAlpha = 0.18;
        ctx.strokeStyle = con.color;
        ctx.lineWidth = 0.8;
        ctx.setLineDash([3, 5]);
        for (const [a, b] of con.lines) {
          ctx.beginPath();
          ctx.moveTo(conStars[a].px, conStars[a].py);
          ctx.lineTo(conStars[b].px, conStars[b].py);
          ctx.stroke();
        }
        ctx.setLineDash([]);

        // Stars — brighter than background stars, gentle own twinkle
        for (let i = 0; i < conStars.length; i++) {
          const { px, py } = conStars[i];
          const twinkle = 0.55 + 0.45 * Math.sin(frame * 0.003 + i * 1.3);
          // Glow halo
          const grd = ctx.createRadialGradient(px, py, 0, px, py, 5);
          grd.addColorStop(0, con.color);
          grd.addColorStop(1, "transparent");
          ctx.globalAlpha = 0.28 * twinkle;
          ctx.fillStyle = grd;
          ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
          // Core dot
          ctx.globalAlpha = 0.85 * twinkle;
          ctx.fillStyle = con.color;
          ctx.beginPath(); ctx.arc(px, py, 1.6, 0, Math.PI * 2); ctx.fill();
        }
      }

      // Shooting stars
      if (Math.random() < 0.004 && shootingStars.length < 2) {
        const startX = W * 0.15 + Math.random() * W * 0.7;
        const startY = Math.random() * H * 0.35;
        const angle  = Math.PI * 0.18 + Math.random() * 0.22;
        const speed  = 9 + Math.random() * 6;
        shootingStars.push({ x: startX, y: startY, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 0, maxLife: 22 + Math.random() * 10 });
      }
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        s.x += s.vx; s.y += s.vy; s.life++;
        const fade = 1 - s.life / s.maxLife;
        if (fade <= 0) { shootingStars.splice(i, 1); continue; }
        const tailX = s.x - s.vx * 3.2, tailY = s.y - s.vy * 3.2;
        const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255,255,255,${0.9 * fade})`);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = grad; ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(tailX, tailY); ctx.stroke();
      }

      ctx.globalAlpha = 1;
      frame++;
    };

    window.addEventListener("resize", init);
    init();
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", init); };
  }, [ref, isVisibleRef]);
}

/* ─────────────────────────────────────────────────────────────────────────────
   LETTER-BY-LETTER SPRING SLIDE  — pure GSAP, no external dep
   direction: "left" | "right"  (which side the letters slide IN from)
───────────────────────────────────────────────────────────────────────────── */
function splitLetters(el: HTMLElement | null, direction: "left" | "right") {
  if (!el) return [];
  const text = el.dataset.text ?? el.textContent ?? "";
  el.textContent = "";
  el.style.overflow = "hidden";

  const fromX = direction === "left" ? -80 : 80;
  const spans: HTMLElement[] = [];
  for (const ch of text) {
    const span = document.createElement("span");
    span.textContent = ch === " " ? "\u00A0" : ch;
    span.style.cssText = `
      display: inline-block;
      transform: translateX(${fromX}px);
      opacity: 0;
      will-change: transform, opacity;
    `;
    el.appendChild(span);
    spans.push(span);
  }
  return spans;
}

/* ─────────────────────────────────────────────────────────────────────────────
   HERO COMPONENT
───────────────────────────────────────────────────────────────────────────── */
export default function Hero() {
  const bgRef      = useRef<HTMLCanvasElement>(null);
  const glRef      = useRef<HTMLCanvasElement>(null);
  const heroRef    = useRef<HTMLDivElement>(null);
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
      antialias: W > 1200,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(0.75);
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = false;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 1000);
    camera.position.set(0, 2, 10);
    camera.lookAt(0, 0, 0);

    /* ── Post-processing ───────────────────────────────────────────────── */
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(W * 0.5, H * 0.5), 0.35, 0.55, 0.82);
    composer.addPass(bloomPass);
    composer.addPass(new OutputPass());

    /* ── Lighting ──────────────────────────────────────────────────────── */
    const sunLight = new THREE.DirectionalLight(0xfff8e7, 3.5);
    sunLight.position.set(8, 5, 6);
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
    let shipGroup:  THREE.Group | null = null;
    let earthMixer: THREE.AnimationMixer | null = null;
    let shipMixer:  THREE.AnimationMixer | null = null;
    let scrollProgress = 0;

    const EARTH_SCALE_START = isDesktop ? 22 : 16;
    const EARTH_SCALE_END   = isDesktop ? 14 : 7.5;
    const EARTH_Y_START = -7;
    const EARTH_Y_END   = -4.2;
    let earthNormScale  = 1.0;

    /* ── LOAD EARTH ────────────────────────────────────────────────────── */
    gltfLoader.load("/models/earth.glb", (gltf) => {
      earthGroup = gltf.scene;
      earthGroup.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
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

      const box  = new THREE.Box3().setFromObject(earthGroup);
      const size = box.getSize(new THREE.Vector3()).length();
      earthNormScale = 1.0 / size;

      const initScale = EARTH_SCALE_START * earthNormScale;
      earthGroup.scale.setScalar(initScale);
      const centred = box.getCenter(new THREE.Vector3()).multiplyScalar(-initScale);
      earthGroup.position.copy(centred);
      earthGroup.position.y = EARTH_Y_START;
      earthGroup.position.z = -1;
      earthGroup.rotation.z = 0.1;

      scene.add(earthGroup);

      if (gltf.animations.length) {
        earthMixer = new THREE.AnimationMixer(earthGroup);
        gltf.animations.forEach(clip => earthMixer!.clipAction(clip).play());
      }
    }, undefined, (err) => console.error("Earth load error:", err));

    /* ── LOAD SPACESHIP ────────────────────────────────────────────────── */
    gltfLoader.load("/models/space-shuttle.glb", (gltf) => {
      shipGroup = gltf.scene;
      shipGroup.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        if (child.material instanceof THREE.MeshStandardMaterial) {
          child.material.envMapIntensity = 2.0;
          child.material.metalness = Math.max(child.material.metalness, 0.6);
          child.material.roughness = Math.min(child.material.roughness, 0.4);
          child.material.needsUpdate = true;
        }
      });

      const box   = new THREE.Box3().setFromObject(shipGroup);
      const size  = box.getSize(new THREE.Vector3()).length();
      const scale = 5 / size;
      shipGroup.scale.setScalar(scale);
      const centred = box.getCenter(new THREE.Vector3()).multiplyScalar(-scale);
      shipGroup.position.copy(centred);
      shipGroup.position.y = -18;
      shipGroup.position.x = 0.4;
      shipGroup.position.z = 2.5;
      shipGroup.rotation.x = Math.PI;

      scene.add(shipGroup);

      if (gltf.animations.length) {
        shipMixer = new THREE.AnimationMixer(shipGroup);
        gltf.animations.forEach(clip => shipMixer!.clipAction(clip).play());
      }

      setupGSAP();
    }, undefined, (err) => console.error("Ship load error:", err));

    /* ── ENVIRONMENT MAP ───────────────────────────────────────────────── */
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const envScene   = new THREE.Scene();
    envScene.background = new THREE.Color(0x000008);
    const envTexture = pmremGenerator.fromScene(envScene).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();

    /* ── THRUSTER PLUME ────────────────────────────────────────────────── */
    const PLUME_COUNT = 60;
    const pPos = new Float32Array(PLUME_COUNT * 3);
    for (let i = 0; i < PLUME_COUNT; i++) {
      const t = Math.random(); const sp = t * 0.16;
      pPos[i*3]   = (Math.random()-0.5)*sp;
      pPos[i*3+1] = -t*1.8;
      pPos[i*3+2] = (Math.random()-0.5)*sp;
    }
    const plumeGeo = new THREE.BufferGeometry();
    plumeGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const plumeMat = new THREE.PointsMaterial({ color: 0x88ccff, size: 0.055, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
    const plumePoints = new THREE.Points(plumeGeo, plumeMat);

    const INNER_COUNT = 20;
    const innerPos = new Float32Array(INNER_COUNT * 3);
    for (let i = 0; i < INNER_COUNT; i++) {
      const t = Math.random()*0.55;
      innerPos[i*3]   = (Math.random()-0.5)*0.04;
      innerPos[i*3+1] = -t*0.7;
      innerPos[i*3+2] = (Math.random()-0.5)*0.04;
    }
    const innerGeo = new THREE.BufferGeometry();
    innerGeo.setAttribute("position", new THREE.BufferAttribute(innerPos, 3));
    const innerMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.036, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false });
    const innerPoints = new THREE.Points(innerGeo, innerMat);

    const plumeGroup = new THREE.Group();
    plumeGroup.add(plumePoints, innerPoints);
    plumeGroup.visible = false;
    scene.add(plumeGroup);

    /* ── GSAP SCROLL SETUP ─────────────────────────────────────────────── */
    function setupGSAP() {
      if (!shipGroup || !heroRef.current) return;

      // ── CHANGE 5: split text elements into letter spans ──
      const leftEl  = document.getElementById("h-text-left");
      const rightEl = document.getElementById("h-text-right");
      const leftLetters  = splitLetters(leftEl,  "left");
      const rightLetters = splitLetters(rightEl, "right");

      const earthProxy = { diameter: EARTH_SCALE_START, posY: EARTH_Y_START };
      const shipProxy  = { y: -18, x: 0.4 };

      // ── CHANGE 1: extended earth push-back — goes to Y = -18 at the very end ──
      const earthExitProxy = { posY: EARTH_Y_END };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end:   "bottom bottom",
          scrub: 2.0,
          onUpdate: (self) => { scrollProgress = self.progress; },
        },
      });

      // Phase 1 (0 → 0.35): Earth shrinks, ship rises
      tl.to(earthProxy, {
        diameter: EARTH_SCALE_END, posY: EARTH_Y_END,
        ease: "power2.inOut", duration: 0.35,
        onUpdate: () => {
          if (!earthGroup) return;
          earthGroup.scale.setScalar(earthProxy.diameter * earthNormScale);
          earthGroup.position.y = earthProxy.posY;
        },
      }, 0)
      .to(shipProxy, {
        y: 1.8, x: 0, ease: "power2.inOut", duration: 0.35,
        onUpdate: () => {
          if (shipGroup) { shipGroup.position.y = shipProxy.y; shipGroup.position.x = shipProxy.x; }
        },
      }, 0)
      .to(camera.position, { z: 9.2, ease: "power1.inOut", duration: 0.35 }, 0)

      // ── CHANGE 2: FLAMINCO title fades out as scroll begins ──
      .to("#h-flaminco", { opacity: 0, scale: 0.85, ease: "power2.in", duration: 0.25 }, 0.02)

      // ── CHANGE 5a: left text letters slide in (0.35 → 0.52) ──
      .to(leftLetters, {
        x: 0, opacity: 1,
        ease: "back.out(1.4)",
        duration: 0.12,
        stagger: { each: 0.012, from: "start" },
      }, 0.35)

      // ── CHANGE 5b: right text letters slide in (0.46 → 0.62) ──
      .to(rightLetters, {
        x: 0, opacity: 1,
        ease: "back.out(1.4)",
        duration: 0.12,
        stagger: { each: 0.012, from: "start" },
      }, 0.46)

      // Hold both texts for a beat (0.62 → 0.72) — no tweens needed, just time

      // ── CHANGE 5c: left letters exit to the RIGHT (0.72 → 0.84) ──
      .to(leftLetters, {
        x: 100, opacity: 0,
        ease: "back.in(1.4)",
        duration: 0.10,
        stagger: { each: 0.010, from: "end" }, // reverse stagger = right-to-left
      }, 0.72)

      // ── CHANGE 5d: right letters exit to the LEFT (0.78 → 0.90) ──
      .to(rightLetters, {
        x: -100, opacity: 0,
        ease: "back.in(1.4)",
        duration: 0.10,
        stagger: { each: 0.010, from: "start" },
      }, 0.78)

      // eyebrow / sub / cta still reveal after ship arrives
      .to("#h-eyebrow", { opacity: 1, y: 0, ease: "power3.out", duration: 0.12 }, 0.37)
      .to("#h-sub",     { opacity: 1, y: 0, ease: "power3.out", duration: 0.12 }, 0.42)
      .to("#h-cta",     { opacity: 1, y: 0, ease: "power3.out", duration: 0.12 }, 0.48)

      // Ship exits upward (0.76 → 1.0)
      .to(shipProxy, {
        y: 14, ease: "power2.in", duration: 0.24,
        onUpdate: () => { if (shipGroup) shipGroup.position.y = shipProxy.y; },
      }, 0.76)

      // ── CHANGE 1: earth retreats further as section ends (0.78 → 1.0) ──
      .to(earthExitProxy, {
        posY: -22,
        ease: "power2.in",
        duration: 0.22,
        onUpdate: () => {
          if (earthGroup) earthGroup.position.y = earthExitProxy.posY;
        },
      }, 0.78)

      .to(["#h-eyebrow", "#h-sub", "#h-cta"], {
        opacity: 0, y: -28, stagger: 0.03, ease: "power2.in", duration: 0.14,
      }, 0.78);

    }

    /* ── RENDER LOOP ───────────────────────────────────────────────────── */
    const clock = new THREE.Clock();
    let raf = 0;
    const TARGET_FPS = 45;
    const FRAME_MS   = 1000 / TARGET_FPS;
    let lastRenderTime = 0;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!isVisibleRef.current) return;
      if (now - lastRenderTime < FRAME_MS) return;
      lastRenderTime = now;

      const t  = clock.getElapsedTime();
      const dt = Math.min(clock.getDelta(), 0.05);

      // ── CHANGE 3: constant earth rotation (fixed velocity bug) ──
      if (earthGroup) {
        earthGroup.rotation.y += 0.0008; // constant, no accumulator
        earthGroup.rotation.z  = 0.1 + Math.sin(t * 0.18) * 0.01;
      }
      if (earthMixer) earthMixer.update(dt);

      if (shipGroup) {
        const isMidFlight = scrollProgress > 0.02 && scrollProgress < 0.76;
        if (!isMidFlight) {
          shipGroup.rotation.z   = Math.sin(t * 0.9) * 0.04;
          shipGroup.position.y  += Math.sin(t * 0.85) * 0.0006;
        } else {
          shipGroup.rotation.z += (0 - shipGroup.rotation.z) * 0.06;
        }
        shipGroup.rotation.x = Math.sin(t * 0.55) * 0.016;

        plumeGroup.visible = true;
        plumeGroup.position.set(shipGroup.position.x, shipGroup.position.y - 0.85, shipGroup.position.z);
      }
      if (shipMixer) shipMixer.update(dt);

      const pp = plumeGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < PLUME_COUNT; i++) {
        const k = i * 3;
        pp[k+1] -= 0.016;
        if (pp[k+1] < -2.0) {
          const tt = Math.random() * 0.12;
          pp[k] = (Math.random()-0.5)*tt*0.08; pp[k+1] = 0; pp[k+2] = (Math.random()-0.5)*tt*0.08;
        }
        pp[k] *= 1.008; pp[k+2] *= 1.008;
      }
      plumeGeo.attributes.position.needsUpdate = true;
      plumeMat.opacity = 0.5 + Math.sin(t * 4.0) * 0.2;

      const ip = innerGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < INNER_COUNT; i++) {
        const k = i * 3;
        ip[k+1] -= 0.028;
        if (ip[k+1] < -0.75) {
          ip[k] = (Math.random()-0.5)*0.038; ip[k+1] = 0; ip[k+2] = (Math.random()-0.5)*0.038;
        }
      }
      innerGeo.attributes.position.needsUpdate = true;
      innerMat.opacity = 0.85 + Math.sin(t * 6.5) * 0.1;

      bloomPass.strength = 0.3 + scrollProgress * 0.22;
      composer.render();
    };
    raf = requestAnimationFrame(tick);

    /* ── VISIBILITY OBSERVER ───────────────────────────────────────────── */
    const observer = new IntersectionObserver(([entry]) => {
      isVisibleRef.current = entry.isIntersecting;
    }, { threshold: 0 });
    observer.observe(heroRef.current);

    /* ── RESIZE ────────────────────────────────────────────────────────── */
    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
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
      ScrollTrigger.getAll().forEach(st => st.kill());
    };
  }, []);

  return (
    <div ref={heroRef} className="relative" style={{ height: "500vh" }}>
      <div className="sticky top-0 h-screen overflow-hidden">
      <BottomBlur height={30} color="#000003" className="z-10" />
        {/* Starfield */}
        <canvas ref={bgRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }} />
        <canvas ref={glRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 3 }} />

        <div
          id="h-flaminco"
          className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
          style={{ zIndex: 2 }}
        >
          <span
            style={{
              fontFamily: "Orbitron, monospace",
              fontSize:   "clamp(56px, 14vw, 180px)",
              fontWeight: 900,
              letterSpacing: "0.18em",
              color: "transparent",
              WebkitTextStroke: "1.5px rgba(100,220,255,0.55)",
              textShadow:
                "0 0 120px rgba(80,180,255,0.22), 0 0 40px rgba(80,180,255,0.12)",
              opacity: 1,
              userSelect: "none",
              // Pushed slightly upward so the earth model sits behind/below it
              transform: "translateY(-8vh)",
            }}
          >
            FLAMINCO
          </span>
        </div>


        {/* Vignette overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 4,
            background:
              "radial-gradient(ellipse at 50% 38%, transparent 32%, rgba(0,1,4,0.45) 76%, rgba(0,0,2,0.82) 100%), linear-gradient(to bottom, rgba(0,1,5,0.35) 0%, transparent 16%, transparent 72%, rgba(0,1,5,0.55) 100%)",
          }}
        />

        {/* ── CHANGE 5: scroll-triggered letter-slide texts ── */}
        {/* First text — anchored upper-third, left-aligned */}
        <div
          className="absolute left-0 right-0 pointer-events-none select-none"
          style={{ zIndex: 1, top: "20%", padding: "0 clamp(24px, 6vw, 96px)" }}
        >
          <p
            id="h-text-left"
            data-text="BEYOND WORDS"
            style={{
              fontFamily: "Orbitron, monospace",
              fontSize: "clamp(28px, 6.5vw, 88px)",
              fontWeight: 900,
              letterSpacing: "0.02em",
              color: "#fff",
              lineHeight: 1,
              textAlign: "center",
            }}
          >
            BEYOND WORDS
          </p>
        </div>

        {/* Second text — anchored lower-third, right-aligned */}
        <div
          className="absolute left-0 right-0 pointer-events-none select-none"
          style={{ zIndex: 5, bottom: "10%", padding: "0 clamp(24px, 6vw, 96px)" }}
        >
          <p
            id="h-text-right"
            data-text="WE BUILD EXPERIENCES"
            style={{
              fontFamily: "Orbitron, monospace",
              fontSize: "clamp(28px, 6.5vw, 88px)",
              fontWeight: 900,
              letterSpacing: "0.02em",
              color: "rgba(100,220,255,0.92)",
              lineHeight: 1,
              textAlign: "center",
            }}
          >
            WE BUILD EXPERIENCES
          </p>
        </div>

        {/* Hero copy (eyebrow / sub / cta) */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none"
          style={{ zIndex: 5 }}
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
            NOT JUST WEBSITES AND APPS
          </p>

          {/* h-title removed — replaced by the letter-slide texts above */}

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
            OPTIMIZED · ROBUST · FUTURISTIC
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
              style={{ fontFamily: "Orbitron, monospace", color: "#64dcff", borderColor: "rgba(100,220,255,0.35)" }}
              onMouseEnter={(e) => { const b = e.currentTarget; b.style.borderColor = "rgba(100,220,255,0.85)"; b.style.color = "#fff"; }}
              onMouseLeave={(e) => { const b = e.currentTarget; b.style.borderColor = "rgba(100,220,255,0.35)"; b.style.color = "#64dcff"; }}
            >
              <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-[rgba(100,220,255,0.07)] to-transparent group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              Launch Mission
            </button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          id="h-scroll"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
          style={{ zIndex: 6, opacity: 0 }}
        >
          <span
            className="text-[9px] tracking-[0.42em] uppercase"
            style={{ fontFamily: "Space Mono, monospace", color: "rgba(100,220,255,0.42)" }}
          >
            Scroll
          </span>
          <div
            className="w-px h-12 animate-scroll-pulse"
            style={{ background: "linear-gradient(to bottom, rgba(100,220,255,0.55), transparent)" }}
          />
        </div>

      </div>
    </div>
  );
}