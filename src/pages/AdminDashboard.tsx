import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Search, Package, Loader2, Download, Newspaper, RefreshCw, CalendarClock, SlidersHorizontal, FileText, GripVertical, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import AdminEditionManager from "@/components/AdminEditionManager";
import AdminBlogEditor from "@/components/AdminBlogEditor";
import AdminAnalytics from "@/components/AdminAnalytics";

type Order = {
  id: string;
  created_at: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  order_type: string;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  status: string;
  items: any;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postal_code: string;
  country: string;
  is_recurring: boolean;
  comment: string | null;
  subscriber_number: string | null;
  subscription_type: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  is_processed: boolean;
  billing_address_line1: string | null;
  billing_city: string | null;
  billing_postal_code: string | null;
  billing_country: string | null;
};

type ColumnKey = "date" | "client" | "email" | "tel" | "paiement_type" | "formule" | "total" | "paiement_status" | "fin_abo" | "renouvellement" | "client_depuis" | "ville" | "pays" | "commentaire";

const ALL_COLUMNS: { key: ColumnKey; label: string; defaultVisible: boolean; minWidth: number; defaultWidth: number }[] = [
  { key: "date", label: "Date", defaultVisible: true, minWidth: 80, defaultWidth: 100 },
  { key: "client", label: "Client", defaultVisible: true, minWidth: 100, defaultWidth: 150 },
  { key: "email", label: "Email", defaultVisible: true, minWidth: 120, defaultWidth: 180 },
  { key: "tel", label: "Tél", defaultVisible: true, minWidth: 80, defaultWidth: 110 },
  { key: "paiement_type", label: "Type de paiement", defaultVisible: true, minWidth: 80, defaultWidth: 120 },
  { key: "formule", label: "Formule", defaultVisible: true, minWidth: 80, defaultWidth: 120 },
  { key: "total", label: "Total", defaultVisible: true, minWidth: 60, defaultWidth: 80 },
  { key: "paiement_status", label: "Paiement", defaultVisible: true, minWidth: 80, defaultWidth: 100 },
  { key: "fin_abo", label: "Fin abo", defaultVisible: true, minWidth: 80, defaultWidth: 100 },
  { key: "renouvellement", label: "Renouvellement", defaultVisible: true, minWidth: 100, defaultWidth: 140 },
  { key: "client_depuis", label: "Client depuis", defaultVisible: true, minWidth: 90, defaultWidth: 110 },
  { key: "ville", label: "Ville", defaultVisible: true, minWidth: 80, defaultWidth: 120 },
  { key: "pays", label: "Pays", defaultVisible: false, minWidth: 50, defaultWidth: 70 },
  { key: "commentaire", label: "Commentaire", defaultVisible: true, minWidth: 100, defaultWidth: 160 },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(() => {
    const saved = localStorage.getItem("admin-visible-columns");
    if (saved) return new Set(JSON.parse(saved) as ColumnKey[]);
    return new Set(ALL_COLUMNS.filter(c => c.defaultVisible).map(c => c.key));
  });

  // Column widths
  const [columnWidths, setColumnWidths] = useState<Record<ColumnKey, number>>(() => {
    const saved = localStorage.getItem("admin-column-widths");
    if (saved) return JSON.parse(saved);
    return Object.fromEntries(ALL_COLUMNS.map(c => [c.key, c.defaultWidth])) as Record<ColumnKey, number>;
  });

  // Persist preferences
  useEffect(() => {
    localStorage.setItem("admin-visible-columns", JSON.stringify([...visibleColumns]));
  }, [visibleColumns]);

  useEffect(() => {
    localStorage.setItem("admin-column-widths", JSON.stringify(columnWidths));
  }, [columnWidths]);

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Resize logic
  const resizingRef = useRef<{ key: ColumnKey; startX: number; startWidth: number } | null>(null);

  const onResizeStart = useCallback((key: ColumnKey, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = columnWidths[key];
    resizingRef.current = { key, startX, startWidth };

    const onMouseMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const col = ALL_COLUMNS.find(c => c.key === resizingRef.current!.key)!;
      const delta = ev.clientX - resizingRef.current.startX;
      const newWidth = Math.max(col.minWidth, resizingRef.current.startWidth + delta);
      setColumnWidths(prev => ({ ...prev, [resizingRef.current!.key]: newWidth }));
    };

    const onMouseUp = () => {
      resizingRef.current = null;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [columnWidths]);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/admin/login"); return; }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");
      if (!roles || roles.length === 0) {
        await supabase.auth.signOut();
        navigate("/admin/login");
        return;
      }
      setAuthChecked(true);
    };
    checkAdmin();
  }, [navigate]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setOrders(data as Order[]);
    setLoading(false);
  };

  useEffect(() => {
    if (authChecked) fetchOrders();
  }, [authChecked]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  const toggleProcessed = async (orderId: string, current: boolean) => {
    const { error } = await supabase
      .from("orders")
      .update({ is_processed: !current } as any)
      .eq("id", orderId);
    if (error) {
      toast.error("Erreur lors de la mise à jour");
      return;
    }
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, is_processed: !current } : o));
    toast.success(!current ? "Commande marquée traitée" : "Commande remise en attente");
  };

  const exportCSV = () => {
    const headers = [
      "ID commande", "Date", "Nom", "Prénom", "Adresse 1", "Adresse 2",
      "Code postal", "Ville", "Pays", "Email", "Téléphone", "Commentaire",
      "N° abonné", "Type abonnement", "Début abo", "Fin abo",
      "Montant (€)", "Mode de paiement", "Statut paiement", "Traité"
    ];
    const rows = filteredOrders.map(o => [
      o.id,
      new Date(o.created_at).toLocaleDateString("fr-FR"),
      o.last_name, o.first_name, o.address_line1, o.address_line2 || "",
      o.postal_code, o.city, o.country, o.email, o.phone || "",
      o.comment || "", o.subscriber_number || "", o.subscription_type || "",
      o.subscription_start_date ? new Date(o.subscription_start_date).toLocaleDateString("fr-FR") : "",
      o.subscription_end_date ? new Date(o.subscription_end_date).toLocaleDateString("fr-FR") : "",
      (o.total_amount / 100).toFixed(2), o.payment_method, o.payment_status,
      o.is_processed ? "Oui" : "Non",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `commandes-infopeche-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const filteredOrders = orders.filter(o => {
    const q = search.toLowerCase();
    return o.email.toLowerCase().includes(q) || o.first_name.toLowerCase().includes(q) || o.last_name.toLowerCase().includes(q) || o.id.toLowerCase().includes(q);
  });

  const activeOrders = filteredOrders.filter(o => !o.is_processed);
  const archivedOrders = filteredOrders.filter(o => o.is_processed);

  const getPaymentMethodLabel = (method: string) => {
    switch (method.toLowerCase()) {
      case "card": return "CB";
      case "paypal": return "PayPal";
      case "sepa": case "sepa_debit": return "SEPA";
      default: return method;
    }
  };

  const isSubscription = (order: Order) => order.order_type.startsWith("subscription");

  const getFormulaLabel = (order: Order) => {
    if (isSubscription(order)) return order.subscription_type || "—";
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      const issues = order.items.map((item: any) => item.issue_number || item.title || item.name).filter(Boolean);
      return issues.length > 0 ? `N°${issues.join(", N°")}` : "—";
    }
    return "—";
  };

  const getSubscriptionCount = (email: string) =>
    orders.filter(o => o.email === email && isSubscription(o) && o.payment_status === "paid").length;

  const getCustomerSince = (email: string) => {
    const co = orders.filter(o => o.email === email && o.payment_status === "paid");
    if (co.length === 0) return null;
    return co.reduce((min, o) => new Date(o.created_at) < new Date(min.created_at) ? o : min).created_at;
  };

  const getCustomerSeniorityLabel = (email: string) => {
    const since = getCustomerSince(email);
    if (!since) return "—";
    const diff = Date.now() - new Date(since).getTime();
    const years = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
    const months = Math.floor(diff / (30.44 * 24 * 60 * 60 * 1000));
    if (years >= 1) return `${years} an${years > 1 ? "s" : ""}`;
    return `${months} mois`;
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "paid": case "confirmed": return "default";
      case "pending": return "secondary";
      default: return "outline";
    }
  };

  const renderCellContent = (col: ColumnKey, order: Order) => {
    switch (col) {
      case "date":
        return <span className="whitespace-nowrap">{new Date(order.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>;
      case "client":
        return <span className="font-medium">{order.first_name} {order.last_name}</span>;
      case "email":
        return order.email;
      case "tel":
        return order.phone || "—";
      case "paiement_type":
        return <Badge variant="outline" className="text-xs">{getPaymentMethodLabel(order.payment_method)}</Badge>;
      case "formule":
        return getFormulaLabel(order);
      case "total":
        return <span className="font-bold">{(order.total_amount / 100).toFixed(2)}€</span>;
      case "paiement_status":
        return <Badge variant={statusColor(order.payment_status) as any} className="text-xs">{order.payment_status}</Badge>;
      case "fin_abo":
        return order.subscription_end_date
          ? <span className="whitespace-nowrap">{new Date(order.subscription_end_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}</span>
          : "—";
      case "renouvellement":
        if (!isSubscription(order)) return "—";
        const count = getSubscriptionCount(order.email);
        return count > 1
          ? <Badge variant="default" className="text-xs gap-1"><RefreshCw className="w-3 h-3" /> {count}× renouvelé</Badge>
          : <span className="text-muted-foreground">1ère souscription</span>;
      case "client_depuis":
        return <span className="flex items-center gap-1 whitespace-nowrap"><CalendarClock className="w-3 h-3 text-muted-foreground" />{getCustomerSeniorityLabel(order.email)}</span>;
      case "ville":
        return `${order.postal_code} ${order.city}`;
      case "pays":
        return order.country || "—";
      case "commentaire":
        return <span className="truncate block" title={order.comment || ""}>{order.comment || "—"}</span>;
    }
  };

  const visibleCols = ALL_COLUMNS.filter(c => visibleColumns.has(c.key));

  const renderOrderTable = (orderList: Order[]) => (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-max min-w-full text-sm" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: 40 }} />
            {visibleCols.map(c => (
              <col key={c.key} style={{ width: columnWidths[c.key] }} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b">
              <th className="h-12 px-2 text-left align-middle font-medium text-muted-foreground" style={{ width: 40 }}>✓</th>
              {visibleCols.map(c => (
                <th
                  key={c.key}
                  className="h-12 px-3 text-left align-middle font-medium text-muted-foreground relative select-none"
                  style={{ width: columnWidths[c.key] }}
                >
                  <span className="truncate block pr-2">{c.label}</span>
                  <div
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 transition-colors"
                    onMouseDown={(e) => onResizeStart(c.key, e)}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orderList.map(order => (
              <tr key={order.id} className="border-b transition-colors hover:bg-muted/50">
                <td className="p-2 align-middle">
                  <Checkbox
                    checked={order.is_processed}
                    onCheckedChange={() => toggleProcessed(order.id, order.is_processed)}
                  />
                </td>
                {visibleCols.map(c => (
                  <td
                    key={c.key}
                    className="px-3 py-2 align-middle text-xs overflow-hidden"
                    style={{ maxWidth: columnWidths[c.key] }}
                  >
                    {renderCellContent(c.key, order)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-serif font-bold text-foreground">Administration</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Déconnexion
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList>
            <TabsTrigger value="orders" className="gap-2">
              <Package className="w-4 h-4" /> Commandes
            </TabsTrigger>
            <TabsTrigger value="edition" className="gap-2">
              <Newspaper className="w-4 h-4" /> Édition du mois
            </TabsTrigger>
            <TabsTrigger value="blog" className="gap-2">
              <FileText className="w-4 h-4" /> Blog
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edition">
            <AdminEditionManager />
          </TabsContent>

          <TabsContent value="blog">
            <AdminBlogEditor />
          </TabsContent>

          <TabsContent value="orders">
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, email ou n° commande..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Badge variant="outline" className="text-sm">
                {activeOrders.length} à traiter
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <SlidersHorizontal className="w-4 h-4 mr-2" /> Colonnes
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Colonnes visibles</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {ALL_COLUMNS.map(col => (
                    <DropdownMenuCheckboxItem
                      key={col.key}
                      checked={visibleColumns.has(col.key)}
                      onCheckedChange={() => toggleColumn(col.key)}
                    >
                      {col.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="w-4 h-4 mr-2" /> Exporter CSV
              </Button>
            </div>

            <Tabs defaultValue="active" className="space-y-4">
              <TabsList>
                <TabsTrigger value="active">
                  À traiter ({activeOrders.length})
                </TabsTrigger>
                <TabsTrigger value="archived">
                  Archivées ({archivedOrders.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active">
                {loading ? (
                  <div className="text-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                  </div>
                ) : activeOrders.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground">
                    Aucune commande à traiter.
                  </div>
                ) : renderOrderTable(activeOrders)}
              </TabsContent>

              <TabsContent value="archived">
                {loading ? (
                  <div className="text-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                  </div>
                ) : archivedOrders.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground">
                    Aucune commande archivée.
                  </div>
                ) : renderOrderTable(archivedOrders)}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
