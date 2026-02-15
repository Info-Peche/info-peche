import { useState, useCallback, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Loader2,
  ArrowLeft,
  Lock,
  ShoppingCart,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useCart } from "@/context/CartContext";
import SideCart from "@/components/SideCart";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const MagazineViewerContent = () => {
  const [searchParams] = useSearchParams();
  const issueId = searchParams.get("issue");
  const isPreview = searchParams.get("mode") === "preview";
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [email, setEmail] = useState(() => localStorage.getItem("reader_email") || "");
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [previewPages, setPreviewPages] = useState(4);
  const [issueInfo, setIssueInfo] = useState<{ title: string; issue_number: string; price_cents: number } | null>(null);

  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Preview mode: fetch preview URL without auth
  const loadPreview = useCallback(async () => {
    if (!issueId) return;
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-preview-url", {
        body: { issue_id: issueId },
      });
      if (error) throw error;
      if (data?.url) {
        setPdfUrl(data.url);
        setPreviewPages(data.preview_pages || 4);
        setIssueInfo({
          title: data.title,
          issue_number: data.issue_number,
          price_cents: data.price_cents,
        });
        setVerified(true);
      }
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Impossible de charger l'aperçu.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  }, [issueId]);

  const verifyAccess = useCallback(async () => {
    if (!email || !issueId) return;
    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-magazine-url", {
        body: { email, issue_id: issueId },
      });
      if (error) throw error;
      if (data?.url) {
        setPdfUrl(data.url);
        setVerified(true);
        localStorage.setItem("reader_email", email);
      } else {
        toast({
          title: "Accès non trouvé",
          description: "Aucun accès valide pour ce numéro avec cet email.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message || "Impossible de vérifier l'accès.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  }, [email, issueId]);

  useEffect(() => {
    if (isPreview && issueId) {
      loadPreview();
    } else if (email && issueId && !verified) {
      verifyAccess();
    }
  }, [issueId, isPreview]);

  const maxPages = isPreview ? previewPages : numPages;

  const onDocumentLoadSuccess = ({ numPages: total }: { numPages: number }) => {
    setNumPages(total);
  };

  const goToPage = (page: number) => {
    const limit = isPreview ? Math.min(previewPages, numPages) : numPages;
    if (page >= 1 && page <= limit) setCurrentPage(page);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleBuyDigital = () => {
    if (issueInfo && issueId) {
      addItem({
        id: `digital-${issueId}`,
        name: `Info Pêche ${issueInfo.issue_number} (Numérique)`,
        price: (issueInfo.price_cents || 300) / 100,
        description: issueInfo.title,
      });
    }
  };

  // Prevent right-click and keyboard shortcuts
  useEffect(() => {
    const preventContext = (e: MouseEvent) => e.preventDefault();
    const preventKeys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "p")) {
        e.preventDefault();
      }
    };
    document.addEventListener("contextmenu", preventContext);
    document.addEventListener("keydown", preventKeys);
    return () => {
      document.removeEventListener("contextmenu", preventContext);
      document.removeEventListener("keydown", preventKeys);
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") goToPage(currentPage + 1);
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") goToPage(currentPage - 1);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [currentPage, numPages, previewPages, isPreview]);

  if (!issueId) {
    return (
      <div className="min-h-screen bg-foreground flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold mb-4">Aucun numéro sélectionné</h1>
          <Link to="/boutique">
            <Button variant="outline" className="text-white border-white/30 hover:bg-white/10">
              Retour à la boutique
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Loading state for preview
  if (isPreview && verifying) {
    return (
      <div className="min-h-screen bg-foreground flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" />
          <p>Chargement de l'aperçu…</p>
        </div>
      </div>
    );
  }

  // Access gate (only for non-preview mode)
  if (!isPreview && !verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-foreground via-foreground/95 to-primary/20 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center border border-border/50"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
            Accédez à votre magazine
          </h1>
          <p className="text-muted-foreground mb-6 text-sm">
            Entrez l'email utilisé lors de votre achat pour accéder à votre numéro.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              verifyAccess();
            }}
            className="space-y-4"
          >
            <Input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="text-center"
            />
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-full py-5 font-bold"
              disabled={verifying}
            >
              {verifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Vérification…
                </>
              ) : (
                "Accéder au magazine"
              )}
            </Button>
          </form>
          <Link
            to="/boutique"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mt-6"
          >
            <ArrowLeft className="w-3 h-3" /> Retour à la boutique
          </Link>
        </motion.div>
      </div>
    );
  }

  const displayPages = isPreview ? Math.min(previewPages, numPages || previewPages) : numPages;
  const isOnLastPreviewPage = isPreview && currentPage >= displayPages && numPages > 0;

  // PDF Viewer
  return (
    <div className="min-h-screen bg-foreground/95 flex flex-col select-none" style={{ userSelect: "none" }}>
      {/* Toolbar */}
      <header className="bg-foreground border-b border-white/10 px-4 py-3 flex items-center justify-between z-50">
        <Link
          to="/boutique"
          className="text-white/70 hover:text-white text-sm flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>

        <div className="flex items-center gap-2 text-white">
          {isPreview && (
            <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full mr-2 flex items-center gap-1">
              <Eye className="w-3 h-3" /> Aperçu
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <span className="text-sm font-medium min-w-[80px] text-center">
            {currentPage} / {displayPages || "—"}
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= displayPages}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.15))}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-white/60 text-xs w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => setScale((s) => Math.min(2.5, s + 0.15))}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10 ml-1"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      {/* Preview banner */}
      {isPreview && (
        <div className="bg-amber-500/90 text-white text-center py-2 px-4 text-sm font-semibold flex items-center justify-center gap-2">
          <Eye className="w-4 h-4" />
          <span>Aperçu gratuit — Vous consultez les {previewPages} premières pages sur {numPages > 0 ? numPages : '…'} pages</span>
          <Button
            size="sm"
            variant="secondary"
            className="ml-3 bg-white text-amber-700 hover:bg-white/90 rounded-full px-4 py-1 text-xs font-bold"
            onClick={handleBuyDigital}
          >
            Acheter le numéro complet
          </Button>
        </div>
      )}

      {/* PDF Content */}
      <div className="flex-1 overflow-auto flex items-start justify-center py-8 relative">
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center justify-center h-[60vh] text-white/60">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="text-sm">Chargement du magazine…</p>
            </div>
          }
          error={
            <div className="text-center text-white/60 py-20">
              <p className="text-lg mb-2">Impossible de charger le magazine</p>
              <p className="text-sm">Veuillez réessayer plus tard.</p>
            </div>
          }
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                className="shadow-2xl rounded-lg overflow-hidden"
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </motion.div>
          </AnimatePresence>
        </Document>

        {/* Preview paywall overlay on last preview page */}
        {isOnLastPreviewPage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground via-foreground/95 to-transparent pt-32 pb-8 px-4"
          >
            <div className="max-w-md mx-auto text-center">
              <Lock className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="text-white text-xl font-serif font-bold mb-2">
                Envie de lire la suite ?
              </h3>
              <p className="text-white/60 text-sm mb-6">
                Vous avez consulté les {previewPages} premières pages. Achetez ce numéro pour accéder à l'intégralité du magazine.
              </p>
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-5 font-bold shadow-xl"
                onClick={handleBuyDigital}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Acheter ce numéro — {((issueInfo?.price_cents || 300) / 100).toFixed(2)}€
              </Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Page strip */}
      {displayPages > 0 && (
        <div className="bg-foreground border-t border-white/10 px-4 py-2 flex items-center justify-center gap-1 overflow-x-auto">
          {Array.from({ length: displayPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`w-8 h-8 rounded text-xs font-medium transition-all ${
                page === currentPage
                  ? "bg-primary text-white"
                  : "bg-white/10 text-white/50 hover:bg-white/20 hover:text-white"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      {/* Preview bottom CTA bar */}
      {isPreview && !isOnLastPreviewPage && (
        <div className="bg-foreground border-t border-white/10 px-4 py-3 flex items-center justify-center">
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 font-bold"
            onClick={handleBuyDigital}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Acheter ce numéro — {((issueInfo?.price_cents || 300) / 100).toFixed(2)}€
          </Button>
        </div>
      )}

      <SideCart />
    </div>
  );
};

const MagazineViewer = () => {
  return <MagazineViewerContent />;
};

export default MagazineViewer;
