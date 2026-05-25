import HeroSection from '../../components/HeroSection';
import Navbar from '../../components/Navbar';
import { ThemeProvider } from '../../context/ThemeContext';
import HowItWorks from './HowItWorks';
import { AboutSection, CTASection, Footer, PartnersSection, PricingSection, TestimonialsSection } from './LandingSections';
import ServicesSection from './ServicesSection';
import TeamPage from './TeamPage';

export default function HomePage() {
  return (
    <ThemeProvider>
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorks />
        <ServicesSection />
        <PartnersSection />
        <TestimonialsSection />
        {/* <PricingSection /> */}
        <AboutSection />
        <TeamPage />
        <CTASection />
      </main>
      <Footer />
    </ThemeProvider>
  );
}