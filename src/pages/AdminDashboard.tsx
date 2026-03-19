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
import { LogOut, Search, Package, Loader2, Download, Newspaper, RefreshCw, CalendarClock, SlidersHorizontal, FileText, GripVertical, BarChart3, PackageOpen, Trash2, ChevronDown, ChevronRight, MessageSquare, Users, Contact, Eye, Archive } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import AdminEditionManager from "@/components/AdminEditionManager";
import AdminBlogEditor from "@/components/AdminBlogEditor";
import AdminAnalytics from "@/components/AdminAnalytics";
import AdminStockManager from "@/components/AdminStockManager";
import AdminReviewManager from "@/components/AdminReviewManager";
import AdminAuthorManager from "@/components/AdminAuthorManager";
import AdminCRM from "@/components/AdminCRM";
import { PRODUCTS } from "@/lib/products";

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
  billing_first_name: string | null;
  billing_last_name: string | null;
  billing_address_line1: string | null;
  billing_address_line2: string | null;
  billing_city: string | null;
  billing_postal_code: string | null;
  billing_country: string | null;
  order_number: number | null;
};

type ColumnKey = "date" | "client" | "email" | "tel" | "paiement_type" | "formule" | "total" | "paiement_status" | "fin_abo" | "renouvellement" | "client_depuis" | "ville" | "pays" | "commentaire" | "factu_nom" | "factu_adresse" | "factu_ville";

