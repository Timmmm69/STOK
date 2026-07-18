import { getSystemHealth } from "../../composition/health";

export const dynamic = "force-dynamic";

export default async function HealthPage() {
  const health = await getSystemHealth();
  const healthy = health.status === "ok";

  return (
    <main className="health-shell" data-testid="health-page" data-status={health.status}>
      <section className="health-card" aria-labelledby="health-title">
        <p className="eyebrow">STOK · инженерный контур</p>
        <div className="health-heading">
          <div>
            <h1 id="health-title">Состояние системы</h1>
            <p>Проверка приложения и локальной базы PostgreSQL.</p>
          </div>
          <span className={healthy ? "status status-ok" : "status status-down"}>
            {healthy ? "Работает" : "Ограничено"}
          </span>
        </div>

        <dl className="health-checks">
          <div>
            <dt>Приложение</dt>
            <dd>Доступно</dd>
          </div>
          <div>
            <dt>База данных</dt>
            <dd>{health.checks.database.status === "up" ? "Доступна" : "Недоступна"}</dd>
          </div>
          <div>
            <dt>Задержка БД</dt>
            <dd>{health.checks.database.latencyMs} мс</dd>
          </div>
        </dl>

        <p className="timestamp">
          Проверено: <time dateTime={health.timestamp}>{health.timestamp}</time>
        </p>
      </section>
    </main>
  );
}
