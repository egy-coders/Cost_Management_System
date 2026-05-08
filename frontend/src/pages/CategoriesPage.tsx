import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api, apiError, rows } from "../api/client";
import { Button } from "../components/ui/Button";
import { Field, Input, Select, Textarea } from "../components/ui/Field";
import { Panel } from "../components/ui/Panel";
import { EmptyState, LoadingState } from "../components/ui/State";
import type { Category } from "../types";

const blank = { name: "", code: "", description: "", is_active: true };

export function CategoriesPage() {
  const qc = useQueryClient();
  const { t } = useTranslation(["categories", "common"]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<Category | null>(null);
  const [error, setError] = useState("");
  const categories = useQuery({ queryKey: ["categories"], queryFn: async () => rows<Category>((await api.get("/categories/")).data) });
  const save = useMutation({
    mutationFn: async () => editing ? api.patch(`/categories/${editing.id}/`, form) : api.post("/categories/", form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
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
  return (
    <div className="grid gap-5">
      <div><h1 className="text-2xl font-bold text-ink">{t("categories:title")}</h1><p className="text-sm text-gray-500">{t("categories:subtitle")}</p></div>
      <Panel title={editing ? t("categories:edit") : t("categories:add")}>
        <form onSubmit={submit} className="grid gap-4 lg:grid-cols-4">
          <Field label={t("common:fields.name")}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label={t("common:fields.code")}><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></Field>
          <Field label={t("common:fields.active")}><Select value={String(form.is_active)} onChange={(e) => setForm({ ...form, is_active: e.target.value === "true" })}><option value="true">{t("common:statuses.ACTIVE")}</option><option value="false">{t("common:statuses.INACTIVE")}</option></Select></Field>
          <div className="lg:col-span-4"><Field label={t("common:fields.description")}><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field></div>
          {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 lg:col-span-4">{error}</div>}
          <div className="flex gap-2 lg:col-span-4"><Button type="submit">{editing ? t("categories:update") : t("categories:create")}</Button>{editing && <Button type="button" variant="secondary" onClick={() => { setEditing(null); setForm(blank); }}>{t("common:actions.cancel")}</Button>}</div>
        </form>
      </Panel>
      <Panel title={t("categories:list")}>
        {categories.isLoading ? <LoadingState /> : categories.data?.length ? (
          <table className="min-w-full text-sm"><thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500"><tr><th className="px-4 py-3">{t("common:fields.name")}</th><th className="px-4 py-3">{t("common:fields.code")}</th><th className="px-4 py-3">{t("common:fields.description")}</th><th className="px-4 py-3">{t("common:fields.status")}</th><th className="px-4 py-3">{t("common:fields.actions")}</th></tr></thead><tbody className="divide-y divide-gray-100">{categories.data.map((item) => <tr key={item.id}><td className="px-4 py-3 font-semibold">{item.name}</td><td className="px-4 py-3">{item.code}</td><td className="px-4 py-3">{item.description}</td><td className="px-4 py-3">{item.is_active ? t("common:statuses.ACTIVE") : t("common:statuses.INACTIVE")}</td><td className="px-4 py-3"><Button variant="secondary" onClick={() => { setEditing(item); setForm({ name: item.name, code: item.code, description: item.description, is_active: item.is_active }); }}>{t("common:actions.edit")}</Button></td></tr>)}</tbody></table>
        ) : <EmptyState />}
      </Panel>
    </div>
  );
}
