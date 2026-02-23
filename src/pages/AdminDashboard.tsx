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
import { LogOut, Search, Package, Loader2, Download, CheckCircle } from "lucide-react";
import { toast } from "sonner";

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

  const statusColor = (status: string) => {
    switch (status) {
      case "paid": return "default";
      case "confirmed": return "default";
      case "pending": return "secondary";
      default: return "outline";
    }
  };

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
            <h1 className="text-xl font-serif font-bold text-foreground">Admin — Commandes</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Déconnexion
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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
            {filteredOrders.length} commande{filteredOrders.length > 1 ? "s" : ""}
          </Badge>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" /> Exporter CSV
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            Aucune commande trouvée.
          </div>
        ) : (
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
                    <TableHead>Type</TableHead>
                    <TableHead>Formule</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Paiement</TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead>Commentaire</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map(order => (
                    <TableRow key={order.id} className={order.is_processed ? "opacity-60" : ""}>
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
                        <Badge variant={order.is_recurring ? "default" : "outline"} className="text-xs">
                          {order.order_type === "subscription" ? "Abo" : "Achat"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{order.subscription_type || "—"}</TableCell>
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
                      <TableCell className="text-xs max-w-[150px] truncate" title={order.comment || ""}>
                        {order.comment || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
