// The Settings screen. Owners/admins can edit; others see read-only fields.
"use client";

import { useState, type FormEvent } from "react";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { useMe } from "@/features/auth/hooks";
import { getErrorMessage } from "@/lib/api";
import { can } from "@/lib/permissions";
import { useUpdateOrganization } from "./hooks";

/**
 * The Settings screen (organization name for now).
 *
 * Owners/admins (`org:update`) can edit; everyone else sees read-only fields.
 * The text box starts from the saved name and only tracks what the user typed
 * (`draft`), so a refetch of the profile never overwrites in-progress edits.
 *
 * @returns The settings UI.
 */
// Screen widget.
export function SettingsView() {
  const { data: me } = useMe();
  const update = useUpdateOrganization();
  // `null` means 'the user has typed nothing yet', so we show the saved name. This stops a
  //   background refresh from erasing what the user is typing.
  const [draft, setDraft] = useState<string | null>(null);

  if (!me) return null;
  const editable = can(me, "org:update");
  const name = draft ?? me.organization.name;

  /**
   * Save the new name, then drop the draft so the saved value is shown.
   *
   * @param event The form submit event.
   */
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    update.mutate(name.trim(), { onSuccess: () => setDraft(null) });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Settings</h1>
      <Card title="Organization">
        <form onSubmit={handleSubmit} className="max-w-md space-y-4">
          <Field label="Organization name" required disabled={!editable} value={name} onChange={(e) => setDraft(e.target.value)} />
          <Field label="Workspace ID" disabled readOnly value={me.organization.slug} />
          {update.isError && <Alert>{getErrorMessage(update.error)}</Alert>}
          {update.isSuccess && <Alert tone="success">Organization updated.</Alert>}
          {editable ? (
            <Button type="submit" loading={update.isPending} disabled={draft === null || name.trim() === me.organization.name}>
              Save changes
            </Button>
          ) : (
            <p className="text-sm text-slate-500">Only owners and admins can change these settings.</p>
          )}
        </form>
      </Card>
    </div>
  );
}
