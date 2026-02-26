import { useMemo, useState, useEffect } from "react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart3, TrendingUp, CalendarIcon } from "lucide-react";
import { format, subMonths, subYears } from "date-fns";
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

const getFormula = (order: Order): string => {
  if (order.order_type === "subscription_paper") return order.subscription_type || "Abo";
  if (order.order_type === "digital_single") return "Numéro numérique";
  return "Numéro à l'unité";
};

const AdminAnalytics = ({ orders }: Props) => {
  const [chartMode, setChartMode] = useState<ChartMode>("ca");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  // All formulas from all paid orders (date-independent so checkboxes don't vanish)
  const allFormulas = useMemo(() => {
    const set = new Set<string>();
    orders.filter(o => o.payment_status === "paid").forEach(o => set.add(getFormula(o)));
    return Array.from(set).sort();
  }, [orders]);

  // Checked formulas — all checked by default
  const [checkedFormulas, setCheckedFormulas] = useState<Set<string>>(new Set(allFormulas));

  // Sync when allFormulas changes (e.g. new data loads)
  useEffect(() => {
    setCheckedFormulas(new Set(allFormulas));
  }, [allFormulas]);

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

  const toggleFormula = (f: string) => {
    setCheckedFormulas(prev => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  };

  const selectAll = () => setCheckedFormulas(new Set(allFormulas));
  const selectNone = () => setCheckedFormulas(new Set());

  const monthlyData = useMemo(() => {
    const map = new Map<string, Record<string, number>>();

    paidOrders.forEach((o) => {
      const formula = getFormula(o);
      if (!checkedFormulas.has(formula)) return;
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

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
  }, [paidOrders, checkedFormulas]);

  // KPIs scoped to visible formulas + date range
  const filteredOrders = useMemo(
    () => paidOrders.filter(o => checkedFormulas.has(getFormula(o))),
    [paidOrders, checkedFormulas]
  );
  const totalCA = useMemo(() => filteredOrders.reduce((s, o) => s + o.total_amount / 100, 0), [filteredOrders]);
  const totalCount = filteredOrders.length;

  const formatEur = (v: number) => `${v.toFixed(0)}€`;

  const presets: { key: DatePreset; label: string }[] = [
    { key: "3m", label: "3 mois" },
    { key: "6m", label: "6 mois" },
    { key: "12m", label: "12 mois" },
    { key: "ytd", label: "Année" },
    { key: "all", label: "Tout" },
  ];

  const visibleFormulas = allFormulas.filter(f => checkedFormulas.has(f));

  return (
    <div className="space-y-6">
      {/* KPI summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">CA (période)</p>
          <p className="text-2xl font-bold text-foreground">{totalCA.toFixed(0)}€</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Ventes (période)</p>
          <p className="text-2xl font-bold text-foreground">{totalCount}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Panier moyen</p>
          <p className="text-2xl font-bold text-foreground">{totalCount > 0 ? (totalCA / totalCount).toFixed(0) : 0}€</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Formules affichées</p>
          <p className="text-2xl font-bold text-foreground">{visibleFormulas.length}/{allFormulas.length}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        {/* Row 1: Mode + Date */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={chartMode === "ca" ? "default" : "ghost"}
              size="sm"
              onClick={() => setChartMode("ca")}
              className="gap-1.5 text-xs"
            >
              <TrendingUp className="w-3.5 h-3.5" /> Chiffre d'affaires
            </Button>
            <Button
              variant={chartMode === "count" ? "default" : "ghost"}
              size="sm"
              onClick={() => setChartMode("count")}
              className="gap-1.5 text-xs"
            >
              <BarChart3 className="w-3.5 h-3.5" /> Nombre de ventes
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

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
            <Button
              variant={datePreset === "custom" ? "default" : "ghost"}
              size="sm"
              onClick={() => setDatePreset("custom")}
              className="text-xs px-2.5 gap-1"
            >
              <CalendarIcon className="w-3 h-3" /> Dates
            </Button>
          </div>

          {datePreset === "custom" && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("gap-1.5 text-xs", !customFrom && "text-muted-foreground")}>
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {customFrom ? format(customFrom, "dd/MM/yyyy") : "Début"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} locale={fr} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground text-xs">→</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("gap-1.5 text-xs", !customTo && "text-muted-foreground")}>
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {customTo ? format(customTo, "dd/MM/yyyy") : "Fin"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customTo} onSelect={setCustomTo} locale={fr} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* Row 2: Formula checkboxes */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-xs font-medium text-muted-foreground">Formules :</span>
          {allFormulas.map((f) => (
            <label key={f} className="flex items-center gap-2 cursor-pointer select-none group">
              <Checkbox
                checked={checkedFormulas.has(f)}
                onCheckedChange={() => toggleFormula(f)}
              />
              <span className="flex items-center gap-1.5 text-xs">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: FORMULA_COLORS[f] || "hsl(var(--primary))" }}
                />
                {f}
              </span>
            </label>
          ))}
          <div className="h-4 w-px bg-border" />
          <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={selectAll}>Tout</Button>
          <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={selectNone}>Aucun</Button>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card border border-border rounded-xl p-4" style={{ height: 420 }}>
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
