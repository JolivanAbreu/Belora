import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/agenda");
    } catch (err) {
      setError(
        err.response?.data?.error?.message || "Não foi possível entrar. Verifique seus dados."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-(--color-canvas) px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-display italic text-4xl text-(--color-ink)">Belora</h1>
          <p className="text-(--color-ink-soft) text-sm mt-2">
            Sua agenda, sempre no controle.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-(--color-surface) border border-(--color-line) rounded-2xl p-7 shadow-[0_1px_2px_rgba(46,26,71,0.04)]"
        >
          <label className="block text-xs font-medium text-(--color-ink-soft) mb-1.5">
            E-mail
          </label>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-(--color-line) px-3.5 py-2.5 text-sm mb-4 outline-none focus:border-(--color-clay) focus:ring-2 focus:ring-(--color-clay)/15 transition-shadow"
            placeholder="voce@exemplo.com"
          />

          <label className="block text-xs font-medium text-(--color-ink-soft) mb-1.5">
            Senha
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-(--color-line) px-3.5 py-2.5 text-sm mb-5 outline-none focus:border-(--color-clay) focus:ring-2 focus:ring-(--color-clay)/15 transition-shadow"
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
            className="w-full rounded-lg bg-(--color-ink) text-white text-sm font-medium py-2.5 hover:bg-(--color-ink)/90 transition-colors disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
