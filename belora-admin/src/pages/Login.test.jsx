import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Login from "./Login";
import { useAuth } from "../context/AuthContext";

// Mocka o AuthContext inteiro - estes testes validam o COMPONENTE Login
// (o que ele mostra e chama em cada etapa), não a lógica real de rede do
// AuthContext, que já é coberta pelos testes de integração do backend.
vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderLogin() {
  render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
  );
}

describe("Login", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  test("login sem 2FA navega direto para /dashboard", async () => {
    const login = vi.fn().mockResolvedValue({ twoFactorRequired: false });
    useAuth.mockReturnValue({ login, completeTwoFactorLogin: vi.fn() });

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText("voce@exemplo.com"), "nicolly@exemplo.com");
    await user.type(screen.getByPlaceholderText("••••••••"), "senha123");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith("nicolly@exemplo.com", "senha123");
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  test("login com 2FA ativo mostra a tela de código, sem navegar ainda", async () => {
    const login = vi.fn().mockResolvedValue({
      twoFactorRequired: true,
      twoFactorSessionToken: "token-fake",
    });
    useAuth.mockReturnValue({ login, completeTwoFactorLogin: vi.fn() });

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText("voce@exemplo.com"), "nicolly@exemplo.com");
    await user.type(screen.getByPlaceholderText("••••••••"), "senha123");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText("Verificação em duas etapas")).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("confirmar o código 2FA chama completeTwoFactorLogin e navega para /dashboard", async () => {
    const login = vi.fn().mockResolvedValue({
      twoFactorRequired: true,
      twoFactorSessionToken: "token-fake",
    });
    const completeTwoFactorLogin = vi.fn().mockResolvedValue({});
    useAuth.mockReturnValue({ login, completeTwoFactorLogin });

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText("voce@exemplo.com"), "nicolly@exemplo.com");
    await user.type(screen.getByPlaceholderText("••••••••"), "senha123");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => screen.getByText("Verificação em duas etapas"));

    await user.type(screen.getByPlaceholderText("000000"), "123456");
    await user.click(screen.getByRole("button", { name: /confirmar/i }));

    await waitFor(() => {
      expect(completeTwoFactorLogin).toHaveBeenCalledWith("token-fake", "123456");
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  test("mostra mensagem de erro quando o login falha", async () => {
    const login = vi.fn().mockRejectedValue({
      response: { data: { error: { message: "E-mail ou senha inválidos." } } },
    });
    useAuth.mockReturnValue({ login, completeTwoFactorLogin: vi.fn() });

    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByPlaceholderText("voce@exemplo.com"), "errado@exemplo.com");
    await user.type(screen.getByPlaceholderText("••••••••"), "senhaerrada");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText("E-mail ou senha inválidos.")).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
