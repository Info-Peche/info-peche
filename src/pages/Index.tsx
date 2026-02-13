import { CartProvider } from "@/context/CartContext";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import LatestEdition from "@/components/LatestEdition";
import PricingCards from "@/components/PricingCards";
import Footer from "@/components/Footer";
import SideCart from "@/components/SideCart";

const Index = () => {
  return (
    <CartProvider>
      <div className="min-h-screen bg-background font-sans selection:bg-accent/30">
        <Header />
        <main>
          <Hero />
          <LatestEdition />
          <PricingCards />
        </main>
        <Footer />
        <SideCart />
      </div>
    </CartProvider>
  );
};

export default Index;
