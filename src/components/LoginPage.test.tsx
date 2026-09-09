import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser, login as loginRequest } from "../api/client";
import { AuthProvider } from "../auth/AuthContext";
import { LoginPage } from "./LoginPage";

vi.mock("../api/client", () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
}));

function renderLogin() {
  return render(
    <AuthProvider>
      <LoginPage />
    </AuthProvider>,
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("renders only the login form", async () => {
    renderLogin();

    expect(await screen.findByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail")).toBeRequired();
    expect(screen.getByLabelText("Senha")).toBeRequired();
    expect(screen.queryByText(/cadastro|registr/i)).not.toBeInTheDocument();
  });

  it("submits email and password to auth context", async () => {
    const currentUser = {
      id: "1",
      email: "user@example.com",
      full_name: "User",
      role: "analyst",
      is_active: true,
      created_at: null,
    };
    vi.mocked(loginRequest).mockResolvedValue({ access_token: "jwt", token_type: "bearer" });
    vi.mocked(getCurrentUser).mockResolvedValue(currentUser);
    const user = userEvent.setup();
    renderLogin();

    await user.type(await screen.findByLabelText("E-mail"), "user@example.com");
    await user.type(screen.getByLabelText("Senha"), "Secret123!");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(loginRequest).toHaveBeenCalledWith("user@example.com", "Secret123!"));
  });

  it("shows the API error without exposing credentials", async () => {
    vi.mocked(loginRequest).mockRejectedValue(new Error("E-mail ou senha incorretos"));
    const user = userEvent.setup();
    renderLogin();

    await user.type(await screen.findByLabelText("E-mail"), "user@example.com");
    await user.type(screen.getByLabelText("Senha"), "Secret123!");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("E-mail ou senha incorretos");
    expect(screen.queryByText("Secret123!")).not.toBeInTheDocument();
  });
});
