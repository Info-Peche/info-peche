import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import LatestEdition from "@/components/LatestEdition";
import PricingCards from "@/components/PricingCards";
import Storytelling from "@/components/Storytelling";
import ContentHighlights from "@/components/ContentHighlights";
import Testimonials from "@/components/Testimonials";
import FinalCTA from "@/components/FinalCTA";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import SideCart from "@/components/SideCart";

const Index = () => {
  return (
    <CartProvider>
      <div className="min-h-screen bg-background font-sans selection:bg-accent/30">
        <Header />
        <main>
          <Hero />
          <TrustBar />
          <LatestEdition />
          <PricingCards />
          <Storytelling />
          <ContentHighlights />
          <Testimonials />
          <FinalCTA />
          <FAQ />
        </main>
        <Footer />
        <SideCart />
      </div>
    </CartProvider>
  );
};

export default Index;
