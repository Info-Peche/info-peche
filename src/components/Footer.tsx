import { Facebook, Instagram, Twitter, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logo from "@/assets/info-peche-logo.jpg";

const Footer = () => {
  return (
    <footer id="contact" className="bg-foreground text-white pt-20 pb-10">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <img src={logo} alt="Info-Pêche" className="h-12 mb-6 brightness-0 invert" />
            <p className="text-white/70 mb-6 leading-relaxed">
              Le magazine de référence pour tous les passionnés de pêche au coup. Techniques, matériel, compétitions.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-primary transition-all">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-primary transition-all">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-primary transition-all">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Navigation</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-white/70 hover:text-white transition-colors">Accueil</Link></li>
              <li><a href="/#magazine" className="text-white/70 hover:text-white transition-colors">Le Magazine</a></li>
              <li><a href="/#subscribe" className="text-white/70 hover:text-white transition-colors">Abonnements</a></li>
              <li><Link to="/blog" className="text-white/70 hover:text-white transition-colors">Blog & Conseils</Link></li>
              <li><Link to="/boutique" className="text-white/70 hover:text-white transition-colors">Boutique</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Informations</h4>
            <ul className="space-y-4">
              <li><Link to="/contact" className="text-white/70 hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/mentions-legales" className="text-white/70 hover:text-white transition-colors">Mentions Légales</Link></li>
              <li><Link to="/cgv" className="text-white/70 hover:text-white transition-colors">CGV</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Newsletter</h4>
            <p className="text-white/70 mb-4 text-sm">
              Recevez nos meilleurs conseils et offres exclusives directement dans votre boîte mail.
            </p>
            <div className="flex gap-2">
              <Input 
                type="email" 
                placeholder="Votre email" 
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-primary"
              />
              <Button size="icon" className="bg-primary hover:bg-primary/90 text-white shrink-0">
                <Mail className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center text-white/50 text-sm">
          <p>© {new Date().getFullYear()} Info-Pêche. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
