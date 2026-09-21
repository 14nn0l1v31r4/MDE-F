import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser, login as loginRequest, register as registerRequest } from "../api/client";
import { readAccessToken, writeAccessToken } from "../auth/storage";
import { AuthProvider, useAuth } from "../auth/AuthContext";

vi.mock("../api/client", () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
}));

const user = {
  id: "1",
  email: "user@example.com",
  full_name: "User",
  role: "analyst",
  is_active: true,
  created_at: null,
};

function Harness() {
  const auth = useAuth();

  return (
    <div>
      <span>{auth.status}</span>
      <span>{auth.user?.full_name}</span>
      <span>{auth.error}</span>
      <button type="button" onClick={() => void auth.login(user.email, "Secret123!")}>Login</button>
      <button
        type="button"
        onClick={() =>
          void auth
            .register({
              email: "novo@example.com",
              password: "Password123!",
              full_name: "Novo Usuário",
            })
            .catch(() => {})
        }
      >
        Register
      </button>
      <button type="button" onClick={auth.logout}>Logout</button>
    </div>
  );
}

function renderAuth() {
  return render(
    <AuthProvider>
      <Harness />
    </AuthProvider>,
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("starts anonymous when no token exists", async () => {
    renderAuth();
    expect(await screen.findByText("anonymous")).toBeInTheDocument();
  });

  it("restores a valid session from the stored token", async () => {
    writeAccessToken("jwt");
    vi.mocked(getCurrentUser).mockResolvedValue(user);

    renderAuth();

    expect(await screen.findByText("authenticated")).toBeInTheDocument();
    expect(screen.getByText("User")).toBeInTheDocument();
  });

  it("clears an invalid stored token", async () => {
    writeAccessToken("expired-jwt");
    vi.mocked(getCurrentUser).mockRejectedValue(new Error("Token expirado"));

    renderAuth();

    await waitFor(() => expect(screen.getByText("anonymous")).toBeInTheDocument());
    expect(readAccessToken()).toBeNull();
  });

  it("logs in and loads the current user", async () => {
    vi.mocked(loginRequest).mockResolvedValue({ access_token: "jwt", token_type: "bearer" });
    vi.mocked(getCurrentUser).mockResolvedValue(user);

    renderAuth();
    await userEvent.setup().click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => expect(screen.getByText("authenticated")).toBeInTheDocument());
    expect(loginRequest).toHaveBeenCalledWith(user.email, "Secret123!");
    expect(readAccessToken()).toBe("jwt");
  });

  it("logs out locally", async () => {
    writeAccessToken("jwt");
    vi.mocked(getCurrentUser).mockResolvedValue(user);
    renderAuth();
    await screen.findByText("authenticated");

    await userEvent.setup().click(screen.getByRole("button", { name: "Logout" }));

    expect(screen.getByText("anonymous")).toBeInTheDocument();
    expect(readAccessToken()).toBeNull();
  });

  it("registers user and automatically logs in", async () => {
    const newUser = {
      id: "2",
      email: "novo@example.com",
      full_name: "Novo Usuário",
      role: "analyst",
      is_active: true,
      created_at: null,
    };
    vi.mocked(registerRequest).mockResolvedValue(newUser);
    vi.mocked(loginRequest).mockResolvedValue({ access_token: "new-jwt", token_type: "bearer" });
    vi.mocked(getCurrentUser).mockResolvedValue(newUser);

    renderAuth();
    await userEvent.setup().click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() => expect(screen.getByText("authenticated")).toBeInTheDocument());
    expect(registerRequest).toHaveBeenCalledWith({
      email: "novo@example.com",
      password: "Password123!",
      full_name: "Novo Usuário",
    });
    expect(loginRequest).toHaveBeenCalledWith("novo@example.com", "Password123!");
    expect(readAccessToken()).toBe("new-jwt");
    expect(screen.getByText("Novo Usuário")).toBeInTheDocument();
  });

  it("handles registration error and sets error message", async () => {
    vi.mocked(registerRequest).mockRejectedValue(new Error("Usuário já existe"));

    renderAuth();
    await userEvent.setup().click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() => expect(screen.getByText("Usuário já existe")).toBeInTheDocument());
    expect(readAccessToken()).toBeNull();
  });
});
