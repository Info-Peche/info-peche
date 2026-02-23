import { Youtube, Bell, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const YOUTUBE_CHANNEL = "https://www.youtube.com/InfoPeche";
const YOUTUBE_SUBSCRIBE = "https://www.youtube.com/InfoPeche?sub_confirmation=1";

interface YouTubeSidebarProps {
  videoUrl?: string | null;
}

const YouTubeSidebar = ({ videoUrl }: YouTubeSidebarProps) => {
  // Extract video ID from YouTube URL
  const getEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const embedUrl = videoUrl ? getEmbedUrl(videoUrl) : null;

  return (
    <div className="space-y-6">
      {/* Embedded video if available */}
      {embedUrl && (
        <div className="rounded-xl overflow-hidden border border-border shadow-sm">
          <div className="aspect-video">
            <iframe
              src={embedUrl}
              title="Vidéo Info Pêche"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Subscribe promo block */}
      <div className="bg-[hsl(0,72%,51%)]/5 border border-[hsl(0,72%,51%)]/20 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Youtube className="w-6 h-6 text-[hsl(0,72%,51%)]" />
          <h3 className="font-bold text-foreground text-sm">Info Pêche TV</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          Retrouvez nos reportages, tutoriels et tests de matériel en vidéo. Rejoignez la communauté !
        </p>
        <a href={YOUTUBE_SUBSCRIBE} target="_blank" rel="noopener noreferrer">
          <Button
            className="w-full bg-[hsl(0,72%,51%)] hover:bg-[hsl(0,72%,45%)] text-white font-bold rounded-lg text-sm"
            size="sm"
          >
            <Bell className="w-4 h-4 mr-2" />
            S'abonner à la chaîne
          </Button>
        </a>
        <a
          href={YOUTUBE_CHANNEL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-3 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Voir toutes les vidéos
        </a>
      </div>

      {/* Subscribe to magazine promo */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
        <h3 className="font-bold text-foreground text-sm mb-2">📖 Vous aimez cet article ?</h3>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          Abonnez-vous à Info Pêche et accédez à tous les articles, magazines et contenus exclusifs.
        </p>
        <a href="/#subscribe">
          <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold rounded-lg text-sm" size="sm">
            Découvrir nos offres
          </Button>
        </a>
      </div>
    </div>
  );
};

export default YouTubeSidebar;
