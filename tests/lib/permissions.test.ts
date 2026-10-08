import { assignableRoles, can, canManageMember } from "@/lib/permissions";
import { makeMe } from "../utils";

describe("can", () => {
  it("is false while the profile is still loading", () => {
    expect(can(undefined, "members:manage")).toBe(false);
  });

  it("reflects the role's permissions", () => {
    expect(can(makeMe("owner"), "audit:read")).toBe(true);
    expect(can(makeMe("agent"), "audit:read")).toBe(false);
    expect(can(makeMe("agent"), "members:read")).toBe(true);
  });
});

describe("assignableRoles", () => {
  it("never offers a role above the actor's own", () => {
    expect(assignableRoles("admin")).toEqual(["admin", "agent", "viewer"]);
    expect(assignableRoles("viewer")).toEqual(["viewer"]);
  });

  it("offers every role to an owner, highest first", () => {
    expect(assignableRoles("owner")).toEqual(["owner", "admin", "agent", "viewer"]);
  });
});

describe("canManageMember", () => {
  it("blocks admins from managing owners but allows owners to manage anyone", () => {
    expect(canManageMember("admin", "owner")).toBe(false);
    expect(canManageMember("admin", "agent")).toBe(true);
    expect(canManageMember("owner", "owner")).toBe(true);
  });
});
