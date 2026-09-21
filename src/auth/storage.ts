const ACCESS_TOKEN_KEY = "mde.auth.v1";

export function readAccessToken(): string | null {
  const token = sessionStorage.getItem(ACCESS_TOKEN_KEY)?.trim();
  return token || null;
}

export function writeAccessToken(token: string): void {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
}
