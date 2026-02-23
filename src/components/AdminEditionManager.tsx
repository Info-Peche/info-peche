import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload, Save, Youtube, Image, List, CheckCircle } from "lucide-react";

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
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data: row } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "current_edition")
        .single();
      if (row) {
        const val = row.value as any;
        setData({
          issue_number: val.issue_number || DEFAULTS.issue_number,
          issue_period: val.issue_period || DEFAULTS.issue_period,
          youtube_video_id: val.youtube_video_id || DEFAULTS.youtube_video_id,
          cover_image: val.cover_image || "",
          highlights: val.highlights?.length >= 4 ? val.highlights : DEFAULTS.highlights,
        });
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

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .update({ value: data as any, updated_at: new Date().toISOString() } as any)
      .eq("key", "current_edition");
    setSaving(false);
    if (error) {
      toast.error("Erreur : " + error.message);
    } else {
      setSaved(true);
      toast.success("Édition du mois mise à jour !");
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const updateHighlight = (index: number, value: string) => {
    setData((d) => {
      const highlights = [...d.highlights];
      highlights[index] = value;
      return { ...d, highlights };
    });
  };

  const extractYoutubeId = (input: string) => {
    // Accept full URLs or just IDs
    const match = input.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
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
            onChange={(e) => setData((d) => ({ ...d, issue_number: e.target.value }))}
            placeholder="N°101"
          />
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
          onChange={(e) => setData((d) => ({ ...d, youtube_video_id: extractYoutubeId(e.target.value) }))}
          placeholder="ID ou URL YouTube (ex: gwYLuVXP-Ik)"
        />
        {data.youtube_video_id && (
          <div className="mt-3 rounded-xl overflow-hidden border border-border aspect-video max-w-sm">
            <img
              src={`https://img.youtube.com/vi/${data.youtube_video_id}/mqdefault.jpg`}
              alt="Aperçu vidéo"
              className="w-full h-full object-cover"
            />
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
