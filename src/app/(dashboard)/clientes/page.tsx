"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchClients } from "@/lib/api";
import type { User } from "@/types/database";
import NovoClienteForm from "@/components/forms/NovoClienteForm";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function ClientesPage() {
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loadClients = useCallback(() => {
    setLoading(true);
    fetchClients()
      .then(setClients)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.full_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-black text-dark">
            Clientes
          </h1>
          <p className="text-contrast text-sm mt-1">
            Gerencie os clientes da plataforma
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-background px-5 py-2.5 rounded-lg font-heading font-bold text-sm hover:bg-primary-dark transition-colors cursor-pointer duration-200"
        >
          + Novo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Buscar por nome, e-mail ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 rounded-lg border border-border bg-background text-dark placeholder:text-contrast/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-contrast text-sm">
          Nenhum cliente encontrado.
        </div>
      ) : (
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-contrast uppercase tracking-wider">
                  Nome
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-contrast uppercase tracking-wider">
                  E-mail
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-contrast uppercase tracking-wider">
                  Telefone
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-contrast uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-contrast uppercase tracking-wider">
                  Cadastro
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-surface-hover/50 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">
                          {client.full_name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-dark">
                        {client.full_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-contrast">
                    {client.email}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-contrast">
                    {client.phone ?? "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        client.is_active
                          ? "text-success"
                          : "text-contrast/50"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          client.is_active
                            ? "bg-success"
                            : "bg-contrast/30"
                        }`}
                      />
                      {client.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-contrast">
                    {formatDate(client.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NovoClienteForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={loadClients}
      />
    </div>
  );
}
