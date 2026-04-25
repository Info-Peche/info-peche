import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload, Save, Youtube, Image, List, CheckCircle, AlertTriangle, Store, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EditionData {
  issue_number: string;
  issue_period: string;
  youtube_video_id: string;
  cover_image: string;
  highlights: string[];
}

const DEFAULTS: EditionData = {
  issue_number: "N°100",
  issue_period: "Janvier 2026",
  youtube_video_id: "gwYLuVXP-Ik",
  cover_image: "",
  highlights: ["", "", "", ""],
};

const AdminEditionManager = () => {
  const [data, setData] = useState<EditionData>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shopMatch, setShopMatch] = useState<{ found: boolean; isCurrent: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [currentPdfName, setCurrentPdfName] = useState<string | null>(null);

  // Extract plain number from "N°101" → "101"
  const extractPlainNumber = (input: string) => input.replace(/[^0-9]/g, "");

  // Check if issue_number exists in digital_issues
  const checkShopMatch = async (issueNumber: string) => {
    const plain = extractPlainNumber(issueNumber);
    if (!plain) { setShopMatch(null); return; }
    const { data: issues } = await supabase
      .from("digital_issues")
      .select("issue_number, is_current, pdf_url")
      .or(`issue_number.eq.${plain},issue_number.eq.N°${plain}`);
    if (issues && issues.length > 0) {
      setShopMatch({ found: true, isCurrent: issues[0].is_current ?? false });
      setCurrentPdfName(issues[0].pdf_url ?? null);
    } else {
      setShopMatch({ found: false, isCurrent: false });
      setCurrentPdfName(null);
    }
  };

  useEffect(() => {
    const fetch = async () => {
      const { data: row } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "current_edition")
        .single();
      if (row) {
        const val = row.value as any;
        const editionData = {
          issue_number: val.issue_number || DEFAULTS.issue_number,
          issue_period: val.issue_period || DEFAULTS.issue_period,
          youtube_video_id: val.youtube_video_id || DEFAULTS.youtube_video_id,
          cover_image: val.cover_image || "",
          highlights: val.highlights?.length >= 4 ? val.highlights : DEFAULTS.highlights,
        };
        setData(editionData);
        checkShopMatch(editionData.issue_number);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleCoverUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image trop volumineuse (max 5 Mo)");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `cover-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("magazine-covers").upload(path, file);
    if (error) {
      toast.error("Erreur d'upload : " + error.message);
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("magazine-covers").getPublicUrl(path);
    setData((d) => ({ ...d, cover_image: urlData.publicUrl }));
    setUploading(false);
    toast.success("Couverture uploadée !");
  };

  const handlePdfUpload = async (file: File) => {
    if (!file) return;
    const plain = extractPlainNumber(data.issue_number);
    if (!plain) {
      toast.error("Renseignez d'abord le numéro de l'édition");
      return;
    }
    if (!shopMatch?.found) {
      toast.error(`Le numéro N°${plain} n'existe pas en boutique. Créez-le d'abord dans l'onglet Stock.`);
      return;
    }
    if (file.type !== "application/pdf") {
      toast.error("Le fichier doit être un PDF");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("PDF trop volumineux (max 50 Mo)");
      return;
    }

    setPdfUploading(true);
    const t = toast.loading("Upload du PDF en cours…");
    try {
      const path = `IP${plain}.pdf`;
      const { error: upErr } = await supabase.storage
        .from("magazine-pdfs")
        .upload(path, file, { contentType: "application/pdf", upsert: true });
      if (upErr) throw new Error(upErr.message);

      // Update pdf_url on the matching issue (try plain and N° variants)
      const { error: updErr } = await supabase
        .from("digital_issues")
        .update({ pdf_url: path } as any)
        .or(`issue_number.eq.${plain},issue_number.eq.N°${plain}`);
      if (updErr) throw new Error(updErr.message);

      setCurrentPdfName(path);
      toast.success(`PDF du N°${plain} mis en ligne !`, { id: t });
    } catch (e: any) {
      toast.error("Erreur : " + (e.message || "upload échoué"), { id: t });
    } finally {
      setPdfUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .update({ value: data as any, updated_at: new Date().toISOString() } as any)
      .eq("key", "current_edition");
    
    if (error) {
      setSaving(false);
      toast.error("Erreur : " + error.message);
      return;
    }

    // Sync is_current in digital_issues
    const plain = extractPlainNumber(data.issue_number);
    if (plain) {
      // Reset all issues
      await supabase.from("digital_issues").update({ is_current: false } as any).neq("issue_number", "___");
      // Set new current
      const { data: matched } = await supabase
        .from("digital_issues")
        .update({ is_current: true } as any)
        .or(`issue_number.eq.${plain},issue_number.eq.N°${plain}`)
        .select("id");
      
      if (matched && matched.length > 0) {
        toast.success("Édition du mois et boutique mises à jour !");
        setShopMatch({ found: true, isCurrent: true });
      } else {
        toast.warning("Édition du mois sauvegardée, mais aucun numéro correspondant trouvé dans la boutique. Pensez à le créer dans l'onglet Stock.");
        setShopMatch({ found: false, isCurrent: false });
      }
    } else {
      toast.success("Édition du mois mise à jour !");
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateHighlight = (index: number, value: string) => {
    setData((d) => {
      const highlights = [...d.highlights];
      highlights[index] = value;
      return { ...d, highlights };
    });
  };

  const [thumbError, setThumbError] = useState(false);

  const extractYoutubeId = (input: string) => {
    const match = input.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : input.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 11);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="text-xl font-serif font-bold text-foreground mb-1">🎣 Édition du Mois</h2>
        <p className="text-sm text-muted-foreground">
          Mettez à jour le contenu affiché sur la page d'accueil et les formules d'abonnement.
        </p>
      </div>

      {/* Numéro & Période */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Numéro</label>
          <Input
            value={data.issue_number}
            onChange={(e) => {
              setData((d) => ({ ...d, issue_number: e.target.value }));
              checkShopMatch(e.target.value);
            }}
            placeholder="N°101"
          />
          {shopMatch !== null && (
            <div className="mt-1.5">
              {shopMatch.found ? (
                <div className="flex items-center gap-1.5 text-xs">
                  <Store className="w-3.5 h-3.5 text-primary" />
                  <span className="text-muted-foreground">
                    Trouvé en boutique
                    {shopMatch.isCurrent ? (
                      <Badge variant="default" className="ml-1.5 text-[10px] px-1.5 py-0">En cours</Badge>
                    ) : (
                      <span className="text-muted-foreground/70"> — sera marqué « en cours » à la sauvegarde</span>
                    )}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-amber-600">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Numéro introuvable en boutique — créez-le dans l'onglet Stock</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Période</label>
          <Input
            value={data.issue_period}
            onChange={(e) => setData((d) => ({ ...d, issue_period: e.target.value }))}
            placeholder="Février 2026"
          />
        </div>
      </div>

      {/* YouTube */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
          <Youtube className="w-4 h-4 text-red-500" /> Vidéo YouTube
        </label>
        <Input
          value={data.youtube_video_id}
          onChange={(e) => {
            setThumbError(false);
            setData((d) => ({ ...d, youtube_video_id: extractYoutubeId(e.target.value) }));
          }}
          placeholder="ID ou URL YouTube (ex: gwYLuVXP-Ik)"
        />
        {data.youtube_video_id && (
          <div className="mt-3">
            {thumbError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 max-w-sm">
                <p className="text-sm font-medium text-destructive">⚠️ Miniature indisponible</p>
                <p className="text-xs text-muted-foreground mt-1">
                  La vidéo YouTube <code className="bg-muted px-1 rounded">{data.youtube_video_id}</code> n'a pas de miniature.
                  Vérifiez que la vidéo est bien <strong>publiée et publique</strong> sur YouTube.
                </p>
                <a
                  href={`https://www.youtube.com/watch?v=${data.youtube_video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary underline mt-2 inline-block"
                >
                  Vérifier sur YouTube →
                </a>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden border border-border aspect-video max-w-sm bg-muted">
                <img
                  src={`https://img.youtube.com/vi/${data.youtube_video_id}/mqdefault.jpg`}
                  alt="Aperçu vidéo"
                  className="w-full h-full object-cover"
                  onLoad={(e) => {
                    const img = e.target as HTMLImageElement;
                    // YouTube returns a tiny 120x90 grey placeholder for invalid videos
                    if (img.naturalWidth <= 120) setThumbError(true);
                  }}
                  onError={() => setThumbError(true)}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Couverture */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
          <Image className="w-4 h-4" /> Image de couverture
        </label>
        <div className="flex items-start gap-4">
          {data.cover_image && (
            <div className="w-28 h-36 rounded-lg overflow-hidden border border-border shadow-sm shrink-0">
              <img src={data.cover_image} alt="Couverture" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="space-y-2 flex-1">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleCoverUpload(e.target.files[0])}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {uploading ? "Upload en cours…" : "Charger une image"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Format recommandé : 800×1100 px, max 5 Mo. Cette image sera utilisée dans les offres d'abonnement et le panier.
            </p>
          </div>
        </div>
      </div>

      {/* PDF du magazine */}
      <div>
        <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
          <FileText className="w-4 h-4" /> PDF du magazine
        </label>
        <div className="space-y-2">
          <input
            ref={pdfRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handlePdfUpload(e.target.files[0])}
          />
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pdfRef.current?.click()}
              disabled={pdfUploading || !shopMatch?.found}
            >
              {pdfUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {pdfUploading ? "Upload en cours…" : currentPdfName ? "Remplacer le PDF" : "Charger le PDF"}
            </Button>
            {currentPdfName && (
              <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                {currentPdfName}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {shopMatch?.found
              ? <>Le PDF sera enregistré sous <code className="bg-muted px-1 rounded">IP{extractPlainNumber(data.issue_number)}.pdf</code> dans le stockage privé et associé au numéro en boutique. Max 50 Mo.</>
              : "Renseignez un numéro existant en boutique pour activer l'upload (sinon créez-le d'abord dans l'onglet Stock)."}
          </p>
        </div>
      </div>

      {/* 4 points clés */}
      <div>
        <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
          <List className="w-4 h-4" /> 4 points clés du numéro
        </label>
        <div className="space-y-3">
          {data.highlights.map((h, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground w-5 shrink-0">{i + 1}.</span>
              <Input
                value={h}
                onChange={(e) => updateHighlight(i, e.target.value)}
                placeholder={`Point clé ${i + 1} (ex: Dossier spécial : Les amorces d'hiver)`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="pt-4 border-t border-border">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8"
        >
          {saving ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement…</>
          ) : saved ? (
            <><CheckCircle className="w-4 h-4 mr-2" /> Enregistré !</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Publier les modifications</>
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Les modifications seront visibles immédiatement sur le site.
        </p>
      </div>
    </div>
  );
};

export default AdminEditionManager;
