"use client";

import { useState, useEffect, type FormEvent } from "react";
import SlidePanel from "@/components/SlidePanel";
import { useToast } from "@/components/Toast";
import {
  createTrip,
  createAddress,
  fetchUsers,
  fetchServiceCategories,
} from "@/lib/api";
import type { User, ServiceCategory, PaymentMethod } from "@/types/database";

interface NovaViagemFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const paymentOptions: { value: PaymentMethod; label: string }[] = [
  { value: "pix", label: "PIX" },
  { value: "debit", label: "Débito" },
  { value: "credit", label: "Crédito" },
  { value: "cash", label: "Dinheiro" },
  { value: "billing", label: "Faturamento" },
];

const inputClass =
  "w-full rounded-lg bg-background border border-border text-dark placeholder:text-contrast/40 focus:ring-primary focus:ring-1 focus:outline-none px-3 py-2 text-sm font-body";
const labelClass = "block text-sm font-body text-contrast mb-1";

export default function NovaViagemForm({
  open,
  onClose,
  onSuccess,
}: NovaViagemFormProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [clients, setClients] = useState<User[]>([]);
  const [tripCategoryId, setTripCategoryId] = useState<string>("");

  const [clientId, setClientId] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [scheduledDatetime, setScheduledDatetime] = useState("");
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [returnDatetime, setReturnDatetime] = useState("");
  const [passengerCount, setPassengerCount] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [luggageCount, setLuggageCount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [observations, setObservations] = useState("");

  useEffect(() => {
    if (!open) return;
    fetchUsers()
      .then((users) => setClients(users.filter((u) => u.role === "client")))
      .catch(() => toast("danger", "Erro ao carregar clientes"));
    fetchServiceCategories()
      .then((cats: ServiceCategory[]) => {
        const tripCat = cats.find((c) => c.service_type === "trip");
        if (tripCat) setTripCategoryId(tripCat.id);
      })
      .catch(() => {});
  }, [open, toast]);

  function resetForm() {
    setClientId("");
    setPickupAddress("");
    setDropoffAddress("");
    setScheduledDatetime("");
    setIsRoundTrip(false);
    setReturnDatetime("");
    setPassengerCount(1);
    setChildrenCount(0);
    setLuggageCount(0);
    setPaymentMethod("");
    setObservations("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!clientId || !pickupAddress || !dropoffAddress || !scheduledDatetime) {
      toast("warning", "Preencha todos os campos obrigatórios");
      return;
    }
    if (isRoundTrip && !returnDatetime) {
      toast("warning", "Informe a data/hora de retorno");
      return;
    }

    setSubmitting(true);
    try {
      const [pickup, dropoff] = await Promise.all([
        createAddress({ formatted_address: pickupAddress }),
        createAddress({ formatted_address: dropoffAddress }),
      ]);

      await createTrip({
        client_id: clientId,
        service_category_id: tripCategoryId,
        pickup_address_id: pickup.id,
        dropoff_address_id: dropoff.id,
        scheduled_datetime: new Date(scheduledDatetime).toISOString(),
        is_round_trip: isRoundTrip,
        return_datetime: isRoundTrip
          ? new Date(returnDatetime).toISOString()
          : null,
        passenger_count: passengerCount,
        children_count: childrenCount,
        luggage_count: luggageCount,
        observations: observations || null,
        payment_method: paymentMethod || null,
      });

      toast("success", "Viagem criada com sucesso!");
      resetForm();
      onSuccess();
      onClose();
    } catch {
      toast("danger", "Erro ao criar viagem. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SlidePanel
      open={open}
      onClose={onClose}
      title="Nova Viagem"
      footer={
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-body text-contrast hover:text-dark transition-colors duration-200 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="nova-viagem-form"
            disabled={submitting}
            className="px-5 py-2 rounded-lg bg-primary text-background font-heading font-bold text-sm hover:bg-primary-dark transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Criando..." : "Criar Viagem"}
          </button>
        </div>
      }
    >
      <form
        id="nova-viagem-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 p-6 overflow-y-auto flex-1"
      >
        {/* Cliente */}
        <div>
          <label htmlFor="client" className={labelClass}>
            Cliente *
          </label>
          <select
            id="client"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className={inputClass}
          >
            <option value="">Selecione um cliente</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </select>
        </div>

        {/* Endereço de embarque */}
        <div>
          <label htmlFor="pickup" className={labelClass}>
            Endereço de embarque *
          </label>
          <input
            id="pickup"
            type="text"
            value={pickupAddress}
            onChange={(e) => setPickupAddress(e.target.value)}
            placeholder="Ex: Rua das Flores, 123 - Centro"
            className={inputClass}
          />
        </div>

        {/* Endereço de desembarque */}
        <div>
          <label htmlFor="dropoff" className={labelClass}>
            Endereço de desembarque *
          </label>
          <input
            id="dropoff"
            type="text"
            value={dropoffAddress}
            onChange={(e) => setDropoffAddress(e.target.value)}
            placeholder="Ex: Aeroporto Internacional"
            className={inputClass}
          />
        </div>

        {/* Data/hora */}
        <div>
          <label htmlFor="datetime" className={labelClass}>
            Data/hora *
          </label>
          <input
            id="datetime"
            type="datetime-local"
            value={scheduledDatetime}
            onChange={(e) => setScheduledDatetime(e.target.value)}
            className={inputClass}
          />
        </div>

        {/* Ida e volta */}
        <div className="flex items-center gap-2">
          <input
            id="roundtrip"
            type="checkbox"
            checked={isRoundTrip}
            onChange={(e) => setIsRoundTrip(e.target.checked)}
            className="rounded border-border bg-background text-primary focus:ring-primary cursor-pointer"
          />
          <label htmlFor="roundtrip" className="text-sm font-body text-dark cursor-pointer">
            Ida e volta
          </label>
        </div>

        {/* Data/hora retorno */}
        {isRoundTrip && (
          <div>
            <label htmlFor="return-datetime" className={labelClass}>
              Data/hora retorno *
            </label>
            <input
              id="return-datetime"
              type="datetime-local"
              value={returnDatetime}
              onChange={(e) => setReturnDatetime(e.target.value)}
              className={inputClass}
            />
          </div>
        )}

        {/* Nº de passageiros / crianças / malas */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label htmlFor="passengers" className={labelClass}>
              Nº de passageiros
            </label>
            <input
              id="passengers"
              type="number"
              min={1}
              value={passengerCount}
              onChange={(e) => setPassengerCount(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="children" className={labelClass}>
              Nº de crianças
            </label>
            <input
              id="children"
              type="number"
              min={0}
              value={childrenCount}
              onChange={(e) => setChildrenCount(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="luggage" className={labelClass}>
              Nº de malas
            </label>
            <input
              id="luggage"
              type="number"
              min={0}
              value={luggageCount}
              onChange={(e) => setLuggageCount(Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>

        {/* Forma de pagamento */}
        <div>
          <label htmlFor="payment" className={labelClass}>
            Forma de pagamento
          </label>
          <select
            id="payment"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod | "")}
            className={inputClass}
          >
            <option value="">Selecione</option>
            {paymentOptions.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Observações */}
        <div>
          <label htmlFor="observations" className={labelClass}>
            Observações
          </label>
          <textarea
            id="observations"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            rows={3}
            placeholder="Informações adicionais sobre a viagem"
            className={inputClass + " resize-none"}
          />
        </div>
      </form>
    </SlidePanel>
  );
}
