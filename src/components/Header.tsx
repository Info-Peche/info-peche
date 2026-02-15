import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import logo from "@/assets/info-peche-logo.jpg";

const resourceLinks = [
  { name: "Blog", href: "/blog" },
  { name: "Événements", href: "/evenements" },
  { name: "Boutique Archives", href: "/boutique" },
  { name: "Contact", href: "/contact" },
];

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isResourcesOpen, setIsResourcesOpen] = useState(false);
  const [isMobileResourcesOpen, setIsMobileResourcesOpen] = useState(false);
  const { setIsOpen, itemCount } = useCart();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsResourcesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubscribeClick = () => {
    if (isHome) {
      document.getElementById("subscribe")?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = "/#subscribe";
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/90 backdrop-blur-md shadow-sm py-2" : "bg-white/80 backdrop-blur-sm py-4"
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Info Pêche" className="h-12 md:h-14 object-contain" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link
            to="/"
            className="text-foreground/80 hover:text-primary transition-colors font-medium text-sm uppercase tracking-wide"
          >
            Accueil
          </Link>

          {isHome && (
            <a
              href="#magazine"
              className="text-foreground/80 hover:text-primary transition-colors font-medium text-sm uppercase tracking-wide"
            >
              Le Magazine
            </a>
          )}

          {/* Resources Dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setIsResourcesOpen(!isResourcesOpen)}
              className="flex items-center gap-1 text-foreground/80 hover:text-primary transition-colors font-medium text-sm uppercase tracking-wide"
            >
              Ressources
              <ChevronDown className={`h-4 w-4 transition-transform ${isResourcesOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {isResourcesOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full mt-2 left-0 w-52 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50"
                >
                  {resourceLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.href}
                      onClick={() => setIsResourcesOpen(false)}
                      className="block px-4 py-3 text-sm text-foreground/80 hover:bg-muted hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button
            className="bg-primary hover:bg-primary/90 text-white font-bold rounded-full px-6 shadow-md hover:shadow-lg transition-all"
            onClick={handleSubscribeClick}
          >
            S'abonner
          </Button>
        </nav>

        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-foreground hover:bg-primary/10 hover:text-primary"
            onClick={() => setIsOpen(true)}
          >
            <ShoppingBag className="h-6 w-6" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t"
          >
            <nav className="flex flex-col p-4 space-y-2">
              <Link
                to="/"
                className="text-foreground/80 hover:text-primary font-medium p-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Accueil
              </Link>

              {/* Mobile Resources Accordion */}
              <button
                onClick={() => setIsMobileResourcesOpen(!isMobileResourcesOpen)}
                className="flex items-center justify-between text-foreground/80 hover:text-primary font-medium p-2 w-full text-left"
              >
                Ressources
                <ChevronDown className={`h-4 w-4 transition-transform ${isMobileResourcesOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {isMobileResourcesOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pl-4 space-y-1"
                  >
                    {resourceLinks.map((link) => (
                      <Link
                        key={link.name}
                        to={link.href}
                        className="block text-foreground/70 hover:text-primary font-medium p-2 text-sm"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {link.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                className="w-full bg-primary text-white mt-2"
                onClick={() => {
                  handleSubscribeClick();
                  setIsMobileMenuOpen(false);
                }}
              >
                S'abonner
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
