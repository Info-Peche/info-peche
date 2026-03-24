import { useEffect, useState, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Search, Loader2, Download, Edit, Trash2, Users, Plus, ArrowUp, ArrowDown, ArrowUpDown, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type Client = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  phone2: string | null;
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
  "abo-2-ans": "Abo 2 ans",
  "abo-1-an": "Abo 1 an",
  "abo-6-mois": "Abo 6 mois",
};

const SUBSCRIPTION_DURATIONS: Record<string, number> = {
  "price_1T11hVKbRd4yKDMHHCpMLRc3": 24,
  "price_1T11hkKbRd4yKDMH6WlS54AH": 12,
  "price_1T11i1KbRd4yKDMHppfC8rE9": 6,
  "abo-2-ans": 24,
  "abo-1-an": 12,
  "abo-6-mois": 6,
};

const SUBSCRIPTION_OPTIONS = [
  { value: "", label: "Aucun" },
  { value: "price_1T11hVKbRd4yKDMHHCpMLRc3", label: "Abonnement 2 ans" },
  { value: "price_1T11hkKbRd4yKDMH6WlS54AH", label: "Abonnement 1 an" },
  { value: "price_1T11i1KbRd4yKDMHppfC8rE9", label: "Abonnement 6 mois" },
];

const FILTER_OPTIONS = [
  { value: "all", label: "Toutes les formules" },
  { value: "price_1T11hVKbRd4yKDMHHCpMLRc3", label: "Abo 2 ans" },
  { value: "price_1T11hkKbRd4yKDMH6WlS54AH", label: "Abo 1 an" },
  { value: "price_1T11i1KbRd4yKDMHppfC8rE9", label: "Abo 6 mois" },
  { value: "abo-2-ans", label: "Abo 2 ans (import)" },
  { value: "abo-1-an", label: "Abo 1 an (import)" },
  { value: "abo-6-mois", label: "Abo 6 mois (import)" },
  { value: "none", label: "Sans abonnement" },
];

const subLabel = (type: string | null) => {
  if (!type) return "—";
  return SUBSCRIPTION_LABELS[type] || type;
};

const computeEndDate = (client: Client): string | null => {
  if (client.subscription_end_date) return client.subscription_end_date;
  if (!client.subscription_type) return null;
  const months = SUBSCRIPTION_DURATIONS[client.subscription_type];
  if (!months) return null;
  const startStr = client.subscription_start_date || client.created_at;
  if (!startStr) return null;
  const start = new Date(startStr);
  if (isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);
  return end.toISOString();
};

type SortKey = "subscriber_number" | "last_name" | "created_at" | "total_orders";
type SortDir = "asc" | "desc";

const ALL_COLUMNS = [
  { key: "subscriber_number", label: "N° abonné" },
  { key: "client", label: "Client" },
  { key: "email", label: "Email" },
  { key: "phone", label: "GSM" },
  { key: "phone2", label: "Tél. fixe" },
  { key: "city", label: "Ville" },
  { key: "subscription", label: "Formule" },
  { key: "end_date", label: "Fin abo" },
  { key: "status", label: "Statut" },
  { key: "total_orders", label: "Commandes" },
  { key: "total_spent", label: "Total" },
  { key: "created_at", label: "Depuis" },
] as const;

type ColumnKey = (typeof ALL_COLUMNS)[number]["key"];

const DEFAULT_VISIBLE: ColumnKey[] = [
  "subscriber_number", "client", "email", "phone", "city", "subscription", "end_date", "status", "total_orders", "created_at",
];

