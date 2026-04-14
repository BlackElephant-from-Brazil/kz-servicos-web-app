"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchDriverProfiles, fetchVehiclesByDriver } from "@/lib/api";
import type { DriverProfile, Vehicle, ProviderStatus } from "@/types/database";
import NovoMotoristaForm from "@/components/forms/NovoMotoristaForm";

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

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

interface DriverWithVehicle extends DriverProfile {
  vehicle?: Vehicle;
}

export default function MotoristasPage() {
  const [drivers, setDrivers] = useState<DriverWithVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loadDrivers = useCallback(() => {
    setLoading(true);
    fetchDriverProfiles()
      .then(async (driversList) => {
        const withVehicles = await Promise.all(
          driversList.map(async (d) => {
            try {
              const vehicles = await fetchVehiclesByDriver(d.id);
              const activeVehicle = vehicles.find((v) => v.is_active) ?? vehicles[0];
              return { ...d, vehicle: activeVehicle } as DriverWithVehicle;
            } catch {
              return { ...d } as DriverWithVehicle;
            }
          })
        );
        setDrivers(withVehicles);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  const filtered = drivers.filter((d) => {
    const name = d.provider_profiles?.users?.full_name ?? "";
    const phone = d.provider_profiles?.users?.phone ?? "";
    const q = search.toLowerCase();
    const matchSearch = name.toLowerCase().includes(q) || phone.toLowerCase().includes(q);
    const status = d.provider_profiles?.status ?? "";
    const matchStatus = statusFilter ? status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-black text-dark">Motoristas</h1>
          <p className="text-contrast text-sm mt-1">
            Gerencie os motoristas cadastrados na plataforma
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-background px-5 py-2.5 rounded-lg font-heading font-bold text-sm hover:bg-primary-dark transition-colors cursor-pointer duration-200"
        >
          + Novo Motorista
        </button>
      </div>

      {/* Search & Filters */}
      <div className="mb-5 flex items-center gap-3">
        <input
          type="text"
          placeholder="Buscar motorista..."
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
            <option value="rejected">Rejeitados</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-contrast text-sm">
          Nenhum motorista encontrado.
        </div>
      ) : (
        /* Cards grid */
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((driver) => {
            const name = driver.provider_profiles?.users?.full_name ?? "Sem nome";
            const phone = driver.provider_profiles?.users?.phone ?? "—";
            const status = driver.provider_profiles?.status ?? "pending";
            const rating = driver.provider_profiles?.average_rating ?? 0;
            const totalTrips = driver.provider_profiles?.total_ratings ?? 0;
            const vehicleLabel = driver.vehicle
              ? `${driver.vehicle.brand} ${driver.vehicle.model} ${driver.vehicle.year} • ${driver.vehicle.color}`
              : "—";

            return (
              <div
                key={driver.id}
                className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary text-sm font-semibold">
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
                      backgroundColor: `${statusColors[status]}15`,
                      color: statusColors[status],
                    }}
                  >
                    {statusLabels[status]}
                  </span>
                </div>

                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-contrast">Veículo</span>
                    <span className="text-dark font-medium text-right text-xs">{vehicleLabel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-contrast">CNH</span>
                    <span className="text-dark font-medium">
                      {driver.cnh_category ? `Cat. ${driver.cnh_category}` : "—"}
                      {driver.cnh_expiration_date ? ` • Venc. ${formatDate(driver.cnh_expiration_date)}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-contrast">Avaliação</span>
                    <span className="text-dark font-medium">
                      {rating > 0 ? `⭐ ${rating.toFixed(1)}` : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-contrast">Avaliações</span>
                    <span className="text-dark font-medium">{totalTrips}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                      driver.is_available ? "text-success" : "text-contrast/50"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        driver.is_available ? "bg-success" : "bg-contrast/30"
                      }`}
                    />
                    {driver.is_available ? "Disponível" : "Indisponível"}
                  </span>
                  <button className="text-xs text-accent hover:text-accent-dark transition-colors font-medium">
                    Ver detalhes →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <NovoMotoristaForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={loadDrivers}
      />
    </div>
  );
}
