import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, PackageOpen, AlertTriangle, Check, Search, ArrowUpDown, ArrowUp, ArrowDown, Monitor, BookOpen, Plus, Upload, FileText, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { compressImageFile } from "@/lib/imageUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Issue = {
  id: string;
  issue_number: string;
  title: string;
  cover_image: string | null;
  physical_stock: number | null;
  physical_price_cents: number | null;
  price_cents: number | null;
  is_current: boolean | null;
  is_archived: boolean | null;
  published_at: string | null;
  pdf_url: string | null;
};

type EditState = {
  physical_stock: string;
  physical_price_cents: string;
  price_cents: string;
};

type SortKey = "issue_number" | "physical_stock";
type SortDir = "asc" | "desc";
type AvailFilter = "all" | "paper" | "digital_only" | "out_of_stock";

const AdminStockManager = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, EditState>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("issue_number");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [availFilter, setAvailFilter] = useState<AvailFilter>("all");

  // Create new issue dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newIssue, setNewIssue] = useState({
    issue_number: "",
    period: "",
    physical_stock: "100",
    physical_price_euros: "6.50",
    price_euros: "3.00",
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const fetchIssues = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("digital_issues")
      .select("id, issue_number, title, cover_image, physical_stock, physical_price_cents, price_cents, is_current, is_archived, published_at, pdf_url")
      .order("issue_number", { ascending: false });
    if (!error && data) setIssues(data);
    setLoading(false);
  };

  useEffect(() => { fetchIssues(); }, []);

  // Suggest next issue number when opening dialog
  const openCreateDialog = () => {
    const maxNum = issues.reduce((max, i) => {
      const n = parseInt(i.issue_number, 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    setNewIssue({
      issue_number: maxNum > 0 ? String(maxNum + 1) : "",
      period: "",
      physical_stock: "100",
      physical_price_euros: "6.50",
      price_euros: "3.00",
    });
    setCoverFile(null);
    setCoverPreview(null);
    setCreateOpen(true);
  };

  const handleCoverPick = async (file: File | null) => {
    if (!file) {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverFile(null);
      setCoverPreview(null);
      return;
    }
    let finalFile = file;
    if (file.size > 5 * 1024 * 1024) {
      const t = toast.loading("Compression de la couverture…");
      try {
        finalFile = await compressImageFile(file, 5 * 1024 * 1024);
        if (finalFile.size > 5 * 1024 * 1024) {
          toast.error("Impossible de compresser sous 5 Mo, choisissez une image plus petite", { id: t });
          return;
        }
        const before = (file.size / 1024 / 1024).toFixed(1);
        const after = (finalFile.size / 1024 / 1024).toFixed(1);
        toast.success(`Couverture compressée (${before} Mo → ${after} Mo)`, { id: t });
      } catch (e: any) {
        toast.error(e.message || "Erreur de compression", { id: t });
        return;
      }
    }
    setCoverFile(finalFile);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(URL.createObjectURL(finalFile));
  };

  const createIssue = async () => {
    const num = newIssue.issue_number.trim().replace(/[^0-9]/g, "");
    const period = newIssue.period.trim();
    if (!num) { toast.error("Numéro requis"); return; }
    if (!period) { toast.error("Période requise (ex : Mai-Juin 2026)"); return; }
    if (issues.some(i => i.issue_number === num)) {
      toast.error(`Le numéro ${num} existe déjà`);
      return;
    }
    const physical_stock = parseInt(newIssue.physical_stock, 10);
    const physical_price_cents = Math.round(parseFloat(newIssue.physical_price_euros) * 100);
    const price_cents = Math.round(parseFloat(newIssue.price_euros) * 100);
    if (isNaN(physical_stock) || isNaN(physical_price_cents) || isNaN(price_cents)) {
      toast.error("Valeurs numériques invalides");
      return;
    }

    setCreating(true);
    try {
      // Build period slug for filenames: "Mai-Juin 2026" → "mai-juin_2026"
      const buildPeriodSlug = (p: string) => {
        const normalized = p.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const yearMatch = normalized.match(/(19|20)\d{2}/);
        const year = yearMatch ? yearMatch[0] : "";
        const withoutYear = normalized.replace(/(19|20)\d{2}/, "").trim();
        const months = withoutYear.split(/[\s\-_/,]+/).map((m) => m.trim()).filter(Boolean).join("-");
        return months && year ? `${months}_${year}` : "";
      };
      const periodSlug = buildPeriodSlug(period);

      // Upload cover (optional but recommended)
      let cover_image: string | null = null;
      if (coverFile) {
        const ext = coverFile.name.split(".").pop() || "jpg";
        const path = periodSlug
          ? `IP${num}_${periodSlug}_couverture.${ext}`
          : `IP${num}_couverture.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("magazine-covers")
          .upload(path, coverFile, { upsert: true, contentType: coverFile.type });
        if (upErr) throw new Error("Upload couverture : " + upErr.message);
        const { data: urlData } = supabase.storage.from("magazine-covers").getPublicUrl(path);
        cover_image = urlData.publicUrl;
      }

      const title = `Info Pêche n°${num} - ${period}`;
      const { data: inserted, error: insErr } = await supabase
        .from("digital_issues")
        .insert({
          issue_number: num,
          title,
          cover_image,
          physical_stock,
          physical_price_cents,
          price_cents,
        } as any)
        .select()
        .single();

      if (insErr) throw new Error(insErr.message);

      toast.success(`Numéro ${num} créé !`);
      setCreateOpen(false);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverPreview(null);
      await fetchIssues();
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="w-3 h-3 ml-1" />
      : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const hasPaper = (issue: Issue) => (issue.physical_stock ?? 0) > 0;
  const hasDigital = (issue: Issue) => !!issue.pdf_url || (issue.price_cents ?? 0) > 0;

  const filteredAndSorted = useMemo(() => {
    let list = [...issues];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i =>
        i.issue_number.toLowerCase().includes(q) ||
        i.title.toLowerCase().includes(q)
      );
    }

    // Filter
    if (availFilter === "paper") list = list.filter(hasPaper);
    else if (availFilter === "digital_only") list = list.filter(i => !hasPaper(i) && hasDigital(i));
    else if (availFilter === "out_of_stock") list = list.filter(i => !hasPaper(i) && !hasDigital(i) || (i.physical_stock !== null && i.physical_stock === 0));

    // Sort
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "issue_number") {
        cmp = parseInt(a.issue_number) - parseInt(b.issue_number);
      } else if (sortKey === "physical_stock") {
        cmp = (a.physical_stock ?? -1) - (b.physical_stock ?? -1);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [issues, search, sortKey, sortDir, availFilter]);

  const startEdit = (issue: Issue) => {
    setEditing(prev => ({
      ...prev,
      [issue.id]: {
        physical_stock: String(issue.physical_stock ?? 0),
        physical_price_cents: ((issue.physical_price_cents ?? 0) / 100).toFixed(2),
        price_cents: ((issue.price_cents ?? 0) / 100).toFixed(2),
      },
    }));
  };

  const cancelEdit = (id: string) => {
    setEditing(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const saveEdit = async (id: string) => {
    const edit = editing[id];
    if (!edit) return;
    const physical_stock = parseInt(edit.physical_stock, 10);
    const physical_price_cents = Math.round(parseFloat(edit.physical_price_cents) * 100);
    const price_cents = Math.round(parseFloat(edit.price_cents) * 100);
    if (isNaN(physical_stock) || isNaN(physical_price_cents) || isNaN(price_cents)) {
      toast.error("Valeurs invalides");
      return;
    }
    setSaving(id);
    const { error } = await supabase
      .from("digital_issues")
      .update({ physical_stock, physical_price_cents, price_cents })
      .eq("id", id);
    if (error) {
      toast.error("Erreur lors de la sauvegarde");
    } else {
      toast.success("Stock et prix mis à jour");
      setIssues(prev => prev.map(i => i.id === id ? { ...i, physical_stock, physical_price_cents, price_cents } : i));
      cancelEdit(id);
    }
    setSaving(null);
  };

  const updateField = (id: string, field: keyof EditState, value: string) => {
    setEditing(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const getStockBadge = (stock: number | null) => {
    if (stock === null || stock === undefined) return <Badge variant="outline" className="text-xs">N/A</Badge>;
    if (stock === 0) return <Badge variant="destructive" className="text-xs gap-1"><AlertTriangle className="w-3 h-3" /> Rupture</Badge>;
    if (stock <= 15) return <Badge className="text-xs bg-orange-500/90 hover:bg-orange-500 gap-1"><AlertTriangle className="w-3 h-3" /> {stock}</Badge>;
    return <Badge variant="secondary" className="text-xs gap-1"><Check className="w-3 h-3" /> {stock}</Badge>;
  };

  const getAvailabilityBadge = (issue: Issue) => {
    const paper = hasPaper(issue);
    const digital = hasDigital(issue);

    if (paper && digital) {
      return (
        <div className="flex items-center justify-center gap-1.5">
          <Badge variant="default" className="text-xs gap-1"><BookOpen className="w-3 h-3" /> Papier</Badge>
          <Badge variant="secondary" className="text-xs gap-1"><Monitor className="w-3 h-3" /> Digital</Badge>
        </div>
      );
    }
    if (digital) {
      return <Badge variant="secondary" className="text-xs gap-1"><Monitor className="w-3 h-3" /> Digital uniquement</Badge>;
    }
    if (paper) {
      return <Badge variant="default" className="text-xs gap-1"><BookOpen className="w-3 h-3" /> Papier uniquement</Badge>;
    }
    return <Badge variant="destructive" className="text-xs">Indisponible</Badge>;
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
      </div>
    );
  }

  const filterButtons: { key: AvailFilter; label: string }[] = [
    { key: "all", label: "Tous" },
    { key: "paper", label: "Dispo papier" },
    { key: "digital_only", label: "Digital uniquement" },
    { key: "out_of_stock", label: "Rupture / Indisponible" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <PackageOpen className="w-5 h-5 text-primary" />
          Gestion des stocks & tarifs
        </h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{filteredAndSorted.length} / {issues.length} numéros</Badge>
          <Button size="sm" onClick={openCreateDialog} className="h-8 gap-1.5">
            <Plus className="w-4 h-4" /> Nouveau numéro
          </Button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par numéro ou titre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {filterButtons.map(f => (
            <Button
              key={f.key}
              size="sm"
              variant={availFilter === f.key ? "default" : "outline"}
              className="h-8 text-xs"
              onClick={() => setAvailFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th
                  className="h-12 px-4 text-left font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => toggleSort("issue_number")}
                >
                  <span className="flex items-center">Numéro {getSortIcon("issue_number")}</span>
                </th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Titre</th>
                <th className="h-12 px-4 text-center font-medium text-muted-foreground">Disponibilité</th>
                <th
                  className="h-12 px-4 text-center font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                  onClick={() => toggleSort("physical_stock")}
                >
                  <span className="flex items-center justify-center">Stock physique {getSortIcon("physical_stock")}</span>
                </th>
                <th className="h-12 px-4 text-center font-medium text-muted-foreground">Prix papier (€)</th>
                <th className="h-12 px-4 text-center font-medium text-muted-foreground">Prix digital (€)</th>
                <th className="h-12 px-4 text-center font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map(issue => {
                const isEditing = !!editing[issue.id];
                const edit = editing[issue.id];

                return (
                  <tr key={issue.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="px-4 py-3 font-bold whitespace-nowrap">
                      N°{issue.issue_number}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {issue.cover_image && (
                          <img
                            src={issue.cover_image}
                            alt={issue.title}
                            className="w-8 h-11 object-cover rounded shadow-sm flex-shrink-0"
                          />
                        )}
                        <span className="truncate max-w-[200px]">{issue.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getAvailabilityBadge(issue)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <Input
                          type="number"
                          min={0}
                          value={edit.physical_stock}
                          onChange={e => updateField(issue.id, "physical_stock", e.target.value)}
                          className="w-20 mx-auto text-center h-8 text-xs"
                        />
                      ) : (
                        getStockBadge(issue.physical_stock)
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={edit.physical_price_cents}
                          onChange={e => updateField(issue.id, "physical_price_cents", e.target.value)}
                          className="w-20 mx-auto text-center h-8 text-xs"
                        />
                      ) : (
                        <span>{issue.physical_price_cents ? (issue.physical_price_cents / 100).toFixed(2) + " €" : "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={edit.price_cents}
                          onChange={e => updateField(issue.id, "price_cents", e.target.value)}
                          className="w-20 mx-auto text-center h-8 text-xs"
                        />
                      ) : (
                        <span>{issue.price_cents ? (issue.price_cents / 100).toFixed(2) + " €" : "—"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 text-xs"
                            onClick={() => saveEdit(issue.id)}
                            disabled={saving === issue.id}
                          >
                            {saving === issue.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                            Sauver
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => cancelEdit(issue.id)}
                          >
                            Annuler
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => startEdit(issue)}
                        >
                          Modifier
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredAndSorted.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted-foreground">
                    Aucun numéro trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create new issue dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => !creating && setCreateOpen(o)}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau numéro</DialogTitle>
            <DialogDescription>
              Crée un numéro dans la boutique avec un stock initial de 100 (modifiable ensuite).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Numéro *</label>
                <Input
                  value={newIssue.issue_number}
                  onChange={(e) => setNewIssue(s => ({ ...s, issue_number: e.target.value.replace(/[^0-9]/g, "") }))}
                  placeholder="101"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Période *</label>
                <Input
                  value={newIssue.period}
                  onChange={(e) => setNewIssue(s => ({ ...s, period: e.target.value }))}
                  placeholder="Mai-Juin 2026"
                />
              </div>
            </div>

            {newIssue.issue_number && newIssue.period && (
              <p className="text-xs text-muted-foreground">
                Titre : <span className="font-medium text-foreground">Info Pêche n°{newIssue.issue_number} - {newIssue.period}</span>
              </p>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Stock papier</label>
                <Input
                  type="number"
                  min={0}
                  value={newIssue.physical_stock}
                  onChange={(e) => setNewIssue(s => ({ ...s, physical_stock: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Prix papier (€)</label>
                <Input
                  type="number"
                  step={0.01}
                  min={0}
                  value={newIssue.physical_price_euros}
                  onChange={(e) => setNewIssue(s => ({ ...s, physical_price_euros: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Prix digital (€)</label>
                <Input
                  type="number"
                  step={0.01}
                  min={0}
                  value={newIssue.price_euros}
                  onChange={(e) => setNewIssue(s => ({ ...s, price_euros: e.target.value }))}
                />
              </div>
            </div>

            {/* Cover */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" /> Couverture (JPG/PNG)
              </label>
              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleCoverPick(e.target.files?.[0] || null)}
                />
                <div className="border border-dashed border-border rounded-lg p-3 hover:border-primary transition-colors flex items-center gap-3">
                  {coverPreview ? (
                    <img src={coverPreview} alt="Aperçu" className="w-12 h-16 object-cover rounded shrink-0" />
                  ) : (
                    <div className="w-12 h-16 bg-muted rounded flex items-center justify-center shrink-0">
                      <Upload className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground truncate">
                    {coverFile ? coverFile.name : "Choisir un fichier"}
                  </span>
                </div>
              </label>
              <p className="text-xs text-muted-foreground mt-1.5">
                Le PDF du magazine s'upload depuis l'onglet « Édition du mois ».
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={creating}>
              Annuler
            </Button>
            <Button onClick={createIssue} disabled={creating}>
              {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Création…</> : <><Plus className="w-4 h-4 mr-2" /> Créer le numéro</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStockManager;
