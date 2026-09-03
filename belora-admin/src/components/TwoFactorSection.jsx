import { useState } from "react";
import { ShieldCheck, ShieldOff } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function TwoFactorSection() {
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState("idle"); // idle | setup | done
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);
  const [secret, setSecret] = useState(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const enabled = user?.twoFactorEnabled;

  async function handleStartSetup() {
    setError("");
    setSaving(true);
    try {
      const { data } = await api.post("/auth/2fa/setup");
      setQrCodeDataUrl(data.qrCodeDataUrl);
      setSecret(data.secret);
      setStep("setup");
    } catch {
      setError("Não foi possível iniciar o setup do 2FA.");
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const { data } = await api.post("/auth/2fa/enable", { token: code });
      setBackupCodes(data.backupCodes);
      setStep("done");
      setEnabled(true);
    } catch (err) {
      setError(err.response?.data?.error?.message || "Código inválido.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDisable(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.post("/auth/2fa/disable", { password });
      setEnabled(false);
      setStep("idle");
      setPassword("");
    } catch (err) {
      setError(err.response?.data?.error?.message || "Senha incorreta.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white/90 backdrop-blur p-5 sm:p-7 rounded-3xl border border-(--color-line) shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        {enabled ? (
          <ShieldCheck className="w-5 h-5 text-(--color-sage)" />
        ) : (
          <ShieldOff className="w-5 h-5 text-(--color-ink-soft)" />
        )}
        <h2 className="text-lg font-display font-bold text-(--color-ink)">
          Verificação em duas etapas (2FA)
        </h2>
      </div>
      <p className="text-xs text-(--color-ink-soft) -mt-2">
        {enabled
          ? "Ativa. No login, além da senha, será pedido um código do seu app autenticador."
          : "Adiciona uma camada extra de segurança ao login, exigindo um código do celular além da senha."}
      </p>

      {step === "idle" && !enabled && (
        <button
          onClick={handleStartSetup}
          disabled={saving}
          className="px-4 py-2.5 bg-(--color-ink) text-white rounded-xl text-xs font-semibold hover:bg-(--color-clay-dark) transition-all disabled:opacity-60"
        >
          {saving ? "Gerando..." : "Ativar 2FA"}
        </button>
      )}

      {step === "setup" && (
        <form onSubmit={handleConfirm} className="space-y-4">
          <div className="flex flex-col items-center gap-3 py-2">
            <img src={qrCodeDataUrl} alt="QR code para configurar 2FA" className="w-40 h-40 rounded-xl border border-(--color-line)" />
            <p className="text-[11px] text-(--color-ink-soft) text-center">
              Escaneie com Google Authenticator, Authy ou similar. Não consegue escanear?{" "}
              <span className="font-mono">{secret}</span>
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-(--color-ink) mb-1.5">
              Digite o código gerado pelo app
            </label>
            <input
              type="text"
              required
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-(--color-lilac-soft) border border-(--color-line) rounded-xl text-sm text-center font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-(--color-clay)"
              placeholder="000000"
              maxLength={6}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-(--color-ink) text-white rounded-xl text-sm font-semibold hover:bg-(--color-clay-dark) transition-all disabled:opacity-60"
          >
            {saving ? "Confirmando..." : "Confirmar e ativar"}
          </button>
        </form>
      )}

      {step === "done" && backupCodes && (
        <div className="space-y-3">
          <div className="rounded-xl bg-(--color-sage-soft) border border-(--color-sage) p-4 text-xs text-(--color-ink)">
            <p className="font-semibold mb-2">2FA ativado! Guarde estes códigos de backup:</p>
            <p className="text-[11px] text-(--color-ink-soft) mb-2">
              Use um deles se perder acesso ao seu app autenticador. Cada código funciona uma única vez.
            </p>
            <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
              {backupCodes.map((c) => (
                <span key={c} className="bg-white rounded-lg px-2 py-1 text-center border border-(--color-line)">
                  {c}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => setStep("idle")}
            className="text-xs text-(--color-ink-soft) hover:text-(--color-ink) underline"
          >
            Já salvei, fechar
          </button>
        </div>
      )}

      {enabled && step === "idle" && (
        <form onSubmit={handleDisable} className="space-y-3 pt-2 border-t border-(--color-line)">
          <label className="block text-xs font-semibold text-(--color-ink) mb-1.5 mt-3">
            Desativar 2FA (confirme sua senha)
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-(--color-lilac-soft) border border-(--color-line) rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-(--color-clay)"
            placeholder="Sua senha atual"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="text-xs font-semibold text-(--color-clay-dark) hover:underline disabled:opacity-60"
          >
            {saving ? "Desativando..." : "Desativar 2FA"}
          </button>
        </form>
      )}
    </div>
  );
}
