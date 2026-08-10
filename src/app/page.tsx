import Hero from "@/components/home/Hero";
import Statistics from "@/components/home/Statistics";
import HowItWorks from "@/components/home/HowItWorks";
import Destinations from "@/components/home/Destinations";
import Platform from "@/components/home/Platform";
import Stories from "@/components/home/Stories";
import FinalCta from "@/components/home/FinalCta";
import Footer from "@/components/home/Footer";

export default function Home() {
  return (
    <main className="af-desktop-zoom af-mobile-zoom">
      <Hero />
      <Statistics />
      <HowItWorks />
      <Destinations />
      <Platform />
      <Stories />
      <FinalCta />
      <Footer />
    </main>
  );
}
