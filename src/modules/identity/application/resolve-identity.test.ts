import { describe, expect, it } from "vitest";

import { resolveIdentity } from "./resolve-identity";

const session = {
  user: {
    id: "owner-1",
    email: "Owner@Example.com",
    emailVerified: true,
    name: "Владелец",
  },
};

describe("resolveIdentity", () => {
  it("accepts only the invited Google email", () => {
    expect(resolveIdentity(session, "owner@example.com")).toEqual({
      userId: "owner-1",
      email: "owner@example.com",
      name: "Владелец",
    });
  });

  it("rejects an authenticated but uninvited account", () => {
    expect(resolveIdentity(session, "another@example.com")).toBeNull();
  });

  it("rejects an account whose email is not verified", () => {
    expect(
      resolveIdentity({ user: { ...session.user, emailVerified: false } }, "owner@example.com"),
    ).toBeNull();
  });
});
