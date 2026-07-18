"use client";

import { useState } from "react";

import { signOut } from "../../modules/identity/client";

export function LogoutButton() {
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    await signOut();
    window.location.assign("/login");
  }

  return (
    <button className="text-button" type="button" onClick={handleLogout} disabled={pending}>
      {pending ? "Выходим…" : "Выйти"}
    </button>
  );
}
