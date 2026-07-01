import AboutContent from "@/component/About/AboutContent";
import FlaminicoTitle from "@/component/About/CompanyTitle";

export default function About() {
  return (
    <section id="about" className="relative bg-black">
      <FlaminicoTitle />
      <AboutContent />
    </section>
  );
}
