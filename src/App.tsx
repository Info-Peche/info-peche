import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import Events from "./pages/Events";
import Shop from "./pages/Shop";
import NotFound from "./pages/NotFound";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import Contact from "./pages/Contact";
import MentionsLegales from "./pages/MentionsLegales";
import CGV from "./pages/CGV";
import MagazineViewer from "./pages/MagazineViewer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogArticle />} />
          <Route path="/evenements" element={<Events />} />
          <Route path="/boutique" element={<Shop />} />
          <Route path="/commande" element={<Checkout />} />
          <Route path="/commande-confirmee" element={<OrderConfirmation />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/mentions-legales" element={<MentionsLegales />} />
          <Route path="/cgv" element={<CGV />} />
          <Route path="/lire" element={<MagazineViewer />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
