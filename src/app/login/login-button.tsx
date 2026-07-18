"use client";

import { useState } from "react";

import { signInWithGoogle } from "../../modules/identity/client";

export function LoginButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setPending(true);
    setError(null);

    try {
      const message = await signInWithGoogle();
      if (message) {
        setError("Не удалось начать вход через Google. Попробуйте ещё раз.");
      }
    } catch {
      setError("Не удалось связаться с Google. Проверьте соединение и попробуйте ещё раз.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="action-stack">
      <button className="primary-button" type="button" onClick={handleLogin} disabled={pending}>
        {pending ? "Открываем Google…" : "Войти через Google"}
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
