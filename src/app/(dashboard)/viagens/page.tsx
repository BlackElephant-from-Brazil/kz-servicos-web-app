"use client";

import { useEffect, useState, useCallback } from "react";
import KanbanBoard from "@/components/KanbanBoard";
import TripDetailModal from "@/components/TripDetailModal";
import NovaViagemForm from "@/components/forms/NovaViagemForm";
import { useToast } from "@/components/Toast";
import { fetchTrips, updateTripStatus } from "@/lib/api";
import type { Trip, TripStatus } from "@/types/database";

const tripColumnConfig: { id: TripStatus; title: string; color: string }[] = [
  { id: "open", title: "Aberta", color: "#FEBF22" },
  { id: "under_review", title: "Em Análise", color: "#5C5956" },
  { id: "searching_drivers", title: "Buscando Motorista", color: "#2261FE" },
  { id: "scheduled", title: "Agendada", color: "#2261FE" },
  { id: "started", title: "Em Andamento", color: "#22c55e" },
  { id: "finished", title: "Finalizada", color: "#22c55e" },
  { id: "cancelled", title: "Cancelada", color: "#ef4444" },
];

function shortenAddress(addr: string | undefined | null) {
  if (!addr) return "—";
  const parts = addr.split(",");
  return parts[0]?.trim() ?? addr;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ViagensPage() {
  const { toast } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const loadTrips = useCallback(() => {
    setLoading(true);
    fetchTrips()
      .then(setTrips)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const handleCardMove = useCallback(
    async (cardId: string, _fromColumnId: string, toColumnId: string) => {
      const newStatus = toColumnId as TripStatus;
      // Optimistic update
      setTrips((prev) =>
        prev.map((t) => (t.id === cardId ? { ...t, status: newStatus } : t))
      );
      try {
        await updateTripStatus(cardId, newStatus);
        toast("success", "Status da viagem atualizado");
      } catch {
        toast("danger", "Erro ao atualizar status");
        loadTrips(); // Rollback
      }
    },
    [toast, loadTrips]
  );

  const handleCardClick = useCallback(
    (cardId: string) => {
      const trip = trips.find((t) => t.id === cardId);
      if (trip) setSelectedTrip(trip);
    },
    [trips]
  );

  const columns = tripColumnConfig.map((col) => {
    const colTrips = trips.filter((t) => t.status === col.id);
    return {
      ...col,
      cards: colTrips.map((t) => ({
        id: t.id,
        title: `${shortenAddress(t.pickup_address?.formatted_address)} → ${shortenAddress(t.dropoff_address?.formatted_address)}`,
        subtitle: `${t.users?.full_name ?? "—"} • ${t.passenger_count} passageiro${t.passenger_count !== 1 ? "s" : ""}`,
        date: formatDate(t.scheduled_datetime),
        ...(t.is_round_trip ? { tag: "Ida e volta", tagColor: "#2261FE" } : {}),
        ...(t.is_paid ? { tag: "Pago", tagColor: "#22c55e" } : {}),
      })),
    };
  });

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-black text-dark">Viagens</h1>
          <p className="text-contrast text-sm mt-1">
            Gerencie todas as viagens da plataforma
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-background px-5 py-2.5 rounded-lg font-heading font-bold text-sm hover:bg-primary-dark transition-colors duration-200 cursor-pointer"
        >
          + Nova Viagem
        </button>
      </div>

      {/* Kanban */}
      {loading ? (
        <div className="text-center py-16 text-contrast text-sm">Carregando viagens...</div>
      ) : (
        <KanbanBoard
          columns={columns}
          onCardMove={handleCardMove}
          onCardClick={handleCardClick}
        />
      )}

      <NovaViagemForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={loadTrips}
      />

      <TripDetailModal
        trip={selectedTrip}
        open={!!selectedTrip}
        onClose={() => setSelectedTrip(null)}
        onUpdate={loadTrips}
      />
    </div>
  );
}
