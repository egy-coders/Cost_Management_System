import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { api, apiError, rows } from "../api/client";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Field, Input, Select, Textarea } from "../components/ui/Field";
import { Panel } from "../components/ui/Panel";
import { EmptyState, LoadingState } from "../components/ui/State";
import { useAuth } from "../hooks/useAuth";
import type { Project } from "../types";

const blank = {
  name: "",
  code: "",
  client_name: "",
  location: "",
  currency: "SAR",
  status: "ACTIVE",
  description: ""
};

export function ProjectsPage() {
  const { can } = useAuth();
  const { t } = useTranslation(["projects", "common"]);
  const qc = useQueryClient();
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<Project | null>(null);
  const [error, setError] = useState("");

  const query = useQuery({
    queryKey: ["projects"],
    queryFn: async () => rows<Project>((await api.get("/projects/")).data)
  });

  const save = useMutation({
    mutationFn: async () => {
      if (editing) return api.patch(`/projects/${editing.id}/`, form);
      return api.post("/projects/", form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      setForm(blank);
      setEditing(null);
      setError("");
    },
    onError: (err) => setError(apiError(err))
  });

  const remove = useMutation({
    mutationFn: async (id: number) => api.delete(`/projects/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] })
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  function startEdit(project: Project) {
    setEditing(project);
    setForm({
      name: project.name,
      code: project.code,
      client_name: project.client_name,
      location: project.location,
      currency: project.currency,
      status: project.status,
      description: project.description || ""
    });
  }

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">{t("projects:title")}</h1>
        <p className="text-sm text-gray-500">{t("projects:subtitle")}</p>
      </div>
      {can("ADMIN") && (
        <Panel title={editing ? t("projects:edit") : t("projects:add")}>
          <form onSubmit={submit} className="grid gap-4 lg:grid-cols-4">
            <Field label={t("common:fields.name")}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
            <Field label={t("common:fields.code")}><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required /></Field>
            <Field label={t("common:fields.client")}><Input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} required /></Field>
            <Field label={t("common:fields.location")}><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
            <Field label={t("common:fields.currency")}><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></Field>
            <Field label={t("common:fields.status")}>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="ACTIVE">{t("common:statuses.ACTIVE")}</option>
                <option value="ON_HOLD">{t("common:statuses.ON_HOLD")}</option>
                <option value="COMPLETED">{t("common:statuses.COMPLETED")}</option>
                <option value="CANCELLED">{t("common:statuses.CANCELLED")}</option>
              </Select>
            </Field>
            <div className="lg:col-span-2">
              <Field label={t("common:fields.description")}><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            </div>
            {error && <div className="lg:col-span-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <div className="flex gap-2 lg:col-span-4">
              <Button type="submit" disabled={save.isPending}><Plus size={18} />{editing ? t("projects:update") : t("projects:create")}</Button>
              {editing && <Button type="button" variant="secondary" onClick={() => { setEditing(null); setForm(blank); }}>{t("common:actions.cancel")}</Button>}
            </div>
          </form>
        </Panel>
      )}

      <Panel title={t("projects:list")}>
        {query.isLoading ? <LoadingState /> : query.data?.length ? (
          <div className="table-scroll overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">{t("common:fields.project")}</th>
                  <th className="px-4 py-3">{t("common:fields.client")}</th>
                  <th className="px-4 py-3">{t("common:fields.location")}</th>
                  <th className="px-4 py-3">{t("common:fields.currency")}</th>
                  <th className="px-4 py-3">{t("common:fields.status")}</th>
                  <th className="px-4 py-3">{t("common:fields.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {query.data.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-ink"><Link to={`/projects/${project.id}`} className="text-site hover:underline">{project.code} - {project.name}</Link></td>
                    <td className="px-4 py-3">{project.client_name}</td>
                    <td className="px-4 py-3">{project.location}</td>
                    <td className="px-4 py-3">{project.currency}</td>
                    <td className="px-4 py-3"><Badge value={project.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {can("ADMIN") && <Button variant="secondary" onClick={() => startEdit(project)}>{t("common:actions.edit")}</Button>}
                        {can("ADMIN") && <Button variant="danger" onClick={() => confirm(t("common:confirms.delete_project")) && remove.mutate(project.id)} aria-label={t("common:actions.delete")}><Trash2 size={16} /></Button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState />}
      </Panel>
    </div>
  );
}
