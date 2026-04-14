"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { fetchDebitos } from "@/lib/api";
import type { Debito } from "@/types/database";

function formatCurrency(value: number | null) {
  if (value == null) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPaymentMethod(method: string | null) {
  const map: Record<string, string> = {
    pix: "PIX",
    debit: "Débito",
    credit: "Crédito",
    cash: "Dinheiro",
    billing: "Faturamento",
  };
  return method ? map[method] ?? method : "—";
}

// ─── Mini Bar Chart (pure SVG) ─────────────────────────────
function BarChart({
  data,
  labels,
}: {
  data: number[];
  labels: string[];
}) {
  const max = Math.max(...data, 1);
  const barW = 40;
  const gap = 12;
  const chartH = 140;
  const chartW = data.length * (barW + gap) - gap;

  return (
    <svg
      viewBox={`0 0 ${chartW + 20} ${chartH + 30}`}
      className="w-full h-44"
      preserveAspectRatio="xMidYMid meet"
    >
      {data.map((val, i) => {
        const barH = (val / max) * chartH || 2;
        const x = i * (barW + gap) + 10;
        const y = chartH - barH;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={4}
              className="fill-primary"
            />
            <text
              x={x + barW / 2}
              y={chartH + 16}
              textAnchor="middle"
              className="fill-contrast text-[10px]"
            >
              {labels[i]}
            </text>
            <text
              x={x + barW / 2}
              y={y - 6}
              textAnchor="middle"
              className="fill-dark text-[9px] font-semibold"
            >
              {val > 0
                ? val.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    maximumFractionDigits: 0,
                  })
                : ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Stat Card ─────────────────────────────────────────────
function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-surface rounded-xl border border-border p-5 flex items-start gap-4">
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: color + "20", color }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-contrast text-xs font-body">{title}</p>
        <p className="text-dark text-xl font-heading font-black mt-0.5 truncate">
          {value}
        </p>
        <p className="text-contrast text-xs mt-1">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────
export default function FinanceiroPage() {
  const [debitos, setDebitos] = useState<Debito[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pendentes" | "pagas">("pendentes");
  const [search, setSearch] = useState("");

  const loadDebitos = useCallback(() => {
    setLoading(true);
    fetchDebitos()
      .then(setDebitos)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadDebitos();
  }, [loadDebitos]);

  // ─── Stats ───────────────────────────────────────────────
  const stats = useMemo(() => {
    const pagos = debitos.filter((d) => d.pago);
    const pendentes = debitos.filter((d) => !d.pago);

    const totalPago = pagos.reduce(
      (sum, d) => sum + (d.valor_final ?? d.valor_estimado ?? 0),
      0
    );
    const totalPendente = pendentes.reduce(
      (sum, d) => sum + (d.valor_final ?? d.valor_estimado ?? 0),
      0
    );

    // Monthly revenue for last 6 months
    const now = new Date();
    const months: { label: string; total: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d
        .toLocaleDateString("pt-BR", { month: "short" })
        .replace(".", "");
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const total = pagos
        .filter((p) => {
          const pd = new Date(p.data);
          return pd >= monthStart && pd <= monthEnd;
        })
        .reduce(
          (sum, p) => sum + (p.valor_final ?? p.valor_estimado ?? 0),
          0
        );
      months.push({ label, total });
    }

    // Growth: current month vs previous
    const currentMonth = months[months.length - 1]?.total ?? 0;
    const previousMonth = months[months.length - 2]?.total ?? 0;
    const growth =
      previousMonth > 0
        ? ((currentMonth - previousMonth) / previousMonth) * 100
        : currentMonth > 0
          ? 100
          : 0;

    return {
      totalPago,
      totalPendente,
      totalDebitos: debitos.length,
      growth,
      months,
    };
  }, [debitos]);

  // ─── Filtered list ───────────────────────────────────────
  const filtered = useMemo(() => {
    const byTab = debitos.filter((d) =>
      tab === "pagas" ? d.pago : !d.pago
    );
    if (!search.trim()) return byTab;
    const q = search.toLowerCase();
    return byTab.filter(
      (d) =>
        d.descricao.toLowerCase().includes(q) ||
        d.cliente.toLowerCase().includes(q) ||
        d.categoria.toLowerCase().includes(q)
    );
  }, [debitos, tab, search]);

  const pendentesCount = debitos.filter((d) => !d.pago).length;
  const pagasCount = debitos.filter((d) => d.pago).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-black text-dark">
          Financeiro
        </h1>
        <p className="text-contrast text-sm mt-1">
          Acompanhe a saúde financeira da operação
        </p>
      </div>

      {/* Stats + Chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Receita Total"
          value={formatCurrency(stats.totalPago)}
          subtitle={
            stats.growth >= 0
              ? `↑ ${stats.growth.toFixed(1)}% vs. mês anterior`
              : `↓ ${Math.abs(stats.growth).toFixed(1)}% vs. mês anterior`
          }
          color="#22C55E"
          icon={
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
        <StatCard
          title="Pendente"
          value={formatCurrency(stats.totalPendente)}
          subtitle={`${pendentesCount} débito${pendentesCount !== 1 ? "s" : ""} aguardando pagamento`}
          color="#f59e0b"
          icon={
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />

        {/* Chart card */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <p className="text-contrast text-xs font-body mb-2">
            Receita Mensal (últimos 6 meses)
          </p>
          {stats.months.every((m) => m.total === 0) ? (
            <div className="flex items-center justify-center h-36 text-contrast text-xs">
              Sem dados de receita ainda
            </div>
          ) : (
            <BarChart
              data={stats.months.map((m) => m.total)}
              labels={stats.months.map((m) => m.label)}
            />
          )}
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex gap-1 bg-surface border border-border rounded-lg p-1">
          <button
            onClick={() => setTab("pendentes")}
            className={`px-4 py-1.5 rounded-md text-sm font-body transition-colors cursor-pointer ${
              tab === "pendentes"
                ? "bg-primary text-background font-semibold"
                : "text-contrast hover:text-dark"
            }`}
          >
            Pendentes ({pendentesCount})
          </button>
          <button
            onClick={() => setTab("pagas")}
            className={`px-4 py-1.5 rounded-md text-sm font-body transition-colors cursor-pointer ${
              tab === "pagas"
                ? "bg-primary text-background font-semibold"
                : "text-contrast hover:text-dark"
            }`}
          >
            Pagas ({pagasCount})
          </button>
        </div>
        <input
          type="text"
          placeholder="Buscar por descrição, cliente ou categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-80 rounded-lg bg-background border border-border text-dark placeholder:text-contrast/40 focus:ring-primary focus:ring-1 focus:outline-none px-3 py-2 text-sm font-body"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-contrast text-sm">
          Carregando dados financeiros...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-contrast text-sm">
          {search
            ? "Nenhum resultado encontrado"
            : tab === "pendentes"
              ? "Nenhum débito pendente"
              : "Nenhum débito pago"}
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-contrast text-left">
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 font-medium text-right">Valor</th>
                  <th className="px-4 py-3 font-medium">Pagamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-surface-hover transition-colors"
                  >
                    <td className="px-4 py-3 text-dark whitespace-nowrap">
                      {formatDate(d.data)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                          d.tipo === "viagem"
                            ? "bg-blue-500/10 text-blue-500"
                            : "bg-emerald-500/10 text-emerald-500"
                        }`}
                      >
                        {d.tipo === "viagem" ? "Viagem" : "Serviço"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-dark max-w-[280px] truncate">
                      {d.descricao}
                    </td>
                    <td className="px-4 py-3 text-contrast">{d.cliente}</td>
                    <td className="px-4 py-3 text-contrast">{d.categoria}</td>
                    <td className="px-4 py-3 text-dark text-right font-medium whitespace-nowrap">
                      {formatCurrency(d.valor_final ?? d.valor_estimado)}
                    </td>
                    <td className="px-4 py-3 text-contrast">
                      {formatPaymentMethod(d.metodo_pagamento)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
