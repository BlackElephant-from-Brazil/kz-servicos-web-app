"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchUsers } from "@/lib/api";
import type { User, UserRole } from "@/types/database";
import NovoUsuarioForm from "@/components/forms/NovoUsuarioForm";

const roleLabels: Record<UserRole, string> = {
  client: "Cliente",
  provider: "Prestador",
  admin: "Admin",
};

const roleColors: Record<UserRole, string> = {
  client: "#2261FE",
  provider: "#FEBF22",
  admin: "#F8FAFC",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const loadUsers = useCallback(() => {
    setLoading(true);
    fetchUsers()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-black text-dark">Usuários</h1>
          <p className="text-contrast text-sm mt-1">
            Gerencie todos os usuários da plataforma
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-background px-5 py-2.5 rounded-lg font-heading font-bold text-sm hover:bg-primary-dark transition-colors cursor-pointer duration-200"
        >
          + Novo Usuário
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
          Nenhum usuário encontrado.
        </div>
      ) : (
        /* Table */
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
                  Tipo
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
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-surface-hover/50 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">
                          {user.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-dark">{user.full_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-contrast">{user.email}</td>
                  <td className="px-5 py-3.5 text-sm text-contrast">{user.phone ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: `${roleColors[user.role]}15`,
                        color: roleColors[user.role],
                      }}
                    >
                      {roleLabels[user.role]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        user.is_active ? "text-success" : "text-contrast/50"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          user.is_active ? "bg-success" : "bg-contrast/30"
                        }`}
                      />
                      {user.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-contrast">
                    {formatDate(user.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NovoUsuarioForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={loadUsers}
      />
    </div>
  );
}
