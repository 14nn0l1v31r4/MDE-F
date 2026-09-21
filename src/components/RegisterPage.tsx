import { useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";

type RegisterPageProps = {
  onNavigateLogin?: () => void;
};

export function validatePasswordRules(password: string) {
  return {
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasDigit: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
}

export function RegisterPage({ onNavigateLogin }: RegisterPageProps) {
  const { error: authError, register, status, clearError } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const isSubmitting = status === "restoring";
  const passwordRules = validatePasswordRules(password);
  const isPasswordValid = Object.values(passwordRules).every(Boolean);

  const displayError = localError || authError;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError(null);
    clearError?.();

    if (fullName.trim().length < 2) {
      setLocalError("O nome completo deve ter pelo menos 2 caracteres.");
      return;
    }

    if (!isPasswordValid) {
      setLocalError("A senha não atende aos requisitos mínimos de segurança.");
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("As senhas não coincidem.");
      return;
    }

    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
      });
    } catch {
      // AuthProvider exposes the API error through context.
    }
  }

  function handleNavigateLogin() {
    clearError?.();
    onNavigateLogin?.();
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="register-title">
        <span className="section-kicker">Plataforma</span>
        <h1 id="register-title">Criar Conta</h1>
        <p className="hint">Cadastre-se na plataforma de mineração de dados educacionais.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="register-fullname" className="custom-label">
              Nome completo
            </label>
            <input
              id="register-fullname"
              name="full_name"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(event) => {
                setFullName(event.target.value);
                if (localError) setLocalError(null);
              }}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-email" className="custom-label">
              E-mail
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (localError) setLocalError(null);
              }}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-password" className="custom-label">
              Senha
            </label>
            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (localError) setLocalError(null);
              }}
              required
            />
            <ul className="password-rules-list" aria-label="Requisitos de segurança da senha">
              <li className={passwordRules.hasMinLength ? "rule-met" : "rule-unmet"}>
                Pelo menos 8 caracteres
              </li>
              <li className={passwordRules.hasUppercase ? "rule-met" : "rule-unmet"}>
                Pelo menos uma letra maiúscula
              </li>
              <li className={passwordRules.hasLowercase ? "rule-met" : "rule-unmet"}>
                Pelo menos uma letra minúscula
              </li>
              <li className={passwordRules.hasDigit ? "rule-met" : "rule-unmet"}>
                Pelo menos um dígito numérico
              </li>
              <li className={passwordRules.hasSpecialChar ? "rule-met" : "rule-unmet"}>
                Pelo menos um caractere especial (!@#$%^&*)
              </li>
            </ul>
          </div>

          <div className="form-group">
            <label htmlFor="register-confirm-password" className="custom-label">
              Confirmar Senha
            </label>
            <input
              id="register-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                if (localError) setLocalError(null);
              }}
              required
            />
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Cadastrando..." : "Cadastrar"}
          </button>
        </form>

        <div className="auth-footer-nav">
          <span>Já possui uma conta?</span>{" "}
          <button
            type="button"
            className="auth-link-button"
            onClick={handleNavigateLogin}
          >
            Entrar
          </button>
        </div>

        {displayError && (
          <p className="feedback-message error auth-error" role="alert" aria-live="polite">
            {displayError}
          </p>
        )}
      </section>
    </main>
  );
}
