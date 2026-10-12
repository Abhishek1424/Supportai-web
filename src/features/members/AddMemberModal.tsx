// Dialog to add a person. Flutter idea: an AlertDialog with a Form. It shows only the roles
//   you may give.
"use client";

import { useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, SelectField } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { ApiError, getErrorMessage } from "@/lib/api";
import { capitalize } from "@/lib/format";
import type { Role } from "@/lib/types";
import { useAddMember } from "./hooks";

/**
 * Dialog for adding a team member.
 *
 * Business rules shown to the user:
 * - Only roles at or below the actor's own rank are offered (`roles`).
 * - If the email already has a SupportAI account they are simply added.
 *   Otherwise name + password are needed to create the account; when the
 *   backend answers NEW_USER_DETAILS_REQUIRED we explain this instead of
 *   showing a raw error.
 *
 * @param props.roles Roles the current user may assign.
 * @param props.onClose Called to dismiss the dialog (also after success).
 * @returns The modal form.
 */
// `roles` and `onClose` are constructor params. `onClose` is a callback like
//   `VoidCallback`.
export function AddMemberModal({ roles, onClose }: { roles: Role[]; onClose: () => void }) {
  // The 'add member' service with loading/error state.
  const addMember = useAddMember();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>(roles[roles.length - 1] ?? "viewer");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");

  /**
   * Submit: send only the optional fields that were filled in, close on success.
   *
   * @param event The form submit event.
   */
  // Sends only the optional fields that are filled. The `...(x && {y})` trick means 'add
  //   this key only if x has a value'.
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    addMember.mutate(
      {
        email,
        role,
        ...(fullName && { full_name: fullName }),
        ...(password && { password }),
      },
      { onSuccess: onClose },
    );
  }

  // Checks the error code. If the person has no account yet, we show a friendly hint
  //   instead of the raw message.
  const needsDetails =
    addMember.error instanceof ApiError && addMember.error.code === "NEW_USER_DETAILS_REQUIRED";

  return (
    <Modal title="Add team member" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <SelectField label="Role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {roles.map((r) => (
            <option key={r} value={r}>
              {capitalize(r)}
            </option>
          ))}
        </SelectField>
        <Field label="Full name" hint="Only needed if this person has no account yet" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Field label="Initial password" type="password" minLength={10} hint="Only needed if this person has no account yet (min 10 characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
        {addMember.isError && (
          <Alert>
            {needsDetails
              ? "This email has no account yet. Enter their full name and an initial password."
              : getErrorMessage(addMember.error)}
          </Alert>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={addMember.isPending}>
            Add member
          </Button>
        </div>
      </form>
    </Modal>
  );
}
