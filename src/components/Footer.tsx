import { Facebook, Youtube } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer id="contact" className="bg-foreground text-white pt-20 pb-10">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          <div className="md:col-span-1">
            <img src="/images/info-peche-logo.png" alt="Info-Pêche" className="h-14 mb-6 brightness-0 invert" loading="lazy" decoding="async" width={140} height={56} />
            <p className="text-white/70 mb-6 leading-relaxed">
              Le magazine de référence pour tous les passionnés de pêche au coup. Techniques, matériel, compétitions.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/infopechemagazine/?locale=fr_FR" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full hover:bg-primary transition-all">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://www.youtube.com/@infopechemagazine" target="_blank" rel="noopener noreferrer" className="p-2 bg-white/10 rounded-full hover:bg-primary transition-all">
                <Youtube className="w-5 h-5" />
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
              <li><Link to="/boutique" className="text-white/70 hover:text-white transition-colors">Anciens numéros</Link></li>
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
        </div>

        <div className="border-t border-white/10 pt-8 text-center text-white/50 text-sm">
          <p>© {new Date().getFullYear()} Info-Pêche. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
