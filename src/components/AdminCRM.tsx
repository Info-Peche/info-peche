import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Loader2, Download, Edit, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

type Client = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postal_code: string | null;
  country: string | null;
  subscription_type: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  is_active_subscriber: boolean;
  total_orders: number;
  total_spent: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

const AdminCRM = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erreur lors du chargement des clients");
    } else {
      setClients((data as any[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchClients(); }, []);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.email.toLowerCase().includes(q) ||
      (c.first_name || "").toLowerCase().includes(q) ||
      (c.last_name || "").toLowerCase().includes(q) ||
      (c.city || "").toLowerCase().includes(q) ||
      (c.phone || "").toLowerCase().includes(q)
    );
  });

  const handleSave = async () => {
    if (!editClient) return;
    setSaving(true);
    const { error } = await supabase
      .from("clients")
      .update({
        first_name: editClient.first_name,
        last_name: editClient.last_name,
        phone: editClient.phone,
        address_line1: editClient.address_line1,
        address_line2: editClient.address_line2,
        city: editClient.city,
        postal_code: editClient.postal_code,
        country: editClient.country,
        subscription_type: editClient.subscription_type,
        is_active_subscriber: editClient.is_active_subscriber,
        notes: editClient.notes,
      } as any)
      .eq("id", editClient.id);
    setSaving(false);
    if (error) {
      toast.error("Erreur lors de la sauvegarde");
    } else {
      toast.success("Client mis à jour");
      setEditClient(null);
      fetchClients();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce client du CRM ?")) return;
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Client supprimé");
      fetchClients();
    }
  };

  const exportCSV = () => {
    const headers = ["Email", "Prénom", "Nom", "Téléphone", "Adresse", "CP", "Ville", "Pays", "Type abo", "Début abo", "Fin abo", "Actif", "Commandes", "Total dépensé", "Notes", "Créé le"];
    const rows = clients.map((c) => [
      c.email, c.first_name || "", c.last_name || "", c.phone || "",
      c.address_line1 || "", c.postal_code || "", c.city || "", c.country || "",
      c.subscription_type || "", c.subscription_start_date ? new Date(c.subscription_start_date).toLocaleDateString("fr-FR") : "",
      c.subscription_end_date ? new Date(c.subscription_end_date).toLocaleDateString("fr-FR") : "",
      c.is_active_subscriber ? "Oui" : "Non", c.total_orders, (c.total_spent / 100).toFixed(2),
      c.notes || "", new Date(c.created_at).toLocaleDateString("fr-FR"),
    ]);
    const csv = [headers.join(";"), ...rows.map((r) => r.map((v) => `"${v}"`).join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crm-clients-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const subLabel = (type: string | null) => {
    const map: Record<string, string> = {
      "sub-6months": "6 mois",
      "sub-1year": "1 an",
      "sub-2years": "2 ans",
    };
    return type ? map[type] || type : "—";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary" className="gap-1">
          <Users className="w-3 h-3" /> {clients.length} clients
        </Badge>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-2" /> Exporter CSV
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">Aucun client trouvé.</div>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tél</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Abonnement</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Commandes</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Depuis</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {c.first_name || c.last_name ? `${c.first_name || ""} ${c.last_name || ""}`.trim() : "—"}
                  </TableCell>
                  <TableCell className="text-sm">{c.email}</TableCell>
                  <TableCell className="text-sm">{c.phone || "—"}</TableCell>
                  <TableCell className="text-sm">{c.city || "—"}</TableCell>
                  <TableCell><Badge variant="outline">{subLabel(c.subscription_type)}</Badge></TableCell>
                  <TableCell>
                    {c.is_active_subscriber ? (
                      <Badge className="bg-green-100 text-green-800">Actif</Badge>
                    ) : (
                      <Badge variant="secondary">Inactif</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{c.total_orders}</TableCell>
                  <TableCell className="font-medium">{(c.total_spent / 100).toFixed(2)}€</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString("fr-FR")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditClient(c)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editClient} onOpenChange={(open) => !open && setEditClient(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le client</DialogTitle>
          </DialogHeader>
          {editClient && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Prénom</Label>
                  <Input value={editClient.first_name || ""} onChange={(e) => setEditClient({ ...editClient, first_name: e.target.value })} />
                </div>
                <div>
                  <Label>Nom</Label>
                  <Input value={editClient.last_name || ""} onChange={(e) => setEditClient({ ...editClient, last_name: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Email</Label>
                <Input value={editClient.email} disabled className="bg-muted" />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input value={editClient.phone || ""} onChange={(e) => setEditClient({ ...editClient, phone: e.target.value })} />
              </div>
              <div>
                <Label>Adresse</Label>
                <Input value={editClient.address_line1 || ""} onChange={(e) => setEditClient({ ...editClient, address_line1: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Code postal</Label>
                  <Input value={editClient.postal_code || ""} onChange={(e) => setEditClient({ ...editClient, postal_code: e.target.value })} />
                </div>
                <div>
                  <Label>Ville</Label>
                  <Input value={editClient.city || ""} onChange={(e) => setEditClient({ ...editClient, city: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Type d'abonnement</Label>
                <Input value={editClient.subscription_type || ""} onChange={(e) => setEditClient({ ...editClient, subscription_type: e.target.value })} />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={editClient.notes || ""} onChange={(e) => setEditClient({ ...editClient, notes: e.target.value })} rows={3} />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Enregistrer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCRM;
