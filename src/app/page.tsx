import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroSection from "@/components/sections/HeroSection";
import RepositioningSection from "@/components/sections/RepositioningSection";
import ModelSection from "@/components/sections/ModelSection";
import ServicesSection from "@/components/sections/ServicesSection";
import WorkSection from "@/components/sections/WorkSection";
import IndustriesSection from "@/components/sections/IndustriesSection";
import WhySection from "@/components/sections/WhySection";
import InsightsSection from "@/components/sections/InsightsSection";
import CareersSection from "@/components/sections/CareersSection";
import ContactSection from "@/components/sections/ContactSection";
import ClientsSection from "@/components/sections/ClientsSection";

export default function Home() {
  return (
    <main className="flex flex-col">
      <Header />
      <HeroSection />
      <RepositioningSection />
      <ClientsSection />
      <ModelSection />
      <ServicesSection />
      <WorkSection />
      <IndustriesSection />
      <WhySection />
      <InsightsSection />
      <CareersSection />
      <ContactSection />
      <Footer />
    </main>
  );
}
