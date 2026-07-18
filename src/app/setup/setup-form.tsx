"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

type SetupFormProps = {
  defaultStoreName: string;
  idempotencyKey: string;
};

export function SetupForm({ defaultStoreName, idempotencyKey }: SetupFormProps) {
  const router = useRouter();
  const [storeName, setStoreName] = useState(defaultStoreName);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/setup", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": idempotencyKey,
        },
        body: JSON.stringify({ storeName }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(body.error ?? "Не удалось сохранить настройки");
        return;
      }

      router.refresh();
    } catch {
      setError("Не удалось связаться с сервером. Попробуйте ещё раз.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="setup-form" onSubmit={handleSubmit}>
      <label htmlFor="storeName">Название магазина</label>
      <input
        id="storeName"
        name="storeName"
        value={storeName}
        onChange={(event) => setStoreName(event.target.value)}
        minLength={1}
        maxLength={120}
        autoComplete="organization"
        required
      />
      <dl className="settings-list">
        <div>
          <dt>Валюта</dt>
          <dd>Белорусский рубль (BYN)</dd>
        </div>
        <div>
          <dt>Часовой пояс</dt>
          <dd>Минск</dd>
        </div>
        <div>
          <dt>Язык</dt>
          <dd>Русский</dd>
        </div>
      </dl>
      <button className="primary-button" type="submit" disabled={pending}>
        {pending ? "Сохраняем…" : "Создать магазин"}
      </button>
      {error ? <p className="form-error">{error}</p> : null}
    </form>
  );
}
