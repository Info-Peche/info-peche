import { useState } from "react";
import { Youtube, Bell, ExternalLink, Facebook, ThumbsUp, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const YOUTUBE_CHANNEL = "https://www.youtube.com/InfoPeche";
const YOUTUBE_SUBSCRIBE = "https://www.youtube.com/InfoPeche?sub_confirmation=1";
const FACEBOOK_PAGE = "https://www.facebook.com/infopechemagazine/";

interface YouTubeSidebarProps {
  videoUrl?: string | null;
}

const YouTubeSidebar = ({ videoUrl }: YouTubeSidebarProps) => {
  const [showVideo, setShowVideo] = useState(false);

  const getVideoId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^&?/]+)/);
    return match ? match[1] : null;
  };

  const videoId = videoUrl ? getVideoId(videoUrl) : null;

  return (
    <div className="space-y-6">
      {/* Embedded video if available — facade pattern */}
      {videoId && (
        <div className="rounded-xl overflow-hidden border border-border shadow-sm">
          <div className="aspect-video relative">
            {showVideo ? (
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                title="Vidéo Info Pêche"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            ) : (
              <button
                onClick={() => setShowVideo(true)}
                className="w-full h-full relative group cursor-pointer"
                aria-label="Lire la vidéo"
              >
                <img
                  src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                  alt="Vidéo Info Pêche"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  width={480}
                  height={360}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                  <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 text-white ml-0.5" fill="currentColor" />
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Subscribe promo block */}
      <div className="bg-[hsl(0,72%,51%)]/5 border border-[hsl(0,72%,51%)]/20 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <img src="/images/logo-youtube-tv.png" alt="Info Pêche YouTube TV" className="w-12 h-12 rounded-full" loading="lazy" decoding="async" width={48} height={48} />
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

      {/* Facebook page promo block */}
      <div className="bg-[hsl(221,44%,41%)]/5 border border-[hsl(221,44%,41%)]/20 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-[hsl(221,44%,41%)] flex items-center justify-center">
            <Facebook className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">Info Pêche</h3>
            <p className="text-[11px] text-muted-foreground">sur Facebook</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          Rejoignez notre communauté sur Facebook ! Actualités, photos de pêcheurs, concours et échanges entre passionnés.
        </p>
        <a href={FACEBOOK_PAGE} target="_blank" rel="noopener noreferrer">
          <Button
            className="w-full bg-[hsl(221,44%,41%)] hover:bg-[hsl(221,44%,35%)] text-white font-bold rounded-lg text-sm"
            size="sm"
          >
            <ThumbsUp className="w-4 h-4 mr-2" />
            Suivre la page
          </Button>
        </a>
        <a
          href={FACEBOOK_PAGE}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-3 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Voir la page Facebook
        </a>
      </div>

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
