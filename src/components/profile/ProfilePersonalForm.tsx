"use client";

import { FormEvent, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { updateMe, type CurrentUser } from "@/lib/userApi";

interface Props {
  user: CurrentUser;
}

const PHONE_COUNTRY_CODES = [{ value: "+33", label: "+33" }] as const;

const inputClassName =
  "w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm";

function formatContactPhone(countryCode: string, localNumber: string) {
  const digits = localNumber.replace(/\D/g, "");
  const normalized = digits.startsWith("0") ? digits.slice(1) : digits;
  return `${countryCode}${normalized}`;
}

function parseContactPhone(phone: string | null): {
  countryCode: string;
  localNumber: string;
} {
  if (!phone) {
    return { countryCode: "+33", localNumber: "" };
  }

  for (const { value } of PHONE_COUNTRY_CODES) {
    if (phone.startsWith(value)) {
      return {
        countryCode: value,
        localNumber: phone.slice(value.length),
      };
    }
  }

  return { countryCode: "+33", localNumber: phone.replace(/\D/g, "") };
}

export default function ProfilePersonalForm({ user }: Props) {
  const t = useTranslations("Profile");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const initialPhone = parseContactPhone(user.contactPhone);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const firstname = String(formData.get("firstname") ?? "").trim() || null;
    const lastname = String(formData.get("lastname") ?? "").trim() || null;
    const email = String(formData.get("email") ?? "").trim();
    const phoneCountryCode = String(
      formData.get("phoneCountryCode") ?? "+33",
    ).trim();
    const localPhone = String(formData.get("contactPhone") ?? "").trim();

    if (!email) {
      setError(t("error"));
      return;
    }

    const digits = localPhone.replace(/\D/g, "");
    const contactPhone =
      digits.length > 0
        ? formatContactPhone(phoneCountryCode, localPhone)
        : null;

    const updated = await updateMe({
      firstname,
      lastname,
      email,
      contactPhone,
    });

    if (!updated) {
      setError(t("error"));
      return;
    }

    setSaved(true);
    startTransition(() => router.refresh());
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="profile-firstname"
            className="block text-sm font-medium text-foreground-muted mb-1"
          >
            {t("firstname")}
          </label>
          <input
            id="profile-firstname"
            name="firstname"
            type="text"
            defaultValue={user.firstname ?? ""}
            autoComplete="given-name"
            className={inputClassName}
          />
        </div>
        <div>
          <label
            htmlFor="profile-lastname"
            className="block text-sm font-medium text-foreground-muted mb-1"
          >
            {t("lastname")}
          </label>
          <input
            id="profile-lastname"
            name="lastname"
            type="text"
            defaultValue={user.lastname ?? ""}
            autoComplete="family-name"
            className={inputClassName}
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="profile-email"
          className="block text-sm font-medium text-foreground-muted mb-1"
        >
          {t("email")}
        </label>
        <input
          id="profile-email"
          name="email"
          type="email"
          defaultValue={user.email}
          required
          autoComplete="email"
          className={inputClassName}
        />
      </div>

      <div>
        <label
          htmlFor="profile-phone"
          className="block text-sm font-medium text-foreground-muted mb-1"
        >
          {t("phone")}
        </label>
        <div className="flex gap-2">
          <select
            id="profile-phone-country"
            name="phoneCountryCode"
            defaultValue={initialPhone.countryCode}
            aria-label={t("phoneCountryCode")}
            className="w-24 shrink-0 rounded-md border border-border bg-surface-2 px-2 py-2 text-sm"
          >
            {PHONE_COUNTRY_CODES.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <input
            id="profile-phone"
            name="contactPhone"
            type="tel"
            defaultValue={initialPhone.localNumber}
            placeholder={t("phonePlaceholder")}
            autoComplete="tel-national"
            inputMode="tel"
            className={`${inputClassName} min-w-0 flex-1`}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          {isPending ? t("saving") : t("save")}
        </button>
        {saved && <span className="text-xs text-success">{t("saved")}</span>}
        {error && <span className="text-xs text-error">{error}</span>}
      </div>
    </form>
  );
}
