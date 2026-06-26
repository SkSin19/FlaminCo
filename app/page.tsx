import Hero from "@/sections/Hero";
import Interactive3D from "@/sections/Interactive3D";

export default function Home() {
  return (
    <main className="bg-black">
      <Hero />
      {/* Content below hero */}
      <section className="min-h-screen bg-black flex items-center justify-center">
        <p
          className="text-white/20 tracking-[0.4em] uppercase text-xs"
          style={{ fontFamily: "var(--font-space-mono)" }}
        >
          The mission continues below
        </p>
      </section>
      <Interactive3D />
    </main>
  );
}