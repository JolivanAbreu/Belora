import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, completeTwoFactorLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [twoFactorSessionToken, setTwoFactorSessionToken] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.twoFactorRequired) {
        setTwoFactorSessionToken(result.twoFactorSessionToken);
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message || "Não foi possível entrar. Verifique seus dados."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await completeTwoFactorLogin(twoFactorSessionToken, code);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.error?.message || "Código inválido. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen wave-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-(--color-ink) text-white flex items-center justify-center font-display font-bold text-2xl shadow-md mx-auto mb-3">
            B
          </div>
          <h1 className="font-display font-bold text-3xl text-(--color-ink)">Belora</h1>
          <p className="text-(--color-ink-soft) text-sm mt-1">
            Sua agenda, sempre no controle.
          </p>
        </div>

        {!twoFactorSessionToken ? (
          <form
            onSubmit={handleSubmit}
            className="bg-(--color-surface) border border-(--color-line) rounded-3xl p-7 shadow-sm"
          >
            <label className="block text-xs font-semibold text-(--color-ink) mb-1.5">
              E-mail
            </label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl bg-(--color-lilac-soft) border border-(--color-line) px-3.5 py-2.5 text-sm mb-4 outline-none focus:border-(--color-clay) focus:ring-2 focus:ring-(--color-clay)/20 transition-shadow"
              placeholder="voce@exemplo.com"
            />

            <label className="block text-xs font-semibold text-(--color-ink) mb-1.5">
              Senha
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl bg-(--color-lilac-soft) border border-(--color-line) px-3.5 py-2.5 text-sm mb-5 outline-none focus:border-(--color-clay) focus:ring-2 focus:ring-(--color-clay)/20 transition-shadow"
              placeholder="••••••••"
            />

            {error && (
              <p className="text-sm text-red-600 mb-4 -mt-1" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-(--color-ink) text-white text-sm font-semibold py-2.5 hover:bg-(--color-clay-dark) transition-colors disabled:opacity-60 shadow"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleVerifyCode}
            className="bg-(--color-surface) border border-(--color-line) rounded-3xl p-7 shadow-sm"
          >
            <h2 className="font-display text-lg text-(--color-ink) mb-1">Verificação em duas etapas</h2>
            <p className="text-xs text-(--color-ink-soft) mb-4">
              Digite o código de 6 dígitos do seu app autenticador, ou um código de backup.
            </p>

            <input
              type="text"
              required
              autoFocus
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-xl bg-(--color-lilac-soft) border border-(--color-line) px-3.5 py-2.5 text-sm mb-5 outline-none focus:border-(--color-clay) focus:ring-2 focus:ring-(--color-clay)/20 transition-shadow text-center tracking-widest font-mono"
              placeholder="000000"
              maxLength={11}
            />

            {error && (
              <p className="text-sm text-red-600 mb-4 -mt-1" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-(--color-ink) text-white text-sm font-semibold py-2.5 hover:bg-(--color-clay-dark) transition-colors disabled:opacity-60 shadow"
            >
              {loading ? "Verificando..." : "Confirmar"}
            </button>

            <button
              type="button"
              onClick={() => {
                setTwoFactorSessionToken(null);
                setCode("");
                setError("");
              }}
              className="w-full text-xs text-(--color-ink-soft) hover:text-(--color-ink) mt-3"
            >
              ← Voltar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
