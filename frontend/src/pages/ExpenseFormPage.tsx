import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api, apiError, formatMoney, rows } from "../api/client";
import { Button } from "../components/ui/Button";
import { Field, Input, Select, Textarea } from "../components/ui/Field";
import { Panel } from "../components/ui/Panel";
import { LoadingState } from "../components/ui/State";
import type { Category, Expense, Project, Vendor } from "../types";

const units = ["Hr", "Day", "Month", "Piece", "KG", "Ton", "Liter", "Trip", "Lump Sum", "Other"];

const blank = {
  project: "",
  category: "",
  vendor: "",
  description: "",
  expense_date: new Date().toISOString().slice(0, 10),
  quantity: "1",
  unit: "Other",
  unit_rate: "0",
  vat_percentage: "15",
  notes: ""
};

export function ExpenseFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(["expenses", "common"]);
  const [form, setForm] = useState(blank);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const expense = useQuery({
    queryKey: ["expense", id],
    enabled: Boolean(id),
    queryFn: async () => (await api.get<Expense>(`/expenses/${id}/`)).data
  });
  const projects = useQuery({ queryKey: ["projects"], queryFn: async () => rows<Project>((await api.get("/projects/")).data) });
  const categories = useQuery({ queryKey: ["categories"], queryFn: async () => rows<Category>((await api.get("/categories/?is_active=true")).data) });
  const vendors = useQuery({ queryKey: ["vendors"], queryFn: async () => rows<Vendor>((await api.get("/vendors/?is_active=true")).data) });

  useEffect(() => {
    if (expense.data) {
      setForm({
        project: String(expense.data.project),
        category: String(expense.data.category),
        vendor: expense.data.vendor ? String(expense.data.vendor) : "",
        description: expense.data.description,
        expense_date: expense.data.expense_date,
        quantity: expense.data.quantity,
        unit: expense.data.unit,
        unit_rate: expense.data.unit_rate,
        vat_percentage: expense.data.vat_percentage,
        notes: expense.data.notes || ""
      });
    }
  }, [expense.data]);

  const preview = useMemo(() => {
    const quantity = Number(form.quantity || 0);
    const unitRate = Number(form.unit_rate || 0);
    const vat = Number(form.vat_percentage || 0);
    const beforeVat = quantity * unitRate;
    const vatAmount = beforeVat * vat / 100;
    return { beforeVat, vatAmount, total: beforeVat + vatAmount };
  }, [form.quantity, form.unit_rate, form.vat_percentage]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        project: Number(form.project),
        category: Number(form.category),
        vendor: form.vendor ? Number(form.vendor) : null
      };
      const response = id ? await api.patch(`/expenses/${id}/`, payload) : await api.post("/expenses/", payload);
      if (file) {
        const data = new FormData();
        data.append("file", file);
        data.append("related_type", "EXPENSE");
        data.append("related_id", String(response.data.id));
        await api.post("/attachments/", data);
      }
      return response.data;
    },
    onSuccess: (saved) => navigate(`/expenses/${saved.id}`),
    onError: (err) => setError(apiError(err))
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  if (id && expense.isLoading) return <LoadingState />;

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">{id ? t("expenses:edit") : t("expenses:add")}</h1>
        <p className="text-sm text-gray-500">{t("expenses:backend_recalculates")}</p>
      </div>
      <Panel>
        <form onSubmit={submit} className="grid gap-4 lg:grid-cols-3">
          <Field label={t("common:fields.project")}>
            <Select value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} required>
              <option value="">{t("expenses:select_project")}</option>
              {(projects.data || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
          </Field>
          <Field label={t("common:fields.category")}>
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
              <option value="">{t("expenses:select_category")}</option>
              {(categories.data || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
          </Field>
          <Field label={t("common:fields.vendor")}>
            <Select value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })}>
              <option value="">{t("common:messages.no_vendor")}</option>
              {(vendors.data || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </Select>
          </Field>
          <div className="lg:col-span-2">
            <Field label={t("common:fields.description")}><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></Field>
          </div>
          <Field label={t("common:fields.expense_date")}><Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} required /></Field>
          <Field label={t("common:fields.quantity")}><Input type="number" min="0.01" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required /></Field>
          <Field label={t("common:fields.unit")}>
            <Select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              {units.map((unit) => <option key={unit} value={unit}>{t(`common:units.${unit}`, { defaultValue: unit })}</option>)}
            </Select>
          </Field>
          <Field label={t("common:fields.unit_rate")}><Input type="number" min="0" step="0.01" value={form.unit_rate} onChange={(e) => setForm({ ...form, unit_rate: e.target.value })} required /></Field>
          <Field label={t("common:fields.vat_percentage")}><Input type="number" min="0" max="100" step="0.01" value={form.vat_percentage} onChange={(e) => setForm({ ...form, vat_percentage: e.target.value })} /></Field>
          <Field label={t("common:fields.attachment")}><Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} /></Field>
          <div className="lg:col-span-3">
            <Field label={t("common:fields.notes")}><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
          </div>
          <div className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-3 lg:col-span-3">
            <div><p className="text-xs font-semibold uppercase text-gray-500">{t("common:fields.before_vat")}</p><p className="font-bold">{formatMoney(preview.beforeVat)}</p></div>
            <div><p className="text-xs font-semibold uppercase text-gray-500">{t("common:fields.vat_amount")}</p><p className="font-bold">{formatMoney(preview.vatAmount)}</p></div>
            <div><p className="text-xs font-semibold uppercase text-gray-500">{t("common:fields.total")}</p><p className="font-bold">{formatMoney(preview.total)}</p></div>
          </div>
          {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 lg:col-span-3">{error}</div>}
          <div className="flex gap-2 lg:col-span-3">
            <Button type="submit" disabled={save.isPending}>{save.isPending ? t("common:states.saving") : t("expenses:save")}</Button>
            <Button type="button" variant="secondary" onClick={() => navigate("/expenses")}>{t("common:actions.cancel")}</Button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
