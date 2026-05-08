import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { api, apiError, rows } from "../api/client";
import { Button } from "../components/ui/Button";
import { Field, Input, Select, Textarea } from "../components/ui/Field";
import { Panel } from "../components/ui/Panel";
import { EmptyState, LoadingState } from "../components/ui/State";
import type { Vendor } from "../types";

const blank = { name: "", vendor_type: "SUPPLIER", phone: "", email: "", address: "", tax_number: "", notes: "", is_active: true };

export function VendorsPage() {
  const qc = useQueryClient();
  const { t } = useTranslation(["vendors", "common"]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<Vendor | null>(null);
  const [error, setError] = useState("");
  const vendors = useQuery({ queryKey: ["vendors"], queryFn: async () => rows<Vendor>((await api.get("/vendors/")).data) });
  const save = useMutation({
    mutationFn: async () => editing ? api.patch(`/vendors/${editing.id}/`, form) : api.post("/vendors/", form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendors"] });
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
  function edit(vendor: Vendor) {
    setEditing(vendor);
    setForm({
      name: vendor.name,
      vendor_type: vendor.vendor_type,
      phone: vendor.phone,
      email: vendor.email,
      address: vendor.address,
      tax_number: vendor.tax_number,
      notes: vendor.notes,
      is_active: vendor.is_active
    });
  }
  return (
    <div className="grid gap-5">
      <div><h1 className="text-2xl font-bold text-ink">{t("vendors:title")}</h1><p className="text-sm text-gray-500">{t("vendors:subtitle")}</p></div>
      <Panel title={editing ? t("vendors:edit") : t("vendors:add")}>
        <form onSubmit={submit} className="grid gap-4 lg:grid-cols-4">
          <Field label={t("common:fields.name")}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label={t("common:fields.type")}><Select value={form.vendor_type} onChange={(e) => setForm({ ...form, vendor_type: e.target.value })}><option value="SUPPLIER">{t("common:vendor_types.SUPPLIER")}</option><option value="SUBCONTRACTOR">{t("common:vendor_types.SUBCONTRACTOR")}</option><option value="EQUIPMENT_PROVIDER">{t("common:vendor_types.EQUIPMENT_PROVIDER")}</option><option value="LABOUR_TEAM">{t("common:vendor_types.LABOUR_TEAM")}</option><option value="TRANSPORTATION_PROVIDER">{t("common:vendor_types.TRANSPORTATION_PROVIDER")}</option><option value="OTHER">{t("common:vendor_types.OTHER")}</option></Select></Field>
          <Field label={t("common:fields.phone")}><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label={t("common:fields.email")}><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label={t("common:fields.tax_number")}><Input value={form.tax_number} onChange={(e) => setForm({ ...form, tax_number: e.target.value })} /></Field>
          <Field label={t("common:fields.active")}><Select value={String(form.is_active)} onChange={(e) => setForm({ ...form, is_active: e.target.value === "true" })}><option value="true">{t("common:statuses.ACTIVE")}</option><option value="false">{t("common:statuses.INACTIVE")}</option></Select></Field>
          <div className="lg:col-span-2"><Field label={t("common:fields.address")}><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field></div>
          <div className="lg:col-span-4"><Field label={t("common:fields.notes")}><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field></div>
          {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 lg:col-span-4">{error}</div>}
          <div className="flex gap-2 lg:col-span-4"><Button type="submit">{editing ? t("vendors:update") : t("vendors:create")}</Button>{editing && <Button type="button" variant="secondary" onClick={() => { setEditing(null); setForm(blank); }}>{t("common:actions.cancel")}</Button>}</div>
        </form>
      </Panel>
      <Panel title={t("vendors:list")}>
        {vendors.isLoading ? <LoadingState /> : vendors.data?.length ? (
          <div className="table-scroll overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500"><tr><th className="px-4 py-3">{t("common:fields.name")}</th><th className="px-4 py-3">{t("common:fields.type")}</th><th className="px-4 py-3">{t("common:fields.phone")}</th><th className="px-4 py-3">{t("common:fields.email")}</th><th className="px-4 py-3">{t("common:fields.tax")}</th><th className="px-4 py-3">{t("common:fields.status")}</th><th className="px-4 py-3">{t("common:fields.actions")}</th></tr></thead><tbody className="divide-y divide-gray-100">{vendors.data.map((vendor) => <tr key={vendor.id}><td className="px-4 py-3 font-semibold">{vendor.name}</td><td className="px-4 py-3">{t(`common:vendor_types.${vendor.vendor_type}`, { defaultValue: vendor.vendor_type })}</td><td className="px-4 py-3">{vendor.phone}</td><td className="px-4 py-3">{vendor.email}</td><td className="px-4 py-3">{vendor.tax_number}</td><td className="px-4 py-3">{vendor.is_active ? t("common:statuses.ACTIVE") : t("common:statuses.INACTIVE")}</td><td className="px-4 py-3"><Button variant="secondary" onClick={() => edit(vendor)}>{t("common:actions.edit")}</Button></td></tr>)}</tbody></table></div>
        ) : <EmptyState />}
      </Panel>
    </div>
  );
}
