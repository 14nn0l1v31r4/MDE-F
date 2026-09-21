import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser, login, register } from "../api/client";
import { readAccessToken, writeAccessToken } from "../auth/storage";

describe("authenticated API client", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("logs in through the JSON endpoint", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ access_token: "jwt", token_type: "bearer" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    await expect(login("user@example.com", "Secret123!")).resolves.toEqual({
      access_token: "jwt",
      token_type: "bearer",
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/login/json",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: "user@example.com", password: "Secret123!" }),
      }),
    );
  });

  it("sends Bearer token to current-user endpoint", async () => {
    writeAccessToken("jwt");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: "1",
            email: "user@example.com",
            full_name: "User",
            role: "analyst",
            is_active: true,
            created_at: null,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    await getCurrentUser();

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/me",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer jwt" }),
      }),
    );
  });

  it("clears the token and emits an event after a 401", async () => {
    writeAccessToken("expired-jwt");
    const unauthorized = vi.fn();
    window.addEventListener("auth:unauthorized", unauthorized);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ detail: "Token expirado" }), { status: 401 })));

    await expect(getCurrentUser()).rejects.toThrow("Token expirado");

    expect(readAccessToken()).toBeNull();
    expect(unauthorized).toHaveBeenCalledTimes(1);
    window.removeEventListener("auth:unauthorized", unauthorized);
  });

  it("sends register request with correct payload and returns created user", async () => {
    const newUser = {
      id: "user-1",
      email: "novo@example.com",
      full_name: "Novo Usuário",
      role: "analyst",
      is_active: true,
      created_at: null,
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(newUser), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const response = await register({
      email: "novo@example.com",
      password: "Password123!",
      full_name: "Novo Usuário",
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/register",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "content-type": "application/json" }),
        body: JSON.stringify({
          email: "novo@example.com",
          password: "Password123!",
          full_name: "Novo Usuário",
        }),
      }),
    );
    expect(response).toEqual(newUser);
  });
});
