"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchDashboardStats } from "@/lib/api";
import type { TripStatus, ServiceRequestStatus } from "@/types/database";

const tripStatusLabels: Record<TripStatus, string> = {
  open: "Aberta",
  under_review: "Em análise",
  review_rejected: "Rejeitada",
  searching_drivers: "Buscando motorista",
  awaiting_client_confirmation: "Aguard. cliente",
  awaiting_driver_confirmation: "Aguard. motorista",
  scheduled: "Agendada",
  started: "Em andamento",
  finished: "Finalizada",
  cancelled: "Cancelada",
};

const serviceStatusLabels: Record<ServiceRequestStatus, string> = {
  open: "Aberto",
  under_review: "Em análise",
  review_rejected: "Rejeitado",
  searching_provider: "Buscando prestador",
  assigned: "Atribuído",
  in_progress: "Em andamento",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

const statusColors: Record<string, string> = {
  open: "#FEBF22",
  under_review: "#5C5956",
  review_rejected: "#ef4444",
  searching_drivers: "#2261FE",
  searching_provider: "#2261FE",
  awaiting_client_confirmation: "#f59e0b",
  awaiting_driver_confirmation: "#f59e0b",
  scheduled: "#2261FE",
  assigned: "#2261FE",
  started: "#22c55e",
  in_progress: "#22c55e",
  finished: "#22c55e",
  cancelled: "#ef4444",
};

interface DashboardData {
  totalTrips: number;
  totalServices: number;
  totalDrivers: number;
  totalProviders: number;
  recentTrips: Array<{
    id: string;
    status: TripStatus;
    scheduled_datetime: string;
    users?: { full_name: string } | null;
    pickup_address?: { formatted_address: string } | null;
    dropoff_address?: { formatted_address: string } | null;
  }>;
  recentServices: Array<{
    id: string;
    status: ServiceRequestStatus;
    service_date: string;
    description: string;
    users?: { full_name: string } | null;
    service_categories?: { name: string } | null;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats()
      .then((d) => setData(d as unknown as DashboardData))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    {
      label: "Total de Viagens",
      value: data?.totalTrips ?? 0,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      ),
    },
    {
      label: "Total de Serviços",
      value: data?.totalServices ?? 0,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      ),
    },
    {
      label: "Motoristas",
      value: data?.totalDrivers ?? 0,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
        </svg>
      ),
    },
    {
      label: "Prestadores",
      value: data?.totalProviders ?? 0,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <polyline points="16 11 18 13 22 9" />
        </svg>
      ),
    },
  ];

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function shortenAddress(addr: string | undefined | null) {
    if (!addr) return "—";
    const parts = addr.split(",");
    return parts[0]?.trim() ?? addr;
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-xl md:text-3xl font-heading font-black text-dark">Dashboard</h1>
        <p className="text-contrast text-sm mt-1">Visão geral da plataforma</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-surface rounded-xl border border-border p-5 hover:shadow-md transition-shadow duration-200 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                {stat.icon}
              </div>
            </div>
            <p className="text-2xl font-heading font-black text-dark">
              {loading ? "—" : stat.value}
            </p>
            <p className="text-sm text-contrast mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tables */}
      <div className="flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-6">
        {/* Recent trips */}
        <div className="bg-surface rounded-xl border border-border overflow-x-auto">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-heading font-bold text-dark">Viagens Recentes</h2>
            <Link href="/viagens" className="text-xs text-accent hover:text-accent-dark transition-colors">
              Ver todas →
            </Link>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              <div className="px-5 py-8 text-center text-contrast text-sm">Carregando...</div>
            ) : (data?.recentTrips ?? []).length === 0 ? (
              <div className="px-5 py-8 text-center text-contrast/50 text-sm">Nenhuma viagem encontrada</div>
            ) : (
              (data?.recentTrips ?? []).map((trip) => {
                const color = statusColors[trip.status] ?? "#5C5956";
                return (
                  <div key={trip.id} className="px-5 py-3.5 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-contrast font-mono">{trip.id.slice(0, 8)}</span>
                        <span className="text-sm font-medium text-dark">
                          {trip.users?.full_name ?? "—"}
                        </span>
                      </div>
                      <p className="text-xs text-contrast mt-0.5">
                        {shortenAddress(trip.pickup_address?.formatted_address)} → {shortenAddress(trip.dropoff_address?.formatted_address)}
                      </p>
                    </div>
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
                      style={{ backgroundColor: `${color}15`, color }}
                    >
                      {tripStatusLabels[trip.status]}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent services */}
        <div className="bg-surface rounded-xl border border-border overflow-x-auto">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-heading font-bold text-dark">Serviços Recentes</h2>
            <Link href="/outros-servicos" className="text-xs text-accent hover:text-accent-dark transition-colors">
              Ver todos →
            </Link>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              <div className="px-5 py-8 text-center text-contrast text-sm">Carregando...</div>
            ) : (data?.recentServices ?? []).length === 0 ? (
              <div className="px-5 py-8 text-center text-contrast/50 text-sm">Nenhum serviço encontrado</div>
            ) : (
              (data?.recentServices ?? []).map((service) => {
                const color = statusColors[service.status] ?? "#5C5956";
                return (
                  <div key={service.id} className="px-5 py-3.5 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-contrast font-mono">{service.id.slice(0, 8)}</span>
                        <span className="text-sm font-medium text-dark">
                          {service.users?.full_name ?? "—"}
                        </span>
                      </div>
                      <p className="text-xs text-contrast mt-0.5">
                        {service.service_categories?.name ?? service.description}
                      </p>
                    </div>
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
                      style={{ backgroundColor: `${color}15`, color }}
                    >
                      {serviceStatusLabels[service.status]}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
