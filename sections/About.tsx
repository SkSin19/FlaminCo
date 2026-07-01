"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import AboutContent from "@/component/About/AboutContent";
import FlaminicoTitle from "@/component/About/CompanyTitle";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);
  const canGoBackRef = useRef(false);

  useEffect(() => {
    // ReturnSlider is the only thing allowed to authorize leaving About
    // back toward Interactive3D. It should set this flag true right
    // before it triggers the scroll, then this component (or the
    // ReturnSlider's own scroll) can safely proceed.
    const unlock = () => {
      canGoBackRef.current = true;
    };
    window.addEventListener("returnToMoon", unlock);
    return () => window.removeEventListener("returnToMoon", unlock);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      // Fires the instant scroll tries to move above the top of About.
      // If ReturnSlider hasn't authorized it, snap back down so the
      // user can't wheel/trackpad/keyboard their way back into
      // Interactive3D — the slider is the only legitimate exit.
      onLeaveBack: (self) => {
        if (canGoBackRef.current) return;

        gsap.to(window, {
          scrollTo: { y: self.start + 2 },
          duration: 0.3,
          ease: "power2.out",
          overwrite: true,
        });
      },
    });

    return () => trigger.kill();
  }, []);

  return (
    <section id="about" ref={sectionRef} className="relative bg-black">
      <FlaminicoTitle />
      <AboutContent />
    </section>
  );
}