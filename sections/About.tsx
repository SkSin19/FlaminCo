import AboutContent from "@/component/About/AboutContent";
import FlaminicoTitle from "@/component/About/CompanyTitle";


export default function About() {
  return (
    <div className="relative bg-black">
      <FlaminicoTitle />
      <AboutContent />
    </div>
  );
}