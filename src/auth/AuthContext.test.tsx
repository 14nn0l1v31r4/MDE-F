import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser, login as loginRequest } from "../api/client";
import { readAccessToken, writeAccessToken } from "./storage";
import { AuthProvider, useAuth } from "./AuthContext";

vi.mock("../api/client", () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
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
});