const emptyClient = (): Partial<Client> => ({
  email: "",
  first_name: "",
  last_name: "",
  phone: "",
  phone2: "",
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

const extractSubNum = (s: string | null): number => {
  if (!s) return 0;
  const m = s.match(/(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
};

const AdminCRM = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState<Partial<Client> | null>(null);
  const [saving, setSaving] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(DEFAULT_VISIBLE);
  const [subscriptionFilter, setSubscriptionFilter] = useState("all");

  const fetchClients = async () => {
    setLoading(true);
    const allClients: any[] = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, from + batchSize - 1);
      if (error) {
        toast.error("Erreur lors du chargement des clients");
        hasMore = false;
      } else {
        allClients.push(...(data || []));
        hasMore = (data?.length || 0) === batchSize;
        from += batchSize;
      }
    }
    setClients(allClients);
    setLoading(false);
  };

  useEffect(() => { fetchClients(); }, []);

  const filtered = useMemo(() => {
    let result = clients;

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        c.email.toLowerCase().includes(q) ||
        (c.first_name || "").toLowerCase().includes(q) ||
        (c.last_name || "").toLowerCase().includes(q) ||
        (c.city || "").toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q) ||
        (c.subscriber_number || "").toLowerCase().includes(q)
      );
    }

    // Subscription filter
    if (subscriptionFilter !== "all") {
      if (subscriptionFilter === "none") {
        result = result.filter((c) => !c.subscription_type);
      } else {
        result = result.filter((c) => c.subscription_type === subscriptionFilter);
      }
    }

    // Sorting
    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "subscriber_number":
          cmp = extractSubNum(a.subscriber_number) - extractSubNum(b.subscriber_number);
          break;
        case "last_name":
          cmp = (a.last_name || "").localeCompare(b.last_name || "", "fr");
          break;
        case "created_at":
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "total_orders":
          cmp = a.total_orders - b.total_orders;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [clients, search, subscriptionFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [search, subscriptionFilter, pageSize]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const isColVisible = (key: ColumnKey) => visibleColumns.includes(key);
  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    if (!editClient) return;
    setSaving(true);
    const { error } = await supabase
      .from("clients")
      .update({
        first_name: editClient.first_name,
        last_name: editClient.last_name,
        phone: editClient.phone,
        phone2: editClient.phone2,
        address_line1: editClient.address_line1,
        address_line2: editClient.address_line2,
        city: editClient.city,
        postal_code: editClient.postal_code,
        country: editClient.country,
        subscription_type: editClient.subscription_type || null,
        subscription_end_date: editClient.subscription_end_date || null,
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

    let subscriberNumber: string | null = null;
    if (newClient.subscription_type) {
      const { data: subNum } = await supabase.rpc("nextval_subscriber_number" as any);
      subscriberNumber = `ABONNE_${subNum || 1}`;
    }

    // Compute end date
    let endDate: string | null = null;
    if (newClient.subscription_type) {
      const months = SUBSCRIPTION_DURATIONS[newClient.subscription_type];
      if (months) {
        const start = new Date();
        start.setMonth(start.getMonth() + months);
        endDate = start.toISOString();
      }
    }

    const { error } = await supabase.from("clients").insert({
      email: newClient.email.toLowerCase(),
      first_name: newClient.first_name || null,
      last_name: newClient.last_name || null,
      phone: newClient.phone || null,
      phone2: newClient.phone2 || null,
      address_line1: newClient.address_line1 || null,
      address_line2: newClient.address_line2 || null,
      city: newClient.city || null,
      postal_code: newClient.postal_code || null,
      country: newClient.country || "FR",
      subscription_type: newClient.subscription_type || null,
      subscription_start_date: newClient.subscription_type ? new Date().toISOString() : null,
      subscription_end_date: endDate,
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
      // Auto-create auth account so the client can use "Première connexion"
      if (newClient.subscription_type) {
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
          // We call the edge function just to ensure the auth account exists
          // by triggering a "first-login" check — but we don't need the email sent now
          // Instead, create the account via a dedicated lightweight call
          await fetch(`${supabaseUrl}/functions/v1/send-reset-password`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "apikey": supabaseKey,
              "Authorization": `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ email: newClient.email, isFirstLogin: true, skipEmail: true }),
          });
        } catch (authErr) {
          console.error("Auth account creation (non-blocking):", authErr);
        }
      }
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
    const data = filtered.map((c) => {
      const end = computeEndDate(c);
      return {
        "N° abonné": c.subscriber_number || "",
        "Email": c.email,
        "Prénom": c.first_name || "",
        "Nom": c.last_name || "",
        "GSM": c.phone || "",
        "Tél. fixe": c.phone2 || "",
        "Adresse": c.address_line1 || "",
        "Adresse 2": c.address_line2 || "",
        "CP": c.postal_code || "",
        "Ville": c.city || "",
        "Pays": c.country || "",
        "Formule": subLabel(c.subscription_type),
        "Début abo": c.subscription_start_date ? new Date(c.subscription_start_date).toLocaleDateString("fr-FR") : "",
        "Fin abo": end ? new Date(end).toLocaleDateString("fr-FR") : "",
        "Actif": c.is_active_subscriber ? "Oui" : "Non",
        "Commandes": c.total_orders,
        "Total dépensé (€)": (c.total_spent / 100).toFixed(2),
        "Notes": c.notes || "",
        "Depuis": new Date(c.created_at).toLocaleDateString("fr-FR"),
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clients");
    XLSX.writeFile(wb, `crm-clients-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const renderClientForm = (client: Partial<Client>, onChange: (c: Partial<Client>) => void, onSave: () => void, title: string) => {
    const end = computeEndDate(client as Client);
    return (
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>GSM</Label>
              <Input value={client.phone || ""} onChange={(e) => onChange({ ...client, phone: e.target.value })} />
            </div>
            <div>
              <Label>Tél. fixe</Label>
              <Input value={client.phone2 || ""} onChange={(e) => onChange({ ...client, phone2: e.target.value })} />
            </div>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Début abo</Label>
              <Input
                value={client.subscription_start_date ? new Date(client.subscription_start_date).toLocaleDateString("fr-FR") : (client.created_at ? new Date(client.created_at).toLocaleDateString("fr-FR") : "—")}
                disabled
                className="bg-muted"
              />
            </div>
            <div>
              <Label>Fin abo (estimée)</Label>
              <Input
                value={end ? new Date(end).toLocaleDateString("fr-FR") : "—"}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
          {editClient && (
            <div>
              <Label>Fin d'abonnement (manuelle)</Label>
              <Input
                type="date"
                value={editClient.subscription_end_date ? editClient.subscription_end_date.slice(0, 10) : ""}
                onChange={(e) => onChange({ ...client, subscription_end_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
              />
              <p className="text-xs text-muted-foreground mt-1">Laissez vide pour utiliser la date calculée automatiquement</p>
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
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="gap-1">
          <Users className="w-3 h-3" /> {filtered.length} clients
        </Badge>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {/* Column visibility */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="w-4 h-4 mr-2" /> Colonnes
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <p className="text-sm font-medium mb-2">Colonnes visibles</p>
            <div className="space-y-2">
              {ALL_COLUMNS.map((col) => (
                <label key={col.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={isColVisible(col.key)}
                    onCheckedChange={() => toggleColumn(col.key)}
                  />
                  {col.label}
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Page size */}
        <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
          <SelectTrigger className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 par page</SelectItem>
            <SelectItem value="50">50 par page</SelectItem>
            <SelectItem value="100">100 par page</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="default" size="sm" onClick={() => setNewClient(emptyClient())}>
          <Plus className="w-4 h-4 mr-2" /> Nouveau client
        </Button>
        <Button variant="outline" size="sm" onClick={exportXLSX}>
          <Download className="w-4 h-4 mr-2" /> Exporter Excel
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">Aucun client trouvé.</div>
      ) : (
        <>
          <div className="overflow-x-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  {isColVisible("subscriber_number") && (
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("subscriber_number")}>
                      <span className="flex items-center">N° abonné <SortIcon col="subscriber_number" /></span>
                    </TableHead>
                  )}
                  {isColVisible("client") && (
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("last_name")}>
                      <span className="flex items-center">Client <SortIcon col="last_name" /></span>
                    </TableHead>
                  )}
                  {isColVisible("email") && <TableHead>Email</TableHead>}
                  {isColVisible("phone") && <TableHead>GSM</TableHead>}
                  {isColVisible("phone2") && <TableHead>Tél. fixe</TableHead>}
                  {isColVisible("city") && <TableHead>Ville</TableHead>}
                  {isColVisible("subscription") && <TableHead>Formule</TableHead>}
                  {isColVisible("end_date") && <TableHead>Fin abo</TableHead>}
                  {isColVisible("status") && <TableHead>Statut</TableHead>}
                  {isColVisible("total_orders") && (
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("total_orders")}>
                      <span className="flex items-center">Commandes <SortIcon col="total_orders" /></span>
                    </TableHead>
                  )}
                  {isColVisible("total_spent") && <TableHead>Total</TableHead>}
                  {isColVisible("created_at") && (
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("created_at")}>
                      <span className="flex items-center">Depuis <SortIcon col="created_at" /></span>
                    </TableHead>
                  )}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((c) => {
                  const end = computeEndDate(c);
                  return (
                    <TableRow key={c.id}>
                      {isColVisible("subscriber_number") && (
                        <TableCell className="font-mono text-xs text-primary font-medium">
                          {c.subscriber_number || "—"}
                        </TableCell>
                      )}
                      {isColVisible("client") && (
                        <TableCell className="font-medium whitespace-nowrap">
                          {c.first_name || c.last_name ? `${c.first_name || ""} ${c.last_name || ""}`.trim() : "—"}
                        </TableCell>
                      )}
                      {isColVisible("email") && <TableCell className="text-sm">{c.email}</TableCell>}
                      {isColVisible("phone") && <TableCell className="text-sm">{c.phone || "—"}</TableCell>}
                      {isColVisible("phone2") && <TableCell className="text-sm">{c.phone2 || "—"}</TableCell>}
                      {isColVisible("city") && <TableCell className="text-sm">{c.city || "—"}</TableCell>}
                      {isColVisible("subscription") && (
                        <TableCell><Badge variant="outline">{subLabel(c.subscription_type)}</Badge></TableCell>
                      )}
                      {isColVisible("end_date") && (
                        <TableCell className="text-sm text-muted-foreground">
                          {end ? new Date(end).toLocaleDateString("fr-FR") : "—"}
                        </TableCell>
                      )}
                      {isColVisible("status") && (
                        <TableCell>
                          {c.is_active_subscriber ? (
                            <Badge className="bg-green-100 text-green-800">Actif</Badge>
                          ) : (
                            <Badge variant="secondary">Inactif</Badge>
                          )}
                        </TableCell>
                      )}
                      {isColVisible("total_orders") && (
                        <TableCell className="text-center">{c.total_orders}</TableCell>
                      )}
                      {isColVisible("total_spent") && (
                        <TableCell className="font-medium">{(c.total_spent / 100).toFixed(2)}€</TableCell>
                      )}
                      {isColVisible("created_at") && (
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString("fr-FR")}
                        </TableCell>
                      )}
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
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} sur {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm">Page {currentPage} / {totalPages}</span>
              <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      <Dialog open={!!editClient} onOpenChange={(open) => !open && setEditClient(null)}>
        {editClient && renderClientForm(editClient, (c) => setEditClient(c as Client), handleSave, "Modifier le client")}
      </Dialog>

      <Dialog open={!!newClient} onOpenChange={(open) => !open && setNewClient(null)}>
        {newClient && renderClientForm(newClient, (c) => setNewClient(c), handleCreateClient, "Nouveau client")}
      </Dialog>
    </div>
  );
};

export default AdminCRM;
