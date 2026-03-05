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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LogOut, Search, Package, Loader2, Download, Newspaper, RefreshCw, CalendarClock, SlidersHorizontal, FileText, GripVertical, BarChart3, PackageOpen, Trash2, ChevronDown, ChevronRight, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import AdminEditionManager from "@/components/AdminEditionManager";
import AdminBlogEditor from "@/components/AdminBlogEditor";
import AdminAnalytics from "@/components/AdminAnalytics";
import AdminStockManager from "@/components/AdminStockManager";
import AdminReviewManager from "@/components/AdminReviewManager";

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

  // Column order (drag & drop)
  const [columnOrder, setColumnOrder] = useState<ColumnKey[]>(() => {
    const saved = localStorage.getItem("admin-column-order");
    if (saved) return JSON.parse(saved) as ColumnKey[];
    return ALL_COLUMNS.map(c => c.key);
  });

  const [draggedCol, setDraggedCol] = useState<ColumnKey | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ColumnKey | null>(null);

  // Persist preferences
  useEffect(() => {
    localStorage.setItem("admin-visible-columns", JSON.stringify([...visibleColumns]));
  }, [visibleColumns]);

  useEffect(() => {
    localStorage.setItem("admin-column-widths", JSON.stringify(columnWidths));
  }, [columnWidths]);

  useEffect(() => {
    localStorage.setItem("admin-column-order", JSON.stringify(columnOrder));
  }, [columnOrder]);

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

  const getItemLabel = (item: any) => {
    const name = item.name || item.title || "";
    const id = item.id || "";
    const priceId = item.price_id || "";
    const issueNum = item.issue_number || name.match(/N°?\s*(\d+)/)?.[1] || "";

    // Blog article
    if (id.startsWith("blog-") || (priceId === "price_1T123wKbRd4yKDMH1bI9GQqh" && item.unit_amount === 300 && !issueNum) || name.toLowerCase().includes("article blog")) {
      return "Article blog";
    }
    // Digital single issue
    if (id.startsWith("digital-") || id === "mag-digital" || name.toLowerCase().includes("numérique") || name.toLowerCase().includes("digital")) {
      return issueNum ? `N°${issueNum} (digital)` : "Article digital";
    }
    if (priceId === "price_1T123wKbRd4yKDMH1bI9GQqh" && issueNum) {
      return `N°${issueNum} (digital)`;
    }
    // Physical single issue
    if (issueNum) return `N°${issueNum} (papier)`;
    const num = name.match(/(\d+)/)?.[1];
    if (num) return `N°${num} (papier)`;
    return name || "—";
  };

  const SUBSCRIPTION_LABELS: Record<string, string> = {
    "price_1T11hVKbRd4yKDMHHCpMLRc3": "Abo 2 ans",
    "price_1T11hkKbRd4yKDMH6WlS54AH": "Abo 1 an",
    "price_1T11i1KbRd4yKDMHppfC8rE9": "Abo 6 mois",
  };

  const getFormulaLabel = (order: Order) => {
    if (isSubscription(order)) {
      const subType = order.subscription_type || "";
      return SUBSCRIPTION_LABELS[subType] || subType || "Abonnement";
    }
    if (order.items && Array.isArray(order.items) && order.items.length > 1) {
      return "Multiples";
    }
    if (order.items && Array.isArray(order.items) && order.items.length === 1) {
      return getItemLabel(order.items[0]);
    }
    return "—";
  };

  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const toggleExpand = (orderId: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const deleteOrder = async (orderId: string) => {
    const { error } = await supabase.from("orders").delete().eq("id", orderId);
    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }
    setOrders(prev => prev.filter(o => o.id !== orderId));
    toast.success("Commande supprimée");
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
      case "formule": {
        const label = getFormulaLabel(order);
        const isMultiple = !isSubscription(order) && Array.isArray(order.items) && order.items.length > 1;
        if (isMultiple) {
          const isExpanded = expandedOrders.has(order.id);
          return (
            <button
              onClick={() => toggleExpand(order.id)}
              className="flex items-center gap-1 text-primary hover:underline font-medium"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {label} ({order.items.length})
            </button>
          );
        }
        return label;
      }
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

  const visibleCols = columnOrder
    .filter(key => visibleColumns.has(key))
    .map(key => ALL_COLUMNS.find(c => c.key === key)!)
    .filter(Boolean);

  const handleDragStart = (key: ColumnKey) => setDraggedCol(key);
  const handleDragOver = (e: React.DragEvent, key: ColumnKey) => { e.preventDefault(); setDragOverCol(key); };
  const handleDragEnd = () => { setDraggedCol(null); setDragOverCol(null); };
  const handleDrop = (targetKey: ColumnKey) => {
    if (!draggedCol || draggedCol === targetKey) return;
    setColumnOrder(prev => {
      const next = [...prev];
      const fromIdx = next.indexOf(draggedCol);
      const toIdx = next.indexOf(targetKey);
      next.splice(fromIdx, 1);
      next.splice(toIdx, 0, draggedCol);
      return next;
    });
    setDraggedCol(null);
    setDragOverCol(null);
  };

  const renderOrderTable = (orderList: Order[]) => (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-max min-w-full text-sm" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: 40 }} />
            {visibleCols.map(c => (
              <col key={c.key} style={{ width: columnWidths[c.key] }} />
            ))}
            <col style={{ width: 40 }} />
          </colgroup>
          <thead>
            <tr className="border-b">
              <th className="h-12 px-2 text-left align-middle font-medium text-muted-foreground" style={{ width: 40 }}>✓</th>
              {visibleCols.map(c => (
                <th
                  key={c.key}
                  draggable
                  onDragStart={() => handleDragStart(c.key)}
                  onDragOver={(e) => handleDragOver(e, c.key)}
                  onDragEnd={handleDragEnd}
                  onDrop={() => handleDrop(c.key)}
                  className={`h-12 px-3 text-left align-middle font-medium text-muted-foreground relative select-none cursor-grab active:cursor-grabbing transition-colors ${dragOverCol === c.key ? "bg-primary/10" : ""}`}
                  style={{ width: columnWidths[c.key] }}
                >
                  <span className="truncate block pr-2 flex items-center gap-1">
                    <GripVertical className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
                    {c.label}
                  </span>
                  <div
                    className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 transition-colors"
                    onMouseDown={(e) => onResizeStart(c.key, e)}
                  />
                </th>
              ))}
              <th className="h-12 px-2 text-center align-middle font-medium text-muted-foreground" style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {orderList.map(order => {
              const isMultiple = !isSubscription(order) && Array.isArray(order.items) && order.items.length > 1;
              const isExpanded = expandedOrders.has(order.id);
              return (
                <>
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
                    <td className="p-1 align-middle text-center">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Supprimer">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cette commande ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Commande de {order.first_name} {order.last_name} ({(order.total_amount / 100).toFixed(2)}€). Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteOrder(order.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                  {isMultiple && isExpanded && (
                    <tr key={`${order.id}-detail`} className="bg-muted/30 border-b">
                      <td colSpan={visibleCols.length + 2} className="px-6 py-3">
                        <div className="text-xs space-y-1.5">
                          <p className="font-medium text-muted-foreground mb-2">Détail des articles :</p>
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 text-foreground">
                              <span className="text-muted-foreground">{idx + 1}.</span>
                              <span className="font-medium">{getItemLabel(item)}</span>
                              {item.price && <span className="text-muted-foreground">— {typeof item.price === 'number' ? `${item.price.toFixed(2)}€` : item.price}</span>}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
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
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="edition" className="gap-2">
              <Newspaper className="w-4 h-4" /> Édition du mois
            </TabsTrigger>
            <TabsTrigger value="stock" className="gap-2">
              <PackageOpen className="w-4 h-4" /> Stocks & Tarifs
            </TabsTrigger>
            <TabsTrigger value="blog" className="gap-2">
              <FileText className="w-4 h-4" /> Blog
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2">
              <MessageSquare className="w-4 h-4" /> Avis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <AdminAnalytics orders={orders as any} />
          </TabsContent>

          <TabsContent value="edition">
            <AdminEditionManager />
          </TabsContent>

          <TabsContent value="stock">
            <AdminStockManager />
          </TabsContent>

          <TabsContent value="blog">
            <AdminBlogEditor />
          </TabsContent>

          <TabsContent value="reviews">
            <AdminReviewManager />
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
