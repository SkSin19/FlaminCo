"use client";

import { useEffect, useState } from "react";
import ScrollIndicator from "@/component/Common/Indicators/ScrollIndicator";
import { ScrollLineTrack } from "@/component/Common/ScrollLine/ScrollLine";
import Hero from "@/sections/Hero";
import Interactive3D from "@/sections/Interactive3D";
import Tagline from "@/sections/Tagline";
import About from "@/sections/About";
import ReturnSlider from "@/component/About/ReturnSlider";

export default function Home() {
  const [dimmed, setDimmed] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    const returnToMoon = () => {
      setShowAbout(false);
      setDimmed(true);
    };

    window.addEventListener("returnToMoon", returnToMoon);

    return () => window.removeEventListener("returnToMoon", returnToMoon);
  }, []);

  useEffect(() => {
    const onLanded = () => setDimmed(true);
    const onExited = () => setDimmed(false);

    window.addEventListener("astronautLanded", onLanded);
    window.addEventListener("astronautExited", onExited);

    return () => {
      window.removeEventListener("astronautLanded", onLanded);
      window.removeEventListener("astronautExited", onExited);
    };
  }, []);

  return (
    <main className="bg-black select-none">
      <ScrollIndicator enabled={true} dimmed={dimmed} />
      <Hero />
      <ScrollLineTrack>
        <Tagline />
      </ScrollLineTrack>
      <Interactive3D
        onLanded={() => setDimmed(true)}
        onExited={() => {
          console.log("[page] onExited fired, setting showAbout true");
          setDimmed(false);
          setShowAbout(true);
        }}
      />
      {showAbout && <About />}
      {showAbout && <ReturnSlider />}
    </main>
  );
}
