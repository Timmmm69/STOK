import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getRequestIdentity } from "../../composition/auth";
import { LoginButton } from "./login-button";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const identity = await getRequestIdentity(await headers());
  if (identity) {
    redirect("/setup");
  }

  return (
    <main className="app-shell">
      <section className="app-card auth-card">
        <p className="eyebrow">STOK · Лучок</p>
        <h1 className="app-title">Вход владельца</h1>
        <p className="app-lead">
          Сейчас доступ разрешён только приглашённому владельцу магазина. Выберите Google-аккаунт с
          разрешённой электронной почтой.
        </p>
        <LoginButton />
        <p className="privacy-note">STOK не получает и не хранит ваш пароль Google.</p>
      </section>
    </main>
  );
}
