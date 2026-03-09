import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, MapPin, Search, Upload, Loader2, Fish, Waves, TreePine } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

type FishingSpot = {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  department: string | null;
  city: string | null;
  description: string | null;
  issue_number: string | null;
  google_maps_url: string | null;
  fish_species: string[] | null;
  created_at: string;
};

const typeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  plan_eau: { label: "Plan d'eau", icon: <Waves className="h-4 w-4" /> },
  carpodrome: { label: "Carpodrome", icon: <Fish className="h-4 w-4" /> },
  riviere: { label: "Rivière", icon: <TreePine className="h-4 w-4" /> },
};

const emptySpot = {
  name: "",
  type: "plan_eau",
  latitude: 46.6,
  longitude: 2.5,
  department: "",
  city: "",
  description: "",
  issue_number: "",
  google_maps_url: "",
  fish_species_text: "",
};

const AdminFishingSpots = () => {
  const [spots, setSpots] = useState<FishingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptySpot);
  const [saving, setSaving] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);

  const fetchSpots = async () => {
    setLoading(true);
    const { data } = await supabase.from("fishing_spots").select("*").order("name");
    if (data) setSpots(data as unknown as FishingSpot[]);
    setLoading(false);
  };

  useEffect(() => { fetchSpots(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptySpot);
    setDialogOpen(true);
  };

  const openEdit = (spot: FishingSpot) => {
    setEditingId(spot.id);
    setForm({
      name: spot.name,
      type: spot.type,
      latitude: spot.latitude,
      longitude: spot.longitude,
      department: spot.department || "",
      city: spot.city || "",
      description: spot.description || "",
      issue_number: spot.issue_number || "",
      google_maps_url: spot.google_maps_url || "",
      fish_species_text: (spot.fish_species || []).join(", "),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Le nom est requis"); return; }
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      type: form.type,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      department: form.department || null,
      city: form.city || null,
      description: form.description || null,
      issue_number: form.issue_number || null,
      google_maps_url: form.google_maps_url || null,
      fish_species: form.fish_species_text
        ? form.fish_species_text.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [],
    };

    if (editingId) {
      const { error } = await supabase.from("fishing_spots").update(payload as any).eq("id", editingId);
      if (error) { toast.error("Erreur: " + error.message); setSaving(false); return; }
      toast.success("Spot mis à jour");
    } else {
      const { error } = await supabase.from("fishing_spots").insert(payload as any);
      if (error) { toast.error("Erreur: " + error.message); setSaving(false); return; }
      toast.success("Spot créé");
    }

    setSaving(false);
    setDialogOpen(false);
    fetchSpots();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("fishing_spots").delete().eq("id", id);
    if (error) { toast.error("Erreur: " + error.message); return; }
    setSpots((prev) => prev.filter((s) => s.id !== id));
    toast.success("Spot supprimé");
  };

  const handleImportCSV = async () => {
    if (!csvText.trim()) { toast.error("Collez des données CSV"); return; }
    setImporting(true);

    try {
      const lines = csvText.trim().split("\n");
      const header = lines[0].split(";").map((h) => h.trim().toLowerCase());

      const nameIdx = header.findIndex((h) => h.includes("nom") || h === "name");
      const typeIdx = header.findIndex((h) => h.includes("type"));
      const latIdx = header.findIndex((h) => h.includes("lat"));
      const lngIdx = header.findIndex((h) => h.includes("lon") || h.includes("lng"));
      const deptIdx = header.findIndex((h) => h.includes("dep") || h.includes("département"));
      const cityIdx = header.findIndex((h) => h.includes("ville") || h.includes("city") || h.includes("commune"));
      const descIdx = header.findIndex((h) => h.includes("desc"));
      const issueIdx = header.findIndex((h) => h.includes("num") || h.includes("issue"));
      const speciesIdx = header.findIndex((h) => h.includes("esp") || h.includes("species") || h.includes("poisson"));

      if (nameIdx === -1 || latIdx === -1 || lngIdx === -1) {
        toast.error("Colonnes requises: nom, latitude, longitude");
        setImporting(false);
        return;
      }

      const rows = lines.slice(1).filter((l) => l.trim()).map((line) => {
        const cols = line.split(";").map((c) => c.trim().replace(/^"|"$/g, ""));
        return {
          name: cols[nameIdx] || "",
          type: typeIdx >= 0 ? cols[typeIdx] || "plan_eau" : "plan_eau",
          latitude: parseFloat(cols[latIdx]),
          longitude: parseFloat(cols[lngIdx]),
          department: deptIdx >= 0 ? cols[deptIdx] || null : null,
          city: cityIdx >= 0 ? cols[cityIdx] || null : null,
          description: descIdx >= 0 ? cols[descIdx] || null : null,
          issue_number: issueIdx >= 0 ? cols[issueIdx] || null : null,
          fish_species: speciesIdx >= 0 && cols[speciesIdx]
            ? cols[speciesIdx].split(",").map((s: string) => s.trim()).filter(Boolean)
            : [],
        };
      }).filter((r) => r.name && !isNaN(r.latitude) && !isNaN(r.longitude));

      if (rows.length === 0) {
        toast.error("Aucune ligne valide trouvée");
        setImporting(false);
        return;
      }

      const { error } = await supabase.from("fishing_spots").insert(rows as any);
      if (error) { toast.error("Erreur: " + error.message); setImporting(false); return; }

      toast.success(`${rows.length} spots importés avec succès`);
      setImportDialogOpen(false);
      setCsvText("");
      fetchSpots();
    } catch (e: any) {
      toast.error("Erreur de parsing: " + e.message);
    }
    setImporting(false);
  };

  const filtered = spots.filter((s) => {
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q) || s.department?.includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un spot..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Badge variant="outline">{spots.length} spots</Badge>

          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" /> Importer CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Importer des spots (CSV)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Collez vos données CSV avec séparateur <code>;</code>. Colonnes attendues :
                  <code className="block mt-1 bg-muted p-2 rounded text-xs">
                    nom;type;latitude;longitude;département;ville;description;numéro;espèces
                  </code>
                  Types valides : <code>plan_eau</code>, <code>carpodrome</code>, <code>riviere</code>.
                  Les espèces sont séparées par des virgules.
                </p>
                <Textarea
                  rows={12}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder="nom;type;latitude;longitude;département;ville;description;numéro;espèces
Étang du Moulin;plan_eau;46.5;2.3;18;Bourges;Bel étang;95;gardon,brème"
                  className="font-mono text-xs"
                />
                <Button onClick={handleImportCSV} disabled={importing} className="w-full">
                  {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                  Importer
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openCreate}>
                <Plus className="w-4 h-4 mr-2" /> Ajouter un spot
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? "Modifier le spot" : "Nouveau spot"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nom *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plan_eau">Plan d'eau</SelectItem>
                        <SelectItem value="carpodrome">Carpodrome</SelectItem>
                        <SelectItem value="riviere">Rivière</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>N° Info Pêche</Label>
                    <Input value={form.issue_number} onChange={(e) => setForm({ ...form, issue_number: e.target.value })} placeholder="ex: 95" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Latitude *</Label>
                    <Input type="number" step="0.0001" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>Longitude *</Label>
                    <Input type="number" step="0.0001" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Département</Label>
                    <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="ex: 18" />
                  </div>
                  <div>
                    <Label>Ville</Label>
                    <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                </div>
                <div>
                  <Label>Espèces de poissons (séparées par des virgules)</Label>
                  <Input value={form.fish_species_text} onChange={(e) => setForm({ ...form, fish_species_text: e.target.value })} placeholder="gardon, brème, carpe" />
                </div>
                <div>
                  <Label>URL Google Maps (optionnel)</Label>
                  <Input value={form.google_maps_url} onChange={(e) => setForm({ ...form, google_maps_url: e.target.value })} placeholder="https://maps.google.com/..." />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {editingId ? "Enregistrer" : "Créer le spot"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MapPin className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p>Aucun spot trouvé</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nom</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Localisation</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">N°</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Espèces</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((spot) => (
                  <tr key={spot.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 font-medium">{spot.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="gap-1 text-xs">
                        {typeLabels[spot.type]?.icon}
                        {typeLabels[spot.type]?.label || spot.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {spot.city}{spot.department ? ` (${spot.department})` : ""}
                    </td>
                    <td className="px-4 py-3 text-xs">{spot.issue_number || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(spot.fish_species || []).slice(0, 3).map((f) => (
                          <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>
                        ))}
                        {(spot.fish_species || []).length > 3 && (
                          <Badge variant="outline" className="text-[10px]">+{(spot.fish_species || []).length - 3}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(spot)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Supprimer « {spot.name} » ?</AlertDialogTitle>
                              <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(spot.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFishingSpots;
