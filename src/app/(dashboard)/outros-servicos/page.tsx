"use client";

import { useEffect, useState, useCallback } from "react";
import KanbanBoard from "@/components/KanbanBoard";
import NovaSolicitacaoForm from "@/components/forms/NovaSolicitacaoForm";
import { fetchServiceRequests } from "@/lib/api";
import type { ServiceRequest, ServiceRequestStatus } from "@/types/database";

const serviceColumnConfig: {
  id: ServiceRequestStatus;
  title: string;
  color: string;
}[] = [
  { id: "open", title: "Aberto", color: "#FEBF22" },
  { id: "under_review", title: "Em Análise", color: "#5C5956" },
  { id: "searching_provider", title: "Buscando Prestador", color: "#2261FE" },
  { id: "assigned", title: "Atribuído", color: "#2261FE" },
  { id: "in_progress", title: "Em Andamento", color: "#22c55e" },
  { id: "finished", title: "Finalizado", color: "#22c55e" },
  { id: "cancelled", title: "Cancelado", color: "#ef4444" },
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

export default function OutrosServicosPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const loadRequests = useCallback(() => {
    setLoading(true);
    fetchServiceRequests()
      .then(setRequests)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const columns = serviceColumnConfig.map((col) => {
    const colRequests = requests.filter((r) => r.status === col.id);
    return {
      ...col,
      cards: colRequests.map((r) => ({
        id: r.id,
        title: r.description.length > 50 ? r.description.slice(0, 50) + "…" : r.description,
        subtitle: r.users?.full_name ?? "—",
        date: formatDate(r.service_date),
        ...(r.service_categories
          ? { tag: r.service_categories.name, tagColor: "#2261FE" }
          : {}),
        ...(r.is_paid ? { tag: "Pago", tagColor: "#22c55e" } : {}),
      })),
    };
  });

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-black text-dark">
            Outros Serviços
          </h1>
          <p className="text-contrast text-sm mt-1">
            Gerencie as solicitações de serviços gerais
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-background px-5 py-2.5 rounded-lg font-heading font-bold text-sm hover:bg-primary-dark transition-colors duration-200 cursor-pointer"
        >
          + Nova Solicitação
        </button>
      </div>

      {/* Kanban */}
      {loading ? (
        <div className="text-center py-16 text-contrast text-sm">Carregando serviços...</div>
      ) : (
        <KanbanBoard columns={columns} />
      )}

      <NovaSolicitacaoForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={loadRequests}
      />
    </div>
  );
}
