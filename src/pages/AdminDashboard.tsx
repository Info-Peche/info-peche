import { useEffect, useState } from "react";
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
import { LogOut, Search, Package, Loader2, Download, Newspaper } from "lucide-react";
import { toast } from "sonner";
import AdminEditionManager from "@/components/AdminEditionManager";

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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

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
      o.last_name,
      o.first_name,
      o.address_line1,
      o.address_line2 || "",
      o.postal_code,
      o.city,
      o.country,
      o.email,
      o.phone || "",
      o.comment || "",
      o.subscriber_number || "",
      o.subscription_type || "",
      o.subscription_start_date ? new Date(o.subscription_start_date).toLocaleDateString("fr-FR") : "",
      o.subscription_end_date ? new Date(o.subscription_end_date).toLocaleDateString("fr-FR") : "",
      (o.total_amount / 100).toFixed(2),
      o.payment_method,
      o.payment_status,
      o.is_processed ? "Oui" : "Non",
    ]);

    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `commandes-infopeche-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredOrders = orders.filter(o => {
    const q = search.toLowerCase();
    return (
      o.email.toLowerCase().includes(q) ||
      o.first_name.toLowerCase().includes(q) ||
      o.last_name.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q)
    );
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

  const getFormulaLabel = (order: Order) => {
    if (order.order_type === "subscription") {
      return order.subscription_type || "—";
    }
    // Achat à l'unité : afficher le numéro du magazine
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      const issues = order.items.map((item: any) => item.issue_number || item.title || item.name).filter(Boolean);
      return issues.length > 0 ? `N°${issues.join(", N°")}` : "—";
    }
    return "—";
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "paid": return "default";
      case "confirmed": return "default";
      case "pending": return "secondary";
      default: return "outline";
    }
  };

  const renderOrderTable = (orderList: Order[]) => (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">✓</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tél</TableHead>
              <TableHead>Type de paiement</TableHead>
              <TableHead>Formule</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Paiement</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Pays</TableHead>
              <TableHead>Commentaire</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderList.map(order => (
              <TableRow key={order.id}>
                <TableCell>
                  <Checkbox
                    checked={order.is_processed}
                    onCheckedChange={() => toggleProcessed(order.id, order.is_processed)}
                  />
                </TableCell>
                <TableCell className="text-xs whitespace-nowrap">
                  {new Date(order.created_at).toLocaleDateString("fr-FR", {
                    day: "2-digit", month: "2-digit", year: "numeric",
                  })}
                </TableCell>
                <TableCell className="font-medium text-sm">
                  {order.first_name} {order.last_name}
                </TableCell>
                <TableCell className="text-xs">{order.email}</TableCell>
                <TableCell className="text-xs">{order.phone || "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {getPaymentMethodLabel(order.payment_method)}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{getFormulaLabel(order)}</TableCell>
                <TableCell className="font-bold text-sm">
                  {(order.total_amount / 100).toFixed(2)}€
                </TableCell>
                <TableCell>
                  <Badge variant={statusColor(order.payment_status) as any} className="text-xs">
                    {order.payment_status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">
                  {order.postal_code} {order.city}
                </TableCell>
                <TableCell className="text-xs">{order.country || "—"}</TableCell>
                <TableCell className="text-xs max-w-[150px] truncate" title={order.comment || ""}>
                  {order.comment || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
          </TabsList>

          <TabsContent value="edition">
            <AdminEditionManager />
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
