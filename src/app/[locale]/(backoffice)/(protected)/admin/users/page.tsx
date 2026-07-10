import { getTranslations } from "next-intl/server";
import { fetchAdminUsers, type UserStatus } from "@/lib/adminApi";
import UserStatusActions from "@/components/admin/UserStatusActions";
import ImpersonateButton from "@/components/admin/ImpersonateButton";
import { getAdminKbisUrl } from "@/lib/env";

const STATUS_FILTERS: Array<{ key: UserStatus | "all"; label: string }> = [
  { key: "all", label: "filterAll" },
  { key: "pending", label: "filterPending" },
  { key: "validated", label: "filterValidated" },
  { key: "rejected", label: "filterRejected" },
];

const STATUS_BADGE: Record<UserStatus, string> = {
  pending: "bg-warning/10 text-warning",
  validated: "bg-success/10 text-success",
  rejected: "bg-error/10 text-error",
};

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const t = await getTranslations("Admin.users");
  const { status } = await searchParams;

  const validStatus = ["pending", "validated", "rejected"].includes(status ?? "")
    ? (status as UserStatus)
    : undefined;

  const users = await fetchAdminUsers(validStatus);

  return (
    <div className="flex flex-1 flex-col px-6 py-8 max-w-6xl mx-auto w-full">
      <h1 className="text-2xl font-semibold mb-6">{t("title")}</h1>

      <div className="flex gap-2 mb-6">
        {STATUS_FILTERS.map(({ key, label }) => {
          const active = key === "all" ? !validStatus : validStatus === key;
          return (
            <a
              key={key}
              href={key === "all" ? "?" : `?status=${key}`}
              className={`rounded-full px-4 py-1 text-sm font-medium border transition-colors ${
                active
                  ? "bg-primary text-white border-primary"
                  : "border-border text-muted hover:bg-surface-2"
              }`}
            >
              {t(label)}
            </a>
          );
        })}
      </div>

      {users.length === 0 ? (
        <p className="text-muted text-sm">{t("noUsers")}</p>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">{t("colCompany")}</th>
                <th className="px-4 py-3 font-medium">{t("colEmail")}</th>
                <th className="px-4 py-3 font-medium">{t("colPhone")}</th>
                <th className="px-4 py-3 font-medium text-center whitespace-nowrap">{t("colKbis")}</th>
                <th className="px-4 py-3 font-medium text-center">{t("colStatus")}</th>
                <th className="px-4 py-3 font-medium">{t("colRole")}</th>
                <th className="px-4 py-3 font-medium">{t("colActions")}</th>
                <th className="px-4 py-3 font-medium">{t("colImpersonate")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => {
                const kbisUrl = user.kbisDocument ? getAdminKbisUrl(user.id) : null;

                return (
                <tr key={user.id} className="hover:bg-surface-2/50">
                  <td className="px-4 py-3 font-medium">
                    {user.companyName ?? "—"}
                    {user.websiteUrl && (
                      <a
                        href={user.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-xs text-muted hover:text-primary"
                      >
                        ↗
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted">{user.email}</td>
                  <td className="px-4 py-3 text-muted">{user.contactPhone ?? "—"}</td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    {kbisUrl ? (
                      <a
                        href={kbisUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={t("kbisViewTitle")}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-primary hover:bg-surface-2"
                      >
                        {t("kbisView")}
                        <span aria-hidden="true">↗</span>
                      </a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS_BADGE[user.status]}`}
                    >
                      {t(`status_${user.status}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{user.role}</td>
                  <td className="px-4 py-3">
                    <UserStatusActions userId={user.id} currentStatus={user.status} role={user.role} />
                  </td>
                  <td className="px-4 py-3">
                    {user.status === "validated" && user.role !== "Admin" && (
                      <ImpersonateButton userId={user.id} />
                    )}
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
