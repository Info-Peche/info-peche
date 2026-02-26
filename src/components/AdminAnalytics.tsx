import { useMemo, useState } from "react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart3, TrendingUp, CalendarIcon } from "lucide-react";
import { format, subMonths, subYears, startOfMonth, endOfMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

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

const FORMULA_COLORS: Record<string, string> = {
  "2 ans": "hsl(var(--primary))",
  "1 an": "hsl(var(--chart-2))",
  "6 mois": "hsl(var(--chart-3))",
  "Numéro à l'unité": "hsl(var(--chart-4))",
  "Numéro numérique": "hsl(var(--chart-5))",
};

type ChartMode = "ca" | "count";
type DatePreset = "3m" | "6m" | "12m" | "ytd" | "all" | "custom";

const AdminAnalytics = ({ orders }: Props) => {
  const [chartMode, setChartMode] = useState<ChartMode>("ca");
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  const now = new Date();

  const dateRange = useMemo((): { from: Date | null; to: Date | null } => {
    switch (datePreset) {
      case "3m": return { from: subMonths(now, 3), to: now };
      case "6m": return { from: subMonths(now, 6), to: now };
      case "12m": return { from: subYears(now, 1), to: now };
      case "ytd": return { from: new Date(now.getFullYear(), 0, 1), to: now };
      case "custom": return { from: customFrom || null, to: customTo || null };
      default: return { from: null, to: null };
    }
  }, [datePreset, customFrom, customTo]);

  const paidOrders = useMemo(() => {
    return orders.filter((o) => {
      if (o.payment_status !== "paid") return false;
      const d = new Date(o.created_at);
      if (dateRange.from && d < dateRange.from) return false;
      if (dateRange.to && d > dateRange.to) return false;
      return true;
    });
  }, [orders, dateRange]);

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

  const toggleFilter = (key: string) => {
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

  const presets: { key: DatePreset; label: string }[] = [
    { key: "3m", label: "3 mois" },
    { key: "6m", label: "6 mois" },
    { key: "12m", label: "12 mois" },
    { key: "ytd", label: "Année" },
    { key: "all", label: "Tout" },
    { key: "custom", label: "Personnalisé" },
  ];

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
        {/* CA / Count toggle */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={chartMode === "ca" ? "default" : "ghost"}
            size="sm"
            onClick={() => setChartMode("ca")}
            className="gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5" /> CA
          </Button>
          <Button
            variant={chartMode === "count" ? "default" : "ghost"}
            size="sm"
            onClick={() => setChartMode("count")}
            className="gap-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5" /> Ventes
          </Button>
        </div>

        <div className="h-6 w-px bg-border" />

        {/* Date presets */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {presets.map((p) => (
            <Button
              key={p.key}
              variant={datePreset === p.key ? "default" : "ghost"}
              size="sm"
              onClick={() => setDatePreset(p.key)}
              className="text-xs px-2.5"
            >
              {p.label}
            </Button>
          ))}
        </div>

        {/* Custom date pickers */}
        {datePreset === "custom" && (
          <>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-1.5 text-xs", !customFrom && "text-muted-foreground")}>
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {customFrom ? format(customFrom, "dd/MM/yyyy") : "Début"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customFrom}
                  onSelect={setCustomFrom}
                  locale={fr}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("gap-1.5 text-xs", !customTo && "text-muted-foreground")}>
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {customTo ? format(customTo, "dd/MM/yyyy") : "Fin"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customTo}
                  onSelect={setCustomTo}
                  locale={fr}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </>
        )}

        <div className="h-6 w-px bg-border" />

        {/* Formula filters */}
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

      {/* Chart - LineChart */}
      <div className="bg-card border border-border rounded-xl p-4" style={{ height: 400 }}>
        {monthlyData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Aucune donnée pour les filtres sélectionnés
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              <Legend formatter={(value: string) => value.replace(/^(ca_|count_)/, "")} />
              {visibleFormulas.map((f) => (
                <Line
                  key={f}
                  type="monotone"
                  dataKey={chartMode === "ca" ? `ca_${f}` : `count_${f}`}
                  name={chartMode === "ca" ? `ca_${f}` : `count_${f}`}
                  stroke={FORMULA_COLORS[f] || "hsl(var(--primary))"}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: FORMULA_COLORS[f] || "hsl(var(--primary))" }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