const ALL_COLUMNS: { key: ColumnKey; label: string; defaultVisible: boolean; minWidth: number; defaultWidth: number }[] = [
  { key: "date", label: "Date", defaultVisible: true, minWidth: 80, defaultWidth: 100 },
  { key: "client", label: "Client", defaultVisible: true, minWidth: 100, defaultWidth: 150 },
  { key: "email", label: "Email", defaultVisible: true, minWidth: 120, defaultWidth: 180 },
  { key: "tel", label: "Tél", defaultVisible: true, minWidth: 80, defaultWidth: 110 },
  { key: "paiement_type", label: "Type de paiement", defaultVisible: true, minWidth: 80, defaultWidth: 120 },
  { key: "formule", label: "Formule", defaultVisible: true, minWidth: 80, defaultWidth: 120 },
  { key: "total", label: "Paiement net", defaultVisible: true, minWidth: 90, defaultWidth: 110 },
  { key: "paiement_status", label: "Paiement", defaultVisible: true, minWidth: 80, defaultWidth: 100 },
  { key: "fin_abo", label: "Fin abo", defaultVisible: true, minWidth: 80, defaultWidth: 100 },
  { key: "renouvellement", label: "Renouvellement", defaultVisible: true, minWidth: 100, defaultWidth: 140 },
  { key: "client_depuis", label: "Client depuis", defaultVisible: true, minWidth: 90, defaultWidth: 110 },
  { key: "ville", label: "Ville", defaultVisible: true, minWidth: 80, defaultWidth: 120 },
  { key: "pays", label: "Pays", defaultVisible: false, minWidth: 50, defaultWidth: 70 },
  { key: "factu_nom", label: "Factu. Nom", defaultVisible: false, minWidth: 100, defaultWidth: 140 },
  { key: "factu_adresse", label: "Factu. Adresse", defaultVisible: false, minWidth: 120, defaultWidth: 160 },
  { key: "factu_ville", label: "Factu. Ville", defaultVisible: false, minWidth: 80, defaultWidth: 120 },
  { key: "commentaire", label: "Commentaire", defaultVisible: true, minWidth: 100, defaultWidth: 160 },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

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

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const toggleSelectAll = (orderList: Order[]) => {
    const allSelected = orderList.every(o => selectedOrders.has(o.id));
    if (allSelected) {
      setSelectedOrders(prev => {
        const next = new Set(prev);
        orderList.forEach(o => next.delete(o.id));
        return next;
      });
    } else {
      setSelectedOrders(prev => {
        const next = new Set(prev);
        orderList.forEach(o => next.add(o.id));
        return next;
      });
    }
  };

  const updateArchiveStatus = async (ids: string[], isProcessed: boolean) => {
    if (ids.length === 0) return false;

    const { error } = await supabase
      .from("orders")
      .update({ is_processed: isProcessed } as any)
      .in("id", ids);

    if (error) {
      toast.error(`Erreur lors de la mise à jour : ${error.message}`);
      return false;
    }

    setOrders(prev => prev.map(o => ids.includes(o.id) ? { ...o, is_processed: isProcessed } : o));
    return true;
  };

  const archiveSelected = async () => {
    const ids = [...selectedOrders];
    const ok = await updateArchiveStatus(ids, true);
    if (!ok) return;

    setSelectedOrders(new Set());
    setShowArchiveConfirm(false);
    toast.success(`${ids.length} commande${ids.length > 1 ? "s" : ""} archivée${ids.length > 1 ? "s" : ""}`);
  };

  const unarchiveOrder = async (orderId: string) => {
    const ok = await updateArchiveStatus([orderId], false);
    if (!ok) return;
    toast.success("Commande remise en attente");
  };

  const getLineTotalCents = (item: any) => {
    const quantity = typeof item?.quantity === "number" && item.quantity > 0 ? item.quantity : 1;
    const unitAmount = typeof item?.unit_amount === "number"
      ? item.unit_amount
      : typeof item?.price === "number"
        ? Math.round(item.price * 100)
        : 0;

    return unitAmount * quantity;
  };

  const isShippingItem = (item: any) => {
    const id = String(item?.id || "").toLowerCase();
    const name = String(item?.name || item?.title || "").toLowerCase();
    const priceId = String(item?.price_id || "").toLowerCase();

    return (
      id.includes("shipping") ||
      id.includes("livraison") ||
      name.includes("livraison") ||
      name.includes("frais de port") ||
      name.includes("shipping") ||
      priceId.includes("shipping")
    );
  };

  const getOrderAmounts = (order: Order) => {
    if (!Array.isArray(order.items) || order.items.length === 0) {
      return { netAmountCents: order.total_amount, shippingCents: 0, totalAmountCents: order.total_amount };
    }

    const nonShippingSubtotal = order.items
      .filter((item: any) => !isShippingItem(item))
      .reduce((sum: number, item: any) => sum + getLineTotalCents(item), 0);

    const shippingFromItems = order.items
      .filter((item: any) => isShippingItem(item))
      .reduce((sum: number, item: any) => sum + getLineTotalCents(item), 0);

    const inferredShipping = Math.max(order.total_amount - nonShippingSubtotal, 0);
    const shippingCents = shippingFromItems > 0 ? shippingFromItems : inferredShipping;
    const netAmountCents = Math.max(order.total_amount - shippingCents, 0);

    return {
      netAmountCents,
      shippingCents,
      totalAmountCents: order.total_amount,
    };
  };

  const getOrderProductItems = (order: Order) => {
    if (!Array.isArray(order.items)) return [];
    return order.items.filter((item: any) => !isShippingItem(item));
  };

  const getExportFormulaLabel = (order: Order) => {
    const productItems = getOrderProductItems(order);
    if (productItems.length > 0) {
      const labels = productItems.map((item: any) => {
        const priceId = item.price_id || "";
        if (SUBSCRIPTION_LABELS[priceId]) return SUBSCRIPTION_LABELS[priceId];
        return getItemLabel(item);
      });
      return labels.join(" + ");
    }

    if (isSubscription(order)) {
      const subType = order.subscription_type || "";
      return SUBSCRIPTION_LABELS[subType] || subType || "Abonnement";
    }

    return "—";
  };

  const doExport = async (orderList: Order[], label: string) => {
    const XLSX = await import("xlsx");
    const data = orderList.map((o) => {
      const { netAmountCents, shippingCents, totalAmountCents } = getOrderAmounts(o);

      return {
        "N° commande": o.order_number ? `#${o.order_number}` : "",
        "Date": new Date(o.created_at).toLocaleDateString("fr-FR"),
        "Nom": o.last_name,
        "Prénom": o.first_name,
        "Adresse 1": o.address_line1,
        "Adresse 2": o.address_line2 || "",
        "Code postal": o.postal_code,
        "Ville": o.city,
        "Pays": o.country,
        "Factu. Prénom": o.billing_first_name || "",
        "Factu. Nom": o.billing_last_name || "",
        "Factu. Adresse 1": o.billing_address_line1 || "",
        "Factu. Adresse 2": o.billing_address_line2 || "",
        "Factu. Code postal": o.billing_postal_code || "",
        "Factu. Ville": o.billing_city || "",
        "Factu. Pays": o.billing_country || "",
        "Email": o.email,
        "Téléphone": o.phone || "",
        "Commentaire": o.comment || "",
        "N° abonné": o.subscriber_number || "",
        "Formule": getExportFormulaLabel(o),
        "Début abo": o.subscription_start_date ? new Date(o.subscription_start_date).toLocaleDateString("fr-FR") : "",
        "Fin abo": o.subscription_end_date ? new Date(o.subscription_end_date).toLocaleDateString("fr-FR") : "",
        "Paiement net (€)": (netAmountCents / 100).toFixed(2),
        "Frais de livraison (€)": (shippingCents / 100).toFixed(2),
        "Paiement total (€)": (totalAmountCents / 100).toFixed(2),
        "Mode de paiement": o.payment_method,
        "Statut paiement": o.payment_status,
        "Traité": o.is_processed ? "Oui" : "Non",
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Commandes");
    XLSX.writeFile(wb, `commandes-${label}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const [showExportArchiveConfirm, setShowExportArchiveConfirm] = useState(false);

  const exportActiveAndArchive = async () => {
    await doExport(activeOrders, "a-traiter");
    setShowExportArchiveConfirm(true);
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
    const name = String(item?.name || item?.title || "");
    const id = String(item?.id || "");
    const priceId = String(item?.price_id || "");

    const product = Object.values(PRODUCTS).find(
      (p) => p.id === id || p.price_id === priceId,
    );
    if (product) return product.name;

    const issueNum = item?.issue_number || name.match(/N°?\s*(\d+)/)?.[1] || "";

    if (
      id.startsWith("blog-") ||
      (priceId === "price_1T123wKbRd4yKDMH1bI9GQqh" && item?.unit_amount === 300 && !issueNum) ||
      name.toLowerCase().includes("article blog")
    ) {
      return "Article blog";
    }

    if (
      id.startsWith("digital-") ||
      id === "mag-digital" ||
      name.toLowerCase().includes("numérique") ||
      name.toLowerCase().includes("digital")
    ) {
      return issueNum ? `N°${issueNum} (digital)` : "Article digital";
    }

    if (priceId === "price_1T123wKbRd4yKDMH1bI9GQqh" && issueNum) {
      return `N°${issueNum} (digital)`;
    }

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
    const productItems = getOrderProductItems(order);
    const itemCount = productItems.length;

    if (itemCount > 1) {
      return "Commandes multiples";
    }

    if (isSubscription(order)) {
      const subType = order.subscription_type || "";
      return SUBSCRIPTION_LABELS[subType] || subType || "Abonnement";
    }

    if (itemCount === 1) {
      return getItemLabel(productItems[0]);
    }

    return "—";
  };

  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const invoiceAmounts = invoiceOrder ? getOrderAmounts(invoiceOrder) : null;
  const invoiceProductItems = invoiceOrder ? getOrderProductItems(invoiceOrder) : [];

  const printInvoice = () => {
    const el = document.getElementById("invoice-print-area");
    if (!el) return;
    const w = window.open("", "_blank", "width=800,height=1000");
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Facture</title><style>
      body{font-family:Arial,sans-serif;padding:40px;color:#222;max-width:700px;margin:0 auto}
      h1{font-size:24px;margin-bottom:4px}
      .header{display:flex;justify-content:space-between;margin-bottom:30px}
      .section{margin-bottom:20px}
      .label{font-weight:bold;font-size:12px;color:#666;text-transform:uppercase;margin-bottom:4px}
      table{width:100%;border-collapse:collapse;margin-top:10px}
      th,td{text-align:left;padding:8px 12px;border-bottom:1px solid #ddd;font-size:13px}
      th{background:#f5f5f5;font-weight:600}
      .total-row td{font-weight:bold;font-size:15px;border-top:2px solid #333}
      .footer{margin-top:40px;font-size:11px;color:#888;text-align:center}
      @media print{body{padding:20px}}
    </style></head><body>${el.innerHTML}<div class="footer">B&D EDITIONS (Info Pêche) — SAS au capital de 5 000 €<br/>SIREN 798 979 761 — SIRET 798 979 761 00029<br/>20 AVENUE DES LAURIERS ROSES, 13600 LA CIOTAT — contact@info-peche.fr</div></body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };

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
        const productItems = getOrderProductItems(order);
        const isMultiple = productItems.length > 1;

        if (isMultiple) {
          const isExpanded = expandedOrders.has(order.id);
          return (
            <button
              onClick={() => toggleExpand(order.id)}
              className="flex items-center gap-1 text-primary hover:underline font-medium"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {label} ({productItems.length})
            </button>
          );
        }

        return label;
      }
      case "total": {
        const { netAmountCents } = getOrderAmounts(order);
        return <span className="font-bold">{(netAmountCents / 100).toFixed(2)}€</span>;
      }
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
      case "factu_nom": {
        const fn = order.billing_first_name;
        const ln = order.billing_last_name;
        return fn || ln ? `${fn || ""} ${ln || ""}`.trim() : "—";
      }
      case "factu_adresse": {
        const parts = [order.billing_address_line1, order.billing_address_line2].filter(Boolean);
        return parts.length > 0 ? parts.join(", ") : "—";
      }
      case "factu_ville": {
        if (!order.billing_city) return "—";
        return `${order.billing_postal_code || ""} ${order.billing_city}`.trim();
      }
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

  const renderOrderTable = (orderList: Order[], selectable: boolean = false) => (
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
              <th className="h-12 px-2 text-left align-middle font-medium text-muted-foreground" style={{ width: 40 }}>
                {selectable ? (
                  <Checkbox
                    checked={orderList.length > 0 && orderList.every(o => selectedOrders.has(o.id))}
                    onCheckedChange={() => toggleSelectAll(orderList)}
                  />
                ) : null}
              </th>
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
              <th className="h-12 px-2 text-center align-middle font-medium text-muted-foreground" style={{ width: 70 }}></th>
            </tr>
          </thead>
          <tbody>
            {orderList.map(order => {
              const productItems = getOrderProductItems(order);
              const isMultiple = productItems.length > 1;
              const isExpanded = expandedOrders.has(order.id);
              return (
                <>
                  <tr key={order.id} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-2 align-middle">
                      {selectable ? (
                        <Checkbox
                          checked={selectedOrders.has(order.id)}
                          onCheckedChange={() => toggleSelectOrder(order.id)}
                        />
                      ) : (
                        <Checkbox
                          checked={order.is_processed}
                          onCheckedChange={() => unarchiveOrder(order.id)}
                        />
                      )}
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
                      <div className="flex items-center gap-0.5 justify-center">
                        <button
                          onClick={() => setInvoiceOrder(order)}
                          className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                          title="Voir la facture"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
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
                      </div>
                    </td>
                  </tr>
                  {isMultiple && isExpanded && (
                    <tr key={`${order.id}-detail`} className="bg-muted/30 border-b">
                      <td colSpan={visibleCols.length + 2} className="px-6 py-3">
                        <div className="text-xs space-y-1.5">
                          <p className="font-medium text-muted-foreground mb-2">Détail des articles :</p>
                          {productItems.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-3 text-foreground">
                              <span className="text-muted-foreground">{idx + 1}.</span>
                              <span className="font-medium">{getItemLabel(item)}</span>
                              {item.price && <span className="text-muted-foreground">— {typeof item.price === "number" ? `${item.price.toFixed(2)}€` : item.price}</span>}
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
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gestion Business</p>
            <TabsList className="flex-wrap">
              <TabsTrigger value="orders" className="gap-2">
                <Package className="w-4 h-4" /> Commandes
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="w-4 h-4" /> Analytics
              </TabsTrigger>
              <TabsTrigger value="stock" className="gap-2">
                <PackageOpen className="w-4 h-4" /> Stocks & Tarifs
              </TabsTrigger>
              <TabsTrigger value="crm" className="gap-2">
                <Contact className="w-4 h-4" /> CRM Clients
              </TabsTrigger>
            </TabsList>

            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Gestion Contenu</p>
            <TabsList className="flex-wrap">
              <TabsTrigger value="edition" className="gap-2">
                <Newspaper className="w-4 h-4" /> Édition du mois
              </TabsTrigger>
              <TabsTrigger value="blog" className="gap-2">
                <FileText className="w-4 h-4" /> Blog
              </TabsTrigger>
              <TabsTrigger value="reviews" className="gap-2">
                <MessageSquare className="w-4 h-4" /> Avis
              </TabsTrigger>
            </TabsList>
          </div>

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

          <TabsContent value="crm">
            <AdminCRM />
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

               <DropdownMenu>
                 <DropdownMenuTrigger asChild>
                   <Button variant="outline" size="sm">
                     <Download className="w-4 h-4 mr-2" /> Exporter Excel <ChevronDown className="w-3 h-3 ml-1" />
                   </Button>
                 </DropdownMenuTrigger>
                 <DropdownMenuContent align="end">
                   <DropdownMenuLabel>Exporter</DropdownMenuLabel>
                   <DropdownMenuSeparator />
                   <button
                     className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                     onClick={() => doExport(activeOrders, "a-traiter")}
                   >
                     Commandes à traiter ({activeOrders.length})
                   </button>
                   <button
                     className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                     onClick={exportActiveAndArchive}
                   >
                     À traiter + archiver ensuite
                   </button>
                   <DropdownMenuSeparator />
                   <button
                     className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                     onClick={() => doExport(archivedOrders, "archivees")}
                   >
                     Commandes archivées ({archivedOrders.length})
                   </button>
                   <DropdownMenuSeparator />
                   <button
                     className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                     onClick={() => doExport(filteredOrders, "toutes")}
                   >
                     Toutes les commandes ({filteredOrders.length})
                   </button>
                 </DropdownMenuContent>
               </DropdownMenu>
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
                {selectedOrders.size > 0 && (
                  <div className="flex items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg border border-border">
                    <span className="text-sm font-medium">{selectedOrders.size} commande{selectedOrders.size > 1 ? "s" : ""} sélectionnée{selectedOrders.size > 1 ? "s" : ""}</span>
                    <Button size="sm" variant="outline" onClick={() => setShowArchiveConfirm(true)}>
                      <Archive className="w-4 h-4 mr-2" /> Archiver la sélection
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedOrders(new Set())}>
                      Désélectionner
                    </Button>
                  </div>
                )}
                {loading ? (
                  <div className="text-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                  </div>
                ) : activeOrders.length === 0 ? (
                  <div className="text-center py-20 text-muted-foreground">
                    Aucune commande à traiter.
                  </div>
                ) : renderOrderTable(activeOrders, true)}
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
                ) : renderOrderTable(archivedOrders, false)}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </main>

      {/* Archive confirmation dialog */}
      <AlertDialog open={showArchiveConfirm} onOpenChange={setShowArchiveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archiver {selectedOrders.size} commande{selectedOrders.size > 1 ? "s" : ""} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les commandes sélectionnées seront déplacées dans l'onglet "Archivées".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={archiveSelected}>
              Oui, archiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export + archive confirmation dialog */}
      <AlertDialog open={showExportArchiveConfirm} onOpenChange={setShowExportArchiveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archiver les commandes exportées ?</AlertDialogTitle>
            <AlertDialogDescription>
              L'export est terminé. Voulez-vous archiver les {activeOrders.length} commande{activeOrders.length > 1 ? "s" : ""} "à traiter" ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non, garder en "à traiter"</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              const ids = activeOrders.map(o => o.id);
              const ok = await updateArchiveStatus(ids, true);
              if (!ok) return;
              setShowExportArchiveConfirm(false);
              toast.success(`${ids.length} commandes archivées`);
            }}>
              Oui, archiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invoice Dialog */}
      <Dialog open={!!invoiceOrder} onOpenChange={(open) => !open && setInvoiceOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Facture {invoiceOrder?.order_number ? `#${invoiceOrder.order_number}` : ""}</span>
              <Button size="sm" variant="outline" onClick={printInvoice}>
                <Download className="w-4 h-4 mr-2" /> Imprimer / PDF
              </Button>
            </DialogTitle>
          </DialogHeader>
          {invoiceOrder && (
            <div id="invoice-print-area">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: "bold", marginBottom: 4 }}>FACTURE</h1>
                  <p style={{ fontSize: 13, color: "#666" }}>
                    N° {invoiceOrder.order_number ? `${invoiceOrder.order_number}` : invoiceOrder.id.slice(0, 8)}
                  </p>
                  <p style={{ fontSize: 13, color: "#666" }}>
                    Date : {new Date(invoiceOrder.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontWeight: "bold", fontSize: 14 }}>B&D EDITIONS (Info Pêche)</p>
                  <p style={{ fontSize: 12, color: "#666" }}>SAS au capital de 5 000 €</p>
                  <p style={{ fontSize: 12, color: "#666" }}>SIREN 798 979 761 — SIRET 798 979 761 00029</p>
                  <p style={{ fontSize: 12, color: "#666" }}>20 AVENUE DES LAURIERS ROSES, 13600 LA CIOTAT</p>
                  <p style={{ fontSize: 12, color: "#666" }}>contact@info-peche.fr</p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 40, marginBottom: 24 }}>
                <div>
                  <p style={{ fontWeight: "bold", fontSize: 11, color: "#888", textTransform: "uppercase", marginBottom: 4 }}>Adresse de livraison</p>
                  <p style={{ fontSize: 13 }}>{invoiceOrder.first_name} {invoiceOrder.last_name}</p>
                  <p style={{ fontSize: 13 }}>{invoiceOrder.address_line1}</p>
                  {invoiceOrder.address_line2 && <p style={{ fontSize: 13 }}>{invoiceOrder.address_line2}</p>}
                  <p style={{ fontSize: 13 }}>{invoiceOrder.postal_code} {invoiceOrder.city}</p>
                  <p style={{ fontSize: 13 }}>{invoiceOrder.country}</p>
                </div>
                {invoiceOrder.billing_address_line1 && (
                  <div>
                    <p style={{ fontWeight: "bold", fontSize: 11, color: "#888", textTransform: "uppercase", marginBottom: 4 }}>Adresse de facturation</p>
                    <p style={{ fontSize: 13 }}>{invoiceOrder.billing_first_name} {invoiceOrder.billing_last_name}</p>
                    <p style={{ fontSize: 13 }}>{invoiceOrder.billing_address_line1}</p>
                    {invoiceOrder.billing_address_line2 && <p style={{ fontSize: 13 }}>{invoiceOrder.billing_address_line2}</p>}
                    <p style={{ fontSize: 13 }}>{invoiceOrder.billing_postal_code} {invoiceOrder.billing_city}</p>
                    <p style={{ fontSize: 13 }}>{invoiceOrder.billing_country}</p>
                  </div>
                )}
              </div>

              <p style={{ fontSize: 13, marginBottom: 8 }}><strong>Email :</strong> {invoiceOrder.email}</p>
              {invoiceOrder.subscriber_number && (
                <p style={{ fontSize: 13, marginBottom: 8 }}><strong>N° abonné :</strong> {invoiceOrder.subscriber_number}</p>
              )}

              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid #ddd", fontSize: 12, background: "#f5f5f5" }}>Article</th>
                    <th style={{ textAlign: "center", padding: "8px 12px", borderBottom: "2px solid #ddd", fontSize: 12, background: "#f5f5f5" }}>Qté</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", borderBottom: "2px solid #ddd", fontSize: 12, background: "#f5f5f5" }}>Prix</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceProductItems.map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid #eee", fontSize: 13 }}>{getItemLabel(item)}</td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid #eee", fontSize: 13, textAlign: "center" }}>{item.quantity || 1}</td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid #eee", fontSize: 13, textAlign: "right" }}>
                        {getLineTotalCents(item) > 0 ? `${(getLineTotalCents(item) / 100).toFixed(2)}€` : "—"}
                      </td>
                    </tr>
                  ))}
                  {!!invoiceAmounts?.shippingCents && invoiceAmounts.shippingCents > 0 && (
                    <tr>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid #eee", fontSize: 13 }}>Frais de livraison</td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid #eee", fontSize: 13, textAlign: "center" }}>1</td>
                      <td style={{ padding: "8px 12px", borderBottom: "1px solid #eee", fontSize: 13, textAlign: "right" }}>
                        {(invoiceAmounts.shippingCents / 100).toFixed(2)}€
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={2} style={{ padding: "10px 12px", fontWeight: "bold", fontSize: 14, borderTop: "2px solid #333" }}>Total</td>
                    <td style={{ padding: "10px 12px", fontWeight: "bold", fontSize: 14, textAlign: "right", borderTop: "2px solid #333" }}>
                      {invoiceAmounts ? `${(invoiceAmounts.totalAmountCents / 100).toFixed(2)}€` : "—"}
                    </td>
                  </tr>
                </tbody>
              </table>

              <p style={{ marginTop: 16, fontSize: 12, color: "#888" }}>
                Paiement : {getPaymentMethodLabel(invoiceOrder.payment_method)} — Statut : {invoiceOrder.payment_status}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
