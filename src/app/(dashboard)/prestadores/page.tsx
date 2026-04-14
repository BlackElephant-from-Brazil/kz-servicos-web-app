"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchProviderProfiles } from "@/lib/api";
import type { ProviderProfile, ProviderStatus } from "@/types/database";
import NovoPrestadorForm from "@/components/forms/NovoPrestadorForm";

const statusLabels: Record<ProviderStatus, string> = {
  approved: "Aprovado",
  pending: "Pendente",
  rejected: "Rejeitado",
  suspended: "Suspenso",
};

const statusColors: Record<ProviderStatus, string> = {
  approved: "#22c55e",
  pending: "#FEBF22",
  rejected: "#ef4444",
  suspended: "#5C5956",
};

export default function PrestadoresPage() {
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loadProviders = useCallback(() => {
    setLoading(true);
    fetchProviderProfiles()
      .then(setProviders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const filtered = providers.filter((p) => {
    const name = p.users?.full_name ?? "";
    const phone = p.users?.phone ?? "";
    const q = search.toLowerCase();
    const matchSearch = name.toLowerCase().includes(q) || phone.toLowerCase().includes(q);
    const matchStatus = statusFilter ? p.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-black text-dark">
            Prestadores
          </h1>
          <p className="text-contrast text-sm mt-1">
            Gerencie os prestadores de serviço da plataforma
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-background px-5 py-2.5 rounded-lg font-heading font-bold text-sm hover:bg-primary-dark transition-colors cursor-pointer duration-200"
        >
          + Novo Prestador
        </button>
      </div>

      {/* Search & Filters */}
      <div className="mb-5 flex items-center gap-3">
        <input
          type="text"
          placeholder="Buscar prestador..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 rounded-lg border border-border bg-background text-dark placeholder:text-contrast/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-contrast">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-border bg-background text-dark text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Todos</option>
            <option value="approved">Aprovados</option>
            <option value="pending">Pendentes</option>
            <option value="suspended">Suspensos</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-contrast text-sm">
          Nenhum prestador encontrado.
        </div>
      ) : (
        /* Cards grid */
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((provider) => {
            const name = provider.users?.full_name ?? "Sem nome";
            const phone = provider.users?.phone ?? "—";
            const category = provider.service_categories?.name ?? "—";

            return (
              <div
                key={provider.id}
                className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-accent/10 flex items-center justify-center">
                      <span className="text-accent text-sm font-semibold">
                        {name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-dark">{name}</p>
                      <p className="text-xs text-contrast">{phone}</p>
                    </div>
                  </div>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: `${statusColors[provider.status]}15`,
                      color: statusColors[provider.status],
                    }}
                  >
                    {statusLabels[provider.status]}
                  </span>
                </div>

                {/* Category badge */}
                <div className="mb-3">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-dark">
                    {category}
                  </span>
                </div>

                {/* Bio */}
                {provider.bio && (
                  <p className="text-xs text-contrast leading-relaxed mb-4 line-clamp-2">
                    {provider.bio}
                  </p>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-contrast">Avaliação</span>
                    <span className="text-dark font-medium">
                      {provider.average_rating > 0
                        ? `⭐ ${provider.average_rating.toFixed(1)}`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-contrast">Serviços realizados</span>
                    <span className="text-dark font-medium">{provider.total_ratings}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-contrast">Máq. de cartão</span>
                    <span className="text-dark font-medium">
                      {provider.has_card_machine ? "Sim" : "Não"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-contrast">Emite nota fiscal</span>
                    <span className="text-dark font-medium">
                      {provider.issues_invoice ? "Sim" : "Não"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-end">
                  <button className="text-xs text-accent hover:text-accent-dark transition-colors font-medium">
                    Ver detalhes →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NovoPrestadorForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={loadProviders}
      />
    </div>
  );
}
