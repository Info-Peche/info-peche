import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp } from "lucide-react";

type Order = {
  id: string;
  created_at: string;
  order_type: string;
  total_amount: number;
  payment_status: string;
  subscription_type: string | null;
  items: any;
};

type Props = { orders: Order[] };

const ORDER_TYPE_LABELS: Record<string, string> = {
  subscription_paper: "Abonnement papier",
  single_issue: "Numéro à l'unité",
  digital_single: "Numéro numérique",
};

const FORMULA_COLORS: Record<string, string> = {
  "2 ans": "hsl(var(--primary))",
  "1 an": "hsl(var(--chart-2))",
  "6 mois": "hsl(var(--chart-3))",
  "Numéro à l'unité": "hsl(var(--chart-4))",
  "Numéro numérique": "hsl(var(--chart-5))",
};

type ChartMode = "ca" | "count";
type FilterKey = string;

const AdminAnalytics = ({ orders }: Props) => {
  const [chartMode, setChartMode] = useState<ChartMode>("ca");
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set());

  const paidOrders = useMemo(
    () => orders.filter((o) => o.payment_status === "paid"),
    [orders]
  );

  const getFormula = (order: Order): string => {
    if (order.order_type === "subscription_paper") return order.subscription_type || "Abo";
    if (order.order_type === "digital_single") return "Numéro numérique";
    return "Numéro à l'unité";
  };

  const allFormulas = useMemo(() => {
    const set = new Set<string>();
    paidOrders.forEach((o) => set.add(getFormula(o)));
    return Array.from(set).sort();
  }, [paidOrders]);

  const toggleFilter = (key: FilterKey) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const visibleFormulas = activeFilters.size === 0 ? allFormulas : allFormulas.filter((f) => activeFilters.has(f));

  const monthlyData = useMemo(() => {
    const map = new Map<string, Record<string, number>>();

    paidOrders.forEach((o) => {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const formula = getFormula(o);
      if (!visibleFormulas.includes(formula)) return;

      if (!map.has(key)) map.set(key, {});
      const entry = map.get(key)!;
      const caKey = `ca_${formula}`;
      const countKey = `count_${formula}`;
      entry[caKey] = (entry[caKey] || 0) + o.total_amount / 100;
      entry[countKey] = (entry[countKey] || 0) + 1;
    });

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => {
        const [y, m] = month.split("-");
        return { month, label: `${m}/${y.slice(2)}`, ...data };
      });
  }, [paidOrders, visibleFormulas]);

  const totalCA = useMemo(
    () => paidOrders.reduce((sum, o) => sum + o.total_amount / 100, 0),
    [paidOrders]
  );

  const totalCount = paidOrders.length;

  const formatEur = (v: number) => `${v.toFixed(0)}€`;

  return (
    <div className="space-y-6">
      {/* KPI summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">CA total</p>
          <p className="text-2xl font-bold text-foreground">{totalCA.toFixed(0)}€</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Ventes payées</p>
          <p className="text-2xl font-bold text-foreground">{totalCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Panier moyen</p>
          <p className="text-2xl font-bold text-foreground">{totalCount > 0 ? (totalCA / totalCount).toFixed(0) : 0}€</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Formules actives</p>
          <p className="text-2xl font-bold text-foreground">{allFormulas.length}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={chartMode === "ca" ? "default" : "ghost"}
            size="sm"
            onClick={() => setChartMode("ca")}
            className="gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5" /> Chiffre d'affaires
          </Button>
          <Button
            variant={chartMode === "count" ? "default" : "ghost"}
            size="sm"
            onClick={() => setChartMode("count")}
            className="gap-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5" /> Nombre de ventes
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex flex-wrap gap-2">
          {allFormulas.map((f) => (
            <Badge
              key={f}
              variant={activeFilters.size === 0 || activeFilters.has(f) ? "default" : "outline"}
              className="cursor-pointer select-none transition-colors"
              style={{
                backgroundColor:
                  activeFilters.size === 0 || activeFilters.has(f) ? FORMULA_COLORS[f] || "hsl(var(--primary))" : undefined,
                color: activeFilters.size === 0 || activeFilters.has(f) ? "white" : undefined,
              }}
              onClick={() => toggleFilter(f)}
            >
              {f}
            </Badge>
          ))}
          {activeFilters.size > 0 && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setActiveFilters(new Set())}>
              Tout afficher
            </Badge>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card border border-border rounded-xl p-4" style={{ height: 400 }}>
        {monthlyData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Aucune donnée pour les filtres sélectionnés
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis
                tickFormatter={chartMode === "ca" ? formatEur : undefined}
                tick={{ fontSize: 12 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) => {
                  const formula = name.replace(/^(ca_|count_)/, "");
                  return [chartMode === "ca" ? `${value.toFixed(2)}€` : value, formula];
                }}
              />
              <Legend
                formatter={(value: string) => value.replace(/^(ca_|count_)/, "")}
              />
              {visibleFormulas.map((f) => (
                <Bar
                  key={f}
                  dataKey={chartMode === "ca" ? `ca_${f}` : `count_${f}`}
                  name={chartMode === "ca" ? `ca_${f}` : `count_${f}`}
                  fill={FORMULA_COLORS[f] || "hsl(var(--primary))"}
                  radius={[4, 4, 0, 0]}
                  stackId="a"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
