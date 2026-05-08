import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api, apiError, rows } from "../api/client";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Field, Input, Select } from "../components/ui/Field";
import { Panel } from "../components/ui/Panel";
import { EmptyState, LoadingState } from "../components/ui/State";
import type { User } from "../types";

const blank = { name: "", email: "", password: "Password123!", role: "SITE_ENGINEER", is_active: true };

export function UsersPage() {
  const qc = useQueryClient();
  const { t } = useTranslation(["users", "auth", "common"]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<User | null>(null);
  const [error, setError] = useState("");
  const users = useQuery({ queryKey: ["users"], queryFn: async () => rows<User>((await api.get("/users/")).data) });
  const save = useMutation({
    mutationFn: async () => editing ? api.patch(`/users/${editing.id}/`, { ...form, password: form.password || undefined }) : api.post("/users/", form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      setForm(blank);
      setEditing(null);
      setError("");
    },
    onError: (err) => setError(apiError(err))
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }
  function edit(user: User) {
    setEditing(user);
    setForm({ name: user.name, email: user.email, password: "", role: user.role, is_active: user.is_active });
  }
  return (
    <div className="grid gap-5">
      <div><h1 className="text-2xl font-bold text-ink">{t("users:title")}</h1><p className="text-sm text-gray-500">{t("users:subtitle")}</p></div>
      <Panel title={editing ? t("users:edit") : t("users:create")}>
        <form onSubmit={submit} className="grid gap-4 lg:grid-cols-5">
          <Field label={t("common:fields.name")}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label={t("common:fields.email")}><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
          <Field label={t("common:fields.password")}><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={editing ? t("auth:password_placeholder_keep") : ""} /></Field>
          <Field label={t("common:fields.role")}><Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="ADMIN">{t("common:roles.ADMIN")}</option><option value="SITE_ENGINEER">{t("common:roles.SITE_ENGINEER")}</option><option value="PROJECT_MANAGER">{t("common:roles.PROJECT_MANAGER")}</option><option value="ACCOUNTANT">{t("common:roles.ACCOUNTANT")}</option><option value="MANAGEMENT_VIEWER">{t("common:roles.MANAGEMENT_VIEWER")}</option></Select></Field>
          <Field label={t("common:fields.active")}><Select value={String(form.is_active)} onChange={(e) => setForm({ ...form, is_active: e.target.value === "true" })}><option value="true">{t("common:statuses.ACTIVE")}</option><option value="false">{t("common:statuses.INACTIVE")}</option></Select></Field>
          {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 lg:col-span-5">{error}</div>}
          <div className="flex gap-2 lg:col-span-5"><Button type="submit">{editing ? t("users:update") : t("users:create")}</Button>{editing && <Button type="button" variant="secondary" onClick={() => { setEditing(null); setForm(blank); }}>{t("common:actions.cancel")}</Button>}</div>
        </form>
      </Panel>
      <Panel title={t("users:list")}>
        {users.isLoading ? <LoadingState /> : users.data?.length ? (
          <div className="table-scroll overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500"><tr><th className="px-4 py-3">{t("common:fields.name")}</th><th className="px-4 py-3">{t("common:fields.email")}</th><th className="px-4 py-3">{t("common:fields.role")}</th><th className="px-4 py-3">{t("common:fields.status")}</th><th className="px-4 py-3">{t("common:fields.actions")}</th></tr></thead><tbody className="divide-y divide-gray-100">{users.data.map((user) => <tr key={user.id}><td className="px-4 py-3 font-semibold">{user.name}</td><td className="px-4 py-3">{user.email}</td><td className="px-4 py-3"><Badge value={user.role} /></td><td className="px-4 py-3">{user.is_active ? t("common:statuses.ACTIVE") : t("common:statuses.INACTIVE")}</td><td className="px-4 py-3"><Button variant="secondary" onClick={() => edit(user)}>{t("common:actions.edit")}</Button></td></tr>)}</tbody></table></div>
        ) : <EmptyState />}
      </Panel>
    </div>
  );
}
