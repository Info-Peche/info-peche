import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, PackageOpen, AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";

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
};

type EditState = {
  physical_stock: string;
  physical_price_cents: string;
  price_cents: string;
};

const AdminStockManager = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, EditState>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const fetchIssues = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("digital_issues")
      .select("id, issue_number, title, cover_image, physical_stock, physical_price_cents, price_cents, is_current, is_archived, published_at")
      .order("issue_number", { ascending: false });
    if (!error && data) setIssues(data);
    setLoading(false);
  };

  useEffect(() => { fetchIssues(); }, []);

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

  if (loading) {
    return (
      <div className="text-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <PackageOpen className="w-5 h-5 text-primary" />
          Gestion des stocks & tarifs
        </h2>
        <Badge variant="outline">{issues.length} numéros</Badge>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Numéro</th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Titre</th>
                <th className="h-12 px-4 text-center font-medium text-muted-foreground">Statut</th>
                <th className="h-12 px-4 text-center font-medium text-muted-foreground">Stock physique</th>
                <th className="h-12 px-4 text-center font-medium text-muted-foreground">Prix papier (€)</th>
                <th className="h-12 px-4 text-center font-medium text-muted-foreground">Prix digital (€)</th>
                <th className="h-12 px-4 text-center font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {issues.map(issue => {
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
                      {issue.is_current
                        ? <Badge className="text-xs">En cours</Badge>
                        : issue.is_archived
                          ? <Badge variant="outline" className="text-xs">Archivé</Badge>
                          : <Badge variant="secondary" className="text-xs">Publié</Badge>}
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminStockManager;
