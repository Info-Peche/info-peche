import { Facebook, Instagram, Twitter, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground pt-20 pb-10">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <h3 className="text-2xl font-serif font-bold mb-6">Info-Pêche</h3>
            <p className="text-primary-foreground/80 mb-6 leading-relaxed">
              Le magazine de référence pour tous les passionnés de pêche au coup. Techniques, matériel, compétitions.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-accent hover:text-white transition-all">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-accent hover:text-white transition-all">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-white/10 rounded-full hover:bg-accent hover:text-white transition-all">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Navigation</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-primary-foreground/80 hover:text-white transition-colors">Accueil</a></li>
              <li><a href="#magazine" className="text-primary-foreground/80 hover:text-white transition-colors">Le Magazine</a></li>
              <li><a href="#subscribe" className="text-primary-foreground/80 hover:text-white transition-colors">Abonnements</a></li>
              <li><a href="#" className="text-primary-foreground/80 hover:text-white transition-colors">Blog & Conseils</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Informations</h4>
            <ul className="space-y-4">
              <li><a href="#" className="text-primary-foreground/80 hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="text-primary-foreground/80 hover:text-white transition-colors">Mentions Légales</a></li>
              <li><a href="#" className="text-primary-foreground/80 hover:text-white transition-colors">CGV</a></li>
              <li><a href="#" className="text-primary-foreground/80 hover:text-white transition-colors">Politique de Confidentialité</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Newsletter</h4>
            <p className="text-primary-foreground/80 mb-4 text-sm">
              Recevez nos meilleurs conseils et offres exclusives directement dans votre boîte mail.
            </p>
            <div className="flex gap-2">
              <Input 
                type="email" 
                placeholder="Votre email" 
                className="bg-white/10 border-white/20 text-white placeholder:text-primary-foreground/50 focus:border-accent"
              />
              <Button size="icon" className="bg-accent hover:bg-accent/90 text-white shrink-0">
                <Mail className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 text-center text-primary-foreground/60 text-sm">
          <p>© {new Date().getFullYear()} Info-Pêche. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
