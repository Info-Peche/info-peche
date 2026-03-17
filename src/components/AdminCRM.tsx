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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Loader2, Download, Edit, Trash2, Users, Plus } from "lucide-react";
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
  subscriber_number: string | null;
  created_at: string;
  updated_at: string;
};

const SUBSCRIPTION_LABELS: Record<string, string> = {
  "price_1T11hVKbRd4yKDMHHCpMLRc3": "Abo 2 ans",
  "price_1T11hkKbRd4yKDMH6WlS54AH": "Abo 1 an",
  "price_1T11i1KbRd4yKDMHppfC8rE9": "Abo 6 mois",
};

const SUBSCRIPTION_OPTIONS = [
  { value: "", label: "Aucun" },
  { value: "price_1T11hVKbRd4yKDMHHCpMLRc3", label: "Abonnement 2 ans" },
  { value: "price_1T11hkKbRd4yKDMH6WlS54AH", label: "Abonnement 1 an" },
  { value: "price_1T11i1KbRd4yKDMHppfC8rE9", label: "Abonnement 6 mois" },
];

const subLabel = (type: string | null) => {
  if (!type) return "—";
  return SUBSCRIPTION_LABELS[type] || type;
};

const emptyClient = (): Partial<Client> => ({
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
  address_line1: "",
  address_line2: "",
  city: "",
  postal_code: "",
  country: "FR",
  subscription_type: "",
  notes: "",
  is_active_subscriber: false,
  total_orders: 0,
  total_spent: 0,
});

const AdminCRM = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState<Partial<Client> | null>(null);
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
      (c.phone || "").toLowerCase().includes(q) ||
      (c.subscriber_number || "").toLowerCase().includes(q)
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
        subscription_type: editClient.subscription_type || null,
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

  const handleCreateClient = async () => {
    if (!newClient?.email) {
      toast.error("L'email est obligatoire");
      return;
    }
    setSaving(true);

    // Get next subscriber number if subscription selected
    let subscriberNumber: string | null = null;
    if (newClient.subscription_type) {
      const { data: subNum } = await supabase.rpc("nextval_subscriber_number" as any);
      subscriberNumber = `ABONNE_${subNum || 1}`;
    }

    const { error } = await supabase.from("clients").insert({
      email: newClient.email.toLowerCase(),
      first_name: newClient.first_name || null,
      last_name: newClient.last_name || null,
      phone: newClient.phone || null,
      address_line1: newClient.address_line1 || null,
      address_line2: newClient.address_line2 || null,
      city: newClient.city || null,
      postal_code: newClient.postal_code || null,
      country: newClient.country || "FR",
      subscription_type: newClient.subscription_type || null,
      is_active_subscriber: !!newClient.subscription_type,
      subscriber_number: subscriberNumber,
      notes: newClient.notes || null,
    } as any);

    setSaving(false);
    if (error) {
      if (error.code === "23505") {
        toast.error("Un client avec cet email existe déjà");
      } else {
        toast.error("Erreur lors de la création");
      }
    } else {
      toast.success(`Client créé${subscriberNumber ? ` — ${subscriberNumber}` : ""}`);
      setNewClient(null);
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

  const exportXLSX = async () => {
    const XLSX = await import("xlsx");
    const data = clients.map((c) => ({
      "N° abonné": c.subscriber_number || "",
      "Email": c.email,
      "Prénom": c.first_name || "",
      "Nom": c.last_name || "",
      "Téléphone": c.phone || "",
      "Adresse": c.address_line1 || "",
      "CP": c.postal_code || "",
      "Ville": c.city || "",
      "Pays": c.country || "",
      "Formule": subLabel(c.subscription_type),
      "Début abo": c.subscription_start_date ? new Date(c.subscription_start_date).toLocaleDateString("fr-FR") : "",
      "Fin abo": c.subscription_end_date ? new Date(c.subscription_end_date).toLocaleDateString("fr-FR") : "",
      "Actif": c.is_active_subscriber ? "Oui" : "Non",
      "Commandes": c.total_orders,
      "Total dépensé (€)": (c.total_spent / 100).toFixed(2),
      "Notes": c.notes || "",
      "Depuis": new Date(c.created_at).toLocaleDateString("fr-FR"),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clients");
    XLSX.writeFile(wb, `crm-clients-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const renderClientForm = (client: Partial<Client>, onChange: (c: Partial<Client>) => void, onSave: () => void, title: string) => (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Prénom</Label>
            <Input value={client.first_name || ""} onChange={(e) => onChange({ ...client, first_name: e.target.value })} />
          </div>
          <div>
            <Label>Nom</Label>
            <Input value={client.last_name || ""} onChange={(e) => onChange({ ...client, last_name: e.target.value })} />
          </div>
        </div>
        <div>
          <Label>Email *</Label>
          <Input
            value={client.email || ""}
            onChange={(e) => onChange({ ...client, email: e.target.value })}
            disabled={!!editClient && client === editClient}
            className={!!editClient && client === editClient ? "bg-muted" : ""}
          />
        </div>
        <div>
          <Label>Téléphone</Label>
          <Input value={client.phone || ""} onChange={(e) => onChange({ ...client, phone: e.target.value })} />
        </div>
        <div>
          <Label>Adresse 1</Label>
          <Input value={client.address_line1 || ""} onChange={(e) => onChange({ ...client, address_line1: e.target.value })} />
        </div>
        <div>
          <Label>Adresse 2</Label>
          <Input value={client.address_line2 || ""} onChange={(e) => onChange({ ...client, address_line2: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Code postal</Label>
            <Input value={client.postal_code || ""} onChange={(e) => onChange({ ...client, postal_code: e.target.value })} />
          </div>
          <div>
            <Label>Ville</Label>
            <Input value={client.city || ""} onChange={(e) => onChange({ ...client, city: e.target.value })} />
          </div>
        </div>
        <div>
          <Label>Type d'abonnement</Label>
          <Select
            value={client.subscription_type || ""}
            onValueChange={(v) => onChange({ ...client, subscription_type: v || null })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner..." />
            </SelectTrigger>
            <SelectContent>
              {SUBSCRIPTION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value || "none"} value={opt.value || "none"}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {client.subscriber_number && (
          <div>
            <Label>N° abonné</Label>
            <Input value={client.subscriber_number} disabled className="bg-muted font-mono" />
          </div>
        )}
        <div>
          <Label>Notes</Label>
          <Textarea value={client.notes || ""} onChange={(e) => onChange({ ...client, notes: e.target.value })} rows={3} />
        </div>
        <Button onClick={onSave} disabled={saving} className="w-full">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Enregistrer
        </Button>
      </div>
    </DialogContent>
  );

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
        <Button variant="default" size="sm" onClick={() => setNewClient(emptyClient())}>
          <Plus className="w-4 h-4 mr-2" /> Nouveau client
        </Button>
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
                <TableHead>N° abonné</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tél</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Formule</TableHead>
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
                  <TableCell className="font-mono text-xs text-primary font-medium">
                    {c.subscriber_number || "—"}
                  </TableCell>
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
        {editClient && renderClientForm(editClient, (c) => setEditClient(c as Client), handleSave, "Modifier le client")}
      </Dialog>

      {/* Create dialog */}
      <Dialog open={!!newClient} onOpenChange={(open) => !open && setNewClient(null)}>
        {newClient && renderClientForm(newClient, (c) => setNewClient(c), handleCreateClient, "Nouveau client")}
      </Dialog>
    </div>
  );
};

export default AdminCRM;
