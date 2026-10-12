// The Team screen. It holds the screen state and connects everything.
// Flutter idea: a StatefulWidget screen that owns search text, sort and page,
// and passes data down to a child table.
// Data flow:
//   typing -> search state -> debounce -> useMembers(params) -> API -> MembersTable
//   tap Remove -> useRemoveMember -> API -> cache refreshed -> table updates itself
"use client";

import { useState } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, SelectField } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Pagination";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getErrorMessage } from "@/lib/api";
import { can, assignableRoles } from "@/lib/permissions";
import type { Member, MemberSortBy, Role } from "@/lib/types";
import { useMe } from "@/features/auth/hooks";
import { AddMemberModal } from "./AddMemberModal";
import { MembersTable } from "./MembersTable";
import { useChangeRole, useMembers, useRemoveMember } from "./hooks";

const PAGE_SIZE = 10;

/**
 * The Team screen: search, sort, page through members, add / re-role / remove.
 *
 * Flow:
 * - Local state holds the search text, sort and page.
 * - The search text is debounced so typing doesn't spam the API.
 * - Changing search or sort resets to page 1 (page 3 of a new search may not exist).
 * - Mutations (role change, remove) show backend rule violations (e.g. "An
 *   organization must keep at least one owner.") in an alert.
 *
 * @returns The team management UI, or nothing while the profile loads.
 */
// The screen widget.
export function TeamView() {
  const { data: me } = useMe();
  // Local screen state (like fields in a State class).
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<MemberSortBy>("created_at");
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  // Wait 300 ms after typing before using the text. Fewer API calls.
  const q = useDebouncedValue(search);

  // The list request. Changing any param here triggers a new request automatically.
  const members = useMembers({ page, pageSize: PAGE_SIZE, q, sortBy, sortOrder: "asc" });
  const changeRole = useChangeRole();
  const removeMember = useRemoveMember();

  // Profile not loaded yet: show nothing. Like returning `SizedBox.shrink()`.
  if (!me) return null;
  const canManage = can(me, "members:manage");
  const actionError = changeRole.error ?? removeMember.error;

  /**
   * Ask for confirmation, then remove the member.
   *
   * Why confirm: removal revokes the person's access immediately and cannot
   * be undone from this screen.
   *
   * @param member The row's member.
   */
  // Asks 'are you sure?' first. `window.confirm` ~ showDialog with Yes/No.
  function handleRemove(member: Member) {
    if (window.confirm(`Remove ${member.full_name} from the team?`)) {
      removeMember.mutate(member.id);
    }
  }

  /**
   * Change a member's role.
   *
   * @param member The row's member.
   * @param role The newly selected role.
   */
  // Sends the new role to the backend.
  function handleRoleChange(member: Member, role: Role) {
    changeRole.mutate({ memberId: member.id, role });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Team</h1>
        {canManage && <Button onClick={() => setAdding(true)}>Add member</Button>}
      </div>

      <Card>
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <Field
            label="Search"
            placeholder="Name or email"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <SelectField
            label="Sort by"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as MemberSortBy);
              setPage(1);
            }}
          >
            <option value="created_at">Date joined</option>
            <option value="full_name">Name</option>
            <option value="email">Email</option>
            <option value="role">Role</option>
          </SelectField>
        </div>

        {actionError && <Alert>{getErrorMessage(actionError)}</Alert>}
        {members.isError && <Alert>{getErrorMessage(members.error)}</Alert>}
        {members.isLoading && <p className="py-8 text-center text-sm text-slate-500">Loading team…</p>}
        {members.data && (
          <>
            <MembersTable
              members={members.data.items}
              actorRole={me.role}
              canManage={canManage}
              onRoleChange={handleRoleChange}
              onRemove={handleRemove}
            />
            <Pagination page={page} pageSize={PAGE_SIZE} total={members.data.total} onPageChange={setPage} />
          </>
        )}
      </Card>

      {adding && <AddMemberModal roles={assignableRoles(me.role)} onClose={() => setAdding(false)} />}
    </div>
  );
}
