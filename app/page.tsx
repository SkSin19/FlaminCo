import { ScrollLineTrack } from "@/component/Common/ScrollLine/ScrollLine";
import Hero from "@/sections/Hero";
import Interactive3D from "@/sections/Interactive3D";
import Tagline from "@/sections/Tagline";

export default function Home() {
  return (
    <main className="bg-black select-none">
      <Hero />
      <ScrollLineTrack>
        <Tagline />
        <Interactive3D />
      </ScrollLineTrack>
      
    </main>
  );
}