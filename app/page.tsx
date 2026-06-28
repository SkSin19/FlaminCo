import ScrollLine from "@/component/Common/ScrollLine/ScrollLine";
import Hero from "@/sections/Hero";
import Interactive3D from "@/sections/Interactive3D";
import Tagline from "@/sections/Tagline";

export default function Home() {
  return (
    <main className="bg-black select-none">
      <Hero />
      <ScrollLine>
        <Tagline />
      </ScrollLine>
      <Interactive3D />
    </main>
  );
}