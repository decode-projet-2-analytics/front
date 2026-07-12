"use client";

import { FormEvent, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  ApplicationInvitation,
  ApplicationTeamMember,
  ApplicationTeamRole,
  cancelApplicationInvitation,
  inviteApplicationMembers,
  removeApplicationMember,
  updateApplicationMemberRole,
} from "@/lib/applicationsApi";

interface Props {
  applicationId: number;
  members: ApplicationTeamMember[];
  invitations: ApplicationInvitation[];
  canManageTeam: boolean;
}

const editableRoles: Exclude<ApplicationTeamRole, "owner">[] = [
  "admin",
  "member",
  "viewer",
];

function displayName(member: ApplicationTeamMember) {
  const name = [member.user.firstname, member.user.lastname]
    .filter(Boolean)
    .join(" ");
  return name || member.user.email;
}

function splitEmails(value: string) {
  return value
    .split(/[\s,;]+/)
    .map((email) => email.trim())
    .filter(Boolean);
}

export default function ApplicationTeamPanel({
  applicationId,
  members,
  invitations,
  canManageTeam,
}: Props) {
  const t = useTranslations("Applications.team");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function refreshOnSuccess(ok: boolean) {
    if (!ok) {
      setError(t("genericError"));
      return;
    }
    startTransition(() => router.refresh());
  }

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const emails = splitEmails(String(formData.get("emails") ?? ""));
    const role = String(formData.get("role") ?? "member") as Exclude<
      ApplicationTeamRole,
      "owner"
    >;

    if (emails.length === 0) {
      setError(t("inviteError"));
      return;
    }

    const result = await inviteApplicationMembers(applicationId, {
      emails,
      role,
    });

    if (!result.ok) {
      setError(result.details ?? result.message ?? t("inviteError"));
      return;
    }

    form.reset();
    setNotice(
      t("inviteResult", {
        sent: result.data.sent.length,
        skipped:
          result.data.alreadyInvited.length +
          result.data.alreadyMembers.length +
          result.data.invalid.length,
      }),
    );
    startTransition(() => router.refresh());
  }

  async function handleRoleChange(memberId: number, role: string) {
    setError(null);
    const result = await updateApplicationMemberRole(
      applicationId,
      memberId,
      role as Exclude<ApplicationTeamRole, "owner">,
    );
    await refreshOnSuccess(result.ok);
  }

  async function handleRemove(memberId: number) {
    setError(null);
    const result = await removeApplicationMember(applicationId, memberId);
    await refreshOnSuccess(result.ok);
  }

  async function handleCancelInvitation(invitationId: number) {
    setError(null);
    const result = await cancelApplicationInvitation(applicationId, invitationId);
    await refreshOnSuccess(result.ok);
  }

  return (
    <div className="space-y-4 border-t border-border pt-4">
      <div>
        <h3 className="text-sm font-medium">{t("title")}</h3>
        <p className="mt-1 text-xs text-foreground-muted">{t("subtitle")}</p>
      </div>

      {canManageTeam && (
        <form onSubmit={handleInvite} className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <textarea
            name="emails"
            rows={2}
            placeholder={t("emailsPlaceholder")}
            className="min-h-16 rounded-md border border-border bg-surface-2 px-3 py-2 text-sm"
          />
          <select
            name="role"
            defaultValue="member"
            className="h-10 rounded-md border border-border bg-surface-2 px-3 text-sm"
          >
            {editableRoles.map((role) => (
              <option key={role} value={role}>
                {t(`roles.${role}`)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={isPending}
            className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {t("invite")}
          </button>
        </form>
      )}

      {notice && <p className="text-xs text-success">{notice}</p>}
      {error && <p className="text-xs text-error">{error}</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-foreground-muted">
            <tr>
              <th className="py-2 pr-3 font-medium">{t("member")}</th>
              <th className="py-2 pr-3 font-medium">{t("role")}</th>
              <th className="py-2 font-medium">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => {
              const isOwner = member.role === "owner";
              const numericId =
                typeof member.id === "number" ? member.id : Number.NaN;

              return (
                <tr key={member.id} className="border-t border-border">
                  <td className="py-2 pr-3">
                    <span className="block text-foreground-primary">
                      {displayName(member)}
                    </span>
                    <span className="text-foreground-muted">
                      {member.user.email}
                    </span>
                  </td>
                  <td className="py-2 pr-3">
                    {isOwner || !canManageTeam ? (
                      <span className="text-foreground-muted">
                        {t(`roles.${member.role}`)}
                      </span>
                    ) : (
                      <select
                        value={member.role}
                        disabled={isPending}
                        onChange={(event) =>
                          handleRoleChange(numericId, event.target.value)
                        }
                        className="rounded border border-border bg-surface-2 px-2 py-1"
                      >
                        {editableRoles.map((role) => (
                          <option key={role} value={role}>
                            {t(`roles.${role}`)}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="py-2">
                    {canManageTeam && !isOwner && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleRemove(numericId)}
                        className="rounded px-2 py-1 font-medium text-error hover:bg-error/10 disabled:opacity-50"
                      >
                        {t("remove")}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {canManageTeam && invitations.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-foreground-secondary">
            {t("pendingInvitations")}
          </h4>
          <div className="flex flex-col gap-2">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface-2 px-3 py-2 text-xs"
              >
                <span>
                  {invitation.email} · {t(`roles.${invitation.role}`)}
                </span>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleCancelInvitation(invitation.id)}
                  className="font-medium text-error hover:underline disabled:opacity-50"
                >
                  {t("cancelInvitation")}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
