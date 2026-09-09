import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { getCurrentUser, login as loginRequest } from "../api/client";
import type { User } from "../types";
import { clearAccessToken, readAccessToken, writeAccessToken } from "./storage";

type AuthStatus = "restoring" | "authenticated" | "anonymous";

type AuthContextValue = {
  status: AuthStatus;
  user: User | null;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Não foi possível autenticar.";
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>("restoring");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!readAccessToken()) {
        setStatus("anonymous");
        return;
      }

      try {
        const currentUser = await getCurrentUser();
        if (active) {
          setUser(currentUser);
          setStatus("authenticated");
        }
      } catch {
        clearAccessToken();
        if (active) {
          setUser(null);
          setStatus("anonymous");
        }
      }
    }

    void restoreSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      clearAccessToken();
      setUser(null);
      setError("Sua sessão expirou. Entre novamente.");
      setStatus("anonymous");
    }

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setStatus("restoring");

    try {
      const token = await loginRequest(email, password);
      writeAccessToken(token.access_token);
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setStatus("authenticated");
    } catch (loginError) {
      clearAccessToken();
      setUser(null);
      setStatus("anonymous");
      setError(errorMessage(loginError));
      throw loginError;
    }
  }, []);

  const logout = useCallback(() => {
    clearAccessToken();
    setUser(null);
    setError(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo(
    () => ({ status, user, error, login, logout }),
    [status, user, error, login, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
}
