"use client";

import { useEffect, useState } from "react";
import ScrollIndicator from "@/component/Common/Indicators/ScrollIndicator";
import { ScrollLineTrack } from "@/component/Common/ScrollLine/ScrollLine";
import Hero from "@/sections/Hero";
import Interactive3D from "@/sections/Interactive3D";
import Tagline from "@/sections/Tagline";

export default function Home() {
  const [showIndicator, setShowIndicator] = useState(true);

  useEffect(() => {
    const el = document.getElementById("interactive-3d");
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Hidden while Interactive3D is in view, visible otherwise
        setShowIndicator(!entry.isIntersecting);
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <main className="bg-black select-none">
      <ScrollIndicator enabled={showIndicator} />
      <Hero />
      <ScrollLineTrack>
        <Tagline />
        <Interactive3D />
      </ScrollLineTrack>
    </main>
  );
}