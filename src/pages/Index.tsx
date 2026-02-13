import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrustBar from "@/components/TrustBar";
import LatestEdition from "@/components/LatestEdition";
import ContentHighlights from "@/components/ContentHighlights";
import Storytelling from "@/components/Storytelling";
import Testimonials from "@/components/Testimonials";
import PricingCards from "@/components/PricingCards";
import FinalCTA from "@/components/FinalCTA";
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
          <ContentHighlights />
          <Storytelling />
          <Testimonials />
          <PricingCards />
          <FinalCTA />
        </main>
        <Footer />
        <SideCart />
      </div>
    </CartProvider>
  );
};

export default Index;
