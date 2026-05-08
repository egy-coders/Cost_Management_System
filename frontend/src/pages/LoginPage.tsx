import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiError } from "../api/client";
import { BrandLogo } from "../components/branding/BrandLogo";
import { LanguageSwitcher } from "../components/layout/LanguageSwitcher";
import { Button } from "../components/ui/Button";
import { Field, Input } from "../components/ui/Field";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const { login, user } = useAuth();
  const { t } = useTranslation(["auth", "common"]);
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f4f5f7] px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(163,15,23,0.14),transparent_32%),linear-gradient(135deg,#f8fafc_0%,#eef2f7_48%,#e5e7eb_100%)]" />
      <div className="absolute inset-y-0 end-0 hidden w-1/2 opacity-[0.08] lg:block">
        <img src="/brand/rak-logo.png" alt="" className="h-full w-full object-contain object-right" aria-hidden="true" />
      </div>
      <form onSubmit={submit} className="relative w-full max-w-md rounded-lg border border-white/80 bg-white/95 p-8 shadow-xl shadow-slate-900/10 backdrop-blur">
        <div className="mb-6 flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="mb-8 grid justify-items-center gap-3 text-center">
          <BrandLogo
            className="justify-center"
            imageClassName="h-20 w-20"
            textClassName="text-center [&_div:first-child]:text-base [&_div:last-child]:text-sm"
          />
          <div>
            <h1 className="text-xl font-bold text-ink">{t("common:app.full_name")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("auth:login_subtitle")}</p>
          </div>
        </div>
        <div className="grid gap-4">
          <Field label={t("common:fields.email")}>
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </Field>
          <Field label={t("common:fields.password")}>
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </Field>
          {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <Button type="submit" disabled={busy}>{busy ? t("common:states.signing_in") : t("common:actions.login")}</Button>
        </div>
      </form>
    </main>
  );
}
