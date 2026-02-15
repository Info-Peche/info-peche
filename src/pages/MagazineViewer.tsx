import { useState, useCallback, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const MagazineViewer = () => {
  const [searchParams] = useSearchParams();
  const issueId = searchParams.get("issue");

  const [email, setEmail] = useState(() => localStorage.getItem("reader_email") || "");
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // Auto-verify if email is saved
  useEffect(() => {
    if (email && issueId && !verified) {
      verifyAccess();
    }
  }, [issueId]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= numPages) setCurrentPage(page);
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
  }, [currentPage, numPages]);

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

  // Access gate
  if (!verified) {
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
            {currentPage} / {numPages || "—"}
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= numPages}
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

      {/* PDF Content */}
      <div className="flex-1 overflow-auto flex items-start justify-center py-8">
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
      </div>

      {/* Page strip */}
      {numPages > 0 && (
        <div className="bg-foreground border-t border-white/10 px-4 py-2 flex items-center justify-center gap-1 overflow-x-auto">
          {Array.from({ length: numPages }, (_, i) => i + 1).map((page) => (
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
    </div>
  );
};

export default MagazineViewer;
