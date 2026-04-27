"use client";

import Modal from "@/components/Modal";
import type { ServiceRequest } from "@/types/database";

interface ServiceDetailModalProps {
  request: ServiceRequest | null;
  open: boolean;
  onClose: () => void;
}

const statusLabels: Record<string, string> = {
  open: "Aberto",
  under_review: "Em Análise",
  review_rejected: "Rejeitado na Análise",
  searching_provider: "Buscando Prestador",
  assigned: "Atribuído",
  in_progress: "Em Andamento",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

const paymentLabels: Record<string, string> = {
  pix: "PIX",
  debit: "Débito",
  credit: "Crédito",
  cash: "Dinheiro",
  billing: "Faturamento",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function DetailRow({ label, value }: { label: string; value: string | React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-contrast font-body shrink-0">{label}</span>
      <span className="text-sm text-dark font-body text-right ml-4">{value}</span>
    </div>
  );
}

export default function ServiceDetailModal({
  request,
  open,
  onClose,
}: ServiceDetailModalProps) {
  if (!request) return null;

  return (
    <Modal open={open} onClose={onClose} title="Detalhes do Serviço">
      <div className="flex flex-col gap-1">
        {/* Status */}
        <DetailRow
          label="Status"
          value={
            <span
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{
                backgroundColor: request.status === "cancelled" ? "#ef444420" : "#FEBF2220",
                color: request.status === "cancelled" ? "#ef4444" : "#FEBF22",
              }}
            >
              {statusLabels[request.status] || request.status}
            </span>
          }
        />

        {/* Cliente */}
        <DetailRow label="Cliente" value={request.users?.full_name ?? "—"} />

        {/* Categoria */}
        <DetailRow
          label="Categoria"
          value={request.service_categories?.name ?? "—"}
        />

        {/* Descrição */}
        <DetailRow label="Descrição" value={request.description} />

        {/* Data */}
        <DetailRow label="Data do serviço" value={formatDate(request.service_date)} />

        {/* Endereço */}
        {request.addresses && (
          <DetailRow
            label="Endereço"
            value={request.addresses.formatted_address}
          />
        )}

        {/* Pagamento */}
        <DetailRow
          label="Pagamento"
          value={
            request.payment_method
              ? paymentLabels[request.payment_method] ?? request.payment_method
              : "—"
          }
        />
        <DetailRow label="Valor estimado" value={formatCurrency(request.estimated_price)} />
        <DetailRow label="Valor final" value={formatCurrency(request.final_price)} />
        <DetailRow
          label="Pago"
          value={
            request.is_paid ? (
              <span className="text-accent font-medium">Sim</span>
            ) : (
              <span className="text-danger font-medium">Não</span>
            )
          }
        />

        {/* Prestador */}
        {request.provider_profiles?.users && (
          <DetailRow
            label="Prestador"
            value={request.provider_profiles.users.full_name}
          />
        )}

        {/* Observações */}
        {request.observations && (
          <div className="mt-3 p-3 rounded-lg bg-background border border-border">
            <p className="text-xs text-contrast mb-1 font-medium">Observações</p>
            <p className="text-sm text-dark">{request.observations}</p>
          </div>
        )}

        {/* Observações do prestador */}
        {request.provider_observations && (
          <div className="mt-2 p-3 rounded-lg bg-background border border-border">
            <p className="text-xs text-contrast mb-1 font-medium">Observações do prestador</p>
            <p className="text-sm text-dark">{request.provider_observations}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
