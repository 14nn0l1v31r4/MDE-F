import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser, login as loginRequest, register as registerRequest } from "../api/client";
import { AuthProvider } from "../auth/AuthContext";
import { RegisterPage } from "./RegisterPage";

vi.mock("../api/client", () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
}));

function renderRegister(onNavigateLogin = vi.fn()) {
  return {
    onNavigateLogin,
    ...render(
      <AuthProvider>
        <RegisterPage onNavigateLogin={onNavigateLogin} />
      </AuthProvider>,
    ),
  };
}

describe("RegisterPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("renders the register form with all required inputs and password rules", async () => {
    renderRegister();

    expect(await screen.findByRole("heading", { name: "Criar Conta" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nome completo")).toBeRequired();
    expect(screen.getByLabelText("E-mail")).toBeRequired();
    expect(screen.getByLabelText(/^Senha/)).toBeRequired();
    expect(screen.getByLabelText("Confirmar Senha")).toBeRequired();
    expect(screen.getByRole("button", { name: "Cadastrar" })).toBeInTheDocument();
    expect(screen.getByText(/pelo menos 8 caracteres/i)).toBeInTheDocument();
  });

  it("calls onNavigateLogin when user clicks the login link", async () => {
    const { onNavigateLogin } = renderRegister();
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: /entrar/i }));
    expect(onNavigateLogin).toHaveBeenCalledTimes(1);
  });

  it("shows error when passwords do not match without submitting", async () => {
    renderRegister();
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Nome completo"), "Novo Usuário");
    await user.type(screen.getByLabelText("E-mail"), "novo@example.com");
    await user.type(screen.getByLabelText(/^Senha/), "Password123!");
    await user.type(screen.getByLabelText("Confirmar Senha"), "DifferentPass123!");
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/senhas não coincidem/i);
    expect(registerRequest).not.toHaveBeenCalled();
  });

  it("shows error when password does not meet security requirements", async () => {
    renderRegister();
    const user = userEvent.setup();

    await user.type(await screen.findByLabelText("Nome completo"), "Novo Usuário");
    await user.type(screen.getByLabelText("E-mail"), "novo@example.com");
    await user.type(screen.getByLabelText(/^Senha/), "weak");
    await user.type(screen.getByLabelText("Confirmar Senha"), "weak");
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/requisitos mínimos/i);
    expect(registerRequest).not.toHaveBeenCalled();
  });

  it("submits valid form data to register and automatically logs in", async () => {
    const newUser = {
      id: "1",
      email: "novo@example.com",
      full_name: "Novo Usuário",
      role: "analyst",
      is_active: true,
      created_at: null,
    };
    vi.mocked(registerRequest).mockResolvedValue(newUser);
    vi.mocked(loginRequest).mockResolvedValue({ access_token: "jwt", token_type: "bearer" });
    vi.mocked(getCurrentUser).mockResolvedValue(newUser);

    const user = userEvent.setup();
    renderRegister();

    await user.type(await screen.findByLabelText("Nome completo"), "Novo Usuário");
    await user.type(screen.getByLabelText("E-mail"), "novo@example.com");
    await user.type(screen.getByLabelText(/^Senha/), "Secret123!");
    await user.type(screen.getByLabelText("Confirmar Senha"), "Secret123!");
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() =>
      expect(registerRequest).toHaveBeenCalledWith({
        full_name: "Novo Usuário",
        email: "novo@example.com",
        password: "Secret123!",
      }),
    );
  });

  it("shows API error message when registration fails", async () => {
    vi.mocked(registerRequest).mockRejectedValue(new Error("Já existe um usuário cadastrado com este e-mail"));

    const user = userEvent.setup();
    renderRegister();

    await user.type(await screen.findByLabelText("Nome completo"), "Novo Usuário");
    await user.type(screen.getByLabelText("E-mail"), "existente@example.com");
    await user.type(screen.getByLabelText(/^Senha/), "Secret123!");
    await user.type(screen.getByLabelText("Confirmar Senha"), "Secret123!");
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Já existe um usuário cadastrado com este e-mail",
    );
  });
});
