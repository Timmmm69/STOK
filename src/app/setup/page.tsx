import { randomUUID } from "node:crypto";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getSetupForRequest } from "../../composition/setup";
import { LogoutButton } from "./logout-button";
import { SetupForm } from "./setup-form";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const result = await getSetupForRequest(await headers());
  if (!result) {
    redirect("/login");
  }

  return (
    <main className="app-shell">
      <section className="app-card">
        <header className="app-card-header">
          <div>
            <p className="eyebrow">STOK · Первый магазин</p>
            <h1 className="app-title">
              {result.setup.status === "pending" ? "Настройка Лучка" : result.setup.store.name}
            </h1>
          </div>
          <LogoutButton />
        </header>

        {result.setup.status === "pending" ? (
          <>
            <p className="app-lead">
              Подтвердите название. Валюта, время и язык уже зафиксированы по вашим решениям.
            </p>
            <SetupForm
              defaultStoreName={result.setup.defaults.storeName}
              idempotencyKey={randomUUID()}
            />
          </>
        ) : (
          <>
            <p className="success-banner">Магазин настроен и защищён входом владельца.</p>
            <dl className="settings-list configured-settings">
              <div>
                <dt>Организация</dt>
                <dd>{result.setup.organization.name}</dd>
              </div>
              <div>
                <dt>Магазин</dt>
                <dd>{result.setup.store.name}</dd>
              </div>
              <div>
                <dt>Валюта</dt>
                <dd>{result.setup.organization.currency}</dd>
              </div>
              <div>
                <dt>Часовой пояс</dt>
                <dd>Минск</dd>
              </div>
              <div>
                <dt>Владелец</dt>
                <dd>{result.identity.name}</dd>
              </div>
            </dl>
          </>
        )}
      </section>
    </main>
  );
}
