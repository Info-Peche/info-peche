import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index";
import ScrollToTop from "./components/ScrollToTop";

// Lazy-loaded routes for code splitting
const Blog = lazy(() => import("./pages/Blog"));
const BlogArticle = lazy(() => import("./pages/BlogArticle"));
const Events = lazy(() => import("./pages/Events"));
const Shop = lazy(() => import("./pages/Shop"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Contact = lazy(() => import("./pages/Contact"));
const MentionsLegales = lazy(() => import("./pages/MentionsLegales"));
const CGV = lazy(() => import("./pages/CGV"));
const MagazineViewer = lazy(() => import("./pages/MagazineViewer"));
const MonCompte = lazy(() => import("./pages/MonCompte"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const SIPAC = lazy(() => import("./pages/SIPAC"));
const SpecimenTrophy = lazy(() => import("./pages/SpecimenTrophy"));
const FishingSpots = lazy(() => import("./pages/FishingSpots"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<div className="min-h-screen bg-background" />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogArticle />} />
                <Route path="/evenements" element={<Events />} />
                <Route path="/sipac" element={<SIPAC />} />
                <Route path="/specimen-trophy" element={<SpecimenTrophy />} />
                <Route path="/coins-peche" element={<FishingSpots />} />
                <Route path="/boutique" element={<Shop />} />
                <Route path="/commande" element={<Checkout />} />
                <Route path="/commande-confirmee" element={<OrderConfirmation />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/mentions-legales" element={<MentionsLegales />} />
                <Route path="/cgv" element={<CGV />} />
                <Route path="/lire" element={<MagazineViewer />} />
                <Route path="/mon-compte" element={<MonCompte />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
