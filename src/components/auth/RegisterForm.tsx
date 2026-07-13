"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { API_BASE_URL } from "@/lib/env";

const TOTAL_STEPS = 3;

const formStepClassName = "flex min-h-[34rem] flex-col space-y-6";

const inputClassName =
  "w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm";

const labelClassName = "block text-sm font-medium text-foreground-secondary";

const fieldClassName = "space-y-1.5";

const PHONE_COUNTRY_CODES = [
  { value: "+33", label: "+33" }
] as const;

const initialFormData = {
  firstname: "",
  lastname: "",
  email: "",
  password: "",
  phoneCountryCode: "+33",
  contactPhone: "",
  companyName: "",
  websiteUrl: "",
  acceptTerms: false,
};

type FormData = typeof initialFormData;

interface Props {
  invitationToken?: string | null;
}

function formatContactPhone(countryCode: string, localNumber: string) {
  const digits = localNumber.replace(/\D/g, "");
  const normalized = digits.startsWith("0") ? digits.slice(1) : digits;
  return `${countryCode}${normalized}`;
}

function isValidEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email);
}

function isValidWebsiteUrl(url: string) {
  return /^https?:\/\/.+/.test(url);
}

async function readApiError(response: Response) {
  try {
    const body = await response.json();
    return body?.error?.message;
  } catch {
    return null;
  }
}

export default function RegisterForm({ invitationToken = null }: Props) {
  const t = useTranslations("Auth.register");
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [kbisFile, setKbisFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [stepError, setStepError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value, type } = event.target;
    if (!(name in initialFormData)) return;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (event.target as HTMLInputElement).checked
          : (value ?? ""),
    }));
    setStepError("");
  }

  function handleKbisChange(event: ChangeEvent<HTMLInputElement>) {
    setKbisFile(event.target.files?.[0] ?? null);
    setStepError("");
  }

  function validateStep(step: number): boolean {
    if (step === 1) {
      if (
        !formData.firstname.trim() ||
        !formData.lastname.trim() ||
        !formData.email.trim()
      ) {
        setStepError(t("errorStep"));
        return false;
      }
      if (!isValidEmail(formData.email)) {
        setStepError(t("errorInvalidEmail"));
        return false;
      }
      if (formData.password.length < 8) {
        setStepError(t("errorPassword"));
        return false;
      }
      const digits = formData.contactPhone.replace(/\D/g, "");
      if (digits.length < 6) {
        setStepError(t("errorStep"));
        return false;
      }
    }

    if (step === 2) {
      if (!formData.companyName.trim() || !formData.websiteUrl.trim()) {
        setStepError(t("errorStep"));
        return false;
      }
      if (!isValidWebsiteUrl(formData.websiteUrl.trim())) {
        setStepError(t("errorInvalidUrl"));
        return false;
      }
      if (!kbisFile || kbisFile.type !== "application/pdf") {
        setStepError(t("errorKbis"));
        return false;
      }
    }

    if (step === 3 && !formData.acceptTerms) {
      setStepError(t("errorTerms"));
      return false;
    }

    return true;
  }

  function handleNextStep() {
    if (!validateStep(currentStep)) return;
    setStepError("");
    setCurrentStep(currentStep + 1);
  }

  function handlePrevStep() {
    setStepError("");
    setError("");
    setCurrentStep(currentStep - 1);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateStep(3) || !kbisFile) return;

    setError("");
    setIsSubmitting(true);

    const contactPhone = formatContactPhone(
      formData.phoneCountryCode,
      formData.contactPhone,
    );

    try {
      const uploadData = new FormData();
      uploadData.append("kbis", kbisFile);

      const uploadResponse = await fetch(`${API_BASE_URL}/auth/kbis`, {
        method: "POST",
        body: uploadData,
      });

      if (!uploadResponse.ok) {
        setError(t("errorKbis"));
        return;
      }

      const { kbisDocument } = (await uploadResponse.json()) as {
        kbisDocument: string;
      };

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname: formData.firstname,
          lastname: formData.lastname,
          email: formData.email,
          password: formData.password,
          contactPhone,
          companyName: formData.companyName.trim(),
          websiteUrl: formData.websiteUrl.trim(),
          kbisDocument,
          ...(invitationToken ? { invitationToken } : {}),
        }),
      });

      if (response.status === 409) {
        setError(t("errorEmailUsed"));
        return;
      }

      if (!response.ok) {
        setError((await readApiError(response)) ?? t("error"));
        return;
      }

      const data = (await response.json()) as {
        invitationAccepted?: boolean;
        applicationId?: number;
      };

      if (data.invitationAccepted) {
        const redirectTo = data.applicationId
          ? `/applications/${data.applicationId}`
          : "/applications";
        router.replace(`/login?redirect=${encodeURIComponent(redirectTo)}`);
        return;
      }

      router.replace("/pending");
    } catch {
      setError(t("error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (currentStep === 1) {
    return (
      <form className={formStepClassName} onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-1">
          <h2 className="text-lg font-medium">{t("sectionIdentity")}</h2>
          <p className="text-sm text-foreground-muted">
            {t("stepOf", { current: currentStep, total: TOTAL_STEPS })}
          </p>
        </div>

        <div className="space-y-4">
          <div className={fieldClassName}>
            <label htmlFor="firstname" className={labelClassName}>
              {t("firstname")}
            </label>
            <input id="firstname" name="firstname" type="text" value={formData.firstname ?? ""} onChange={handleChange} placeholder={t("firstname")} required className={inputClassName}/>
          </div>

          <div className={fieldClassName}>
            <label htmlFor="lastname" className={labelClassName}>
              {t("lastname")}
            </label>
            <input id="lastname" name="lastname" type="text" value={formData.lastname ?? ""} onChange={handleChange} placeholder={t("lastname")} required className={inputClassName}/>
          </div>

          <div className={fieldClassName}>
            <label htmlFor="email" className={labelClassName}>
              {t("email")}
            </label>
            <input id="email" name="email" type="email" value={formData.email ?? ""} onChange={handleChange} placeholder={t("email")} required autoComplete="email" className={inputClassName}/>
          </div>

          <div className={fieldClassName}>
            <label htmlFor="password" className={labelClassName}>
              {t("password")}
            </label>
            <input id="password" name="password" type="password" value={formData.password ?? ""} onChange={handleChange} placeholder={t("password")} required minLength={8} autoComplete="new-password" className={inputClassName}/>
          </div>

          <div className={fieldClassName}>
            <label htmlFor="contactPhone" className={labelClassName}>
              {t("contactPhone")}
            </label>
            <div className="flex gap-2">
              <select id="phoneCountryCode" name="phoneCountryCode" value={formData.phoneCountryCode ?? "+33"} onChange={handleChange} aria-label={t("phoneCountryCode")} className="w-24 shrink-0 rounded-md border border-border bg-surface-2 px-2 py-2 text-sm">
                {PHONE_COUNTRY_CODES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <input id="contactPhone" name="contactPhone" type="tel" value={formData.contactPhone ?? ""} onChange={handleChange} placeholder={t("contactPhonePlaceholder")} required autoComplete="tel-national" inputMode="tel" className={`${inputClassName} min-w-0 flex-1`}/>
            </div>
          </div>
        </div>

        <div className="mt-auto space-y-4">
          {stepError && <p className="text-sm text-error">{stepError}</p>}

          <button type="button" onClick={handleNextStep} className="w-full rounded-md bg-primary py-2 text-sm font-medium text-white hover:bg-primary-hover">
            {t("next")}
          </button>
        </div>
      </form>
    );
  }

  if (currentStep === 2) {
    return (
      <form className={formStepClassName} onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-1">
          <h2 className="text-lg font-medium">{t("sectionKbis")}</h2>
          <p className="text-sm text-foreground-muted">
            {t("stepOf", { current: currentStep, total: TOTAL_STEPS })}
          </p>
        </div>

        <p className="text-sm text-foreground-secondary">{t("kbisStepIntro")}</p>

        <div className="space-y-4">
          <div className={fieldClassName}>
            <label htmlFor="companyName" className={labelClassName}>
              {t("companyName")}
            </label>
            <input
              id="companyName"
              name="companyName"
              type="text"
              value={formData.companyName ?? ""}
              onChange={handleChange}
              placeholder={t("companyName")}
              required
              className={inputClassName}
            />
          </div>

          <div className={fieldClassName}>
            <label htmlFor="websiteUrl" className={labelClassName}>
              {t("websiteUrl")}
            </label>
            <input
              id="websiteUrl"
              name="websiteUrl"
              type="url"
              value={formData.websiteUrl ?? ""}
              onChange={handleChange}
              placeholder={t("websiteUrlPlaceholder")}
              required
              className={inputClassName}
            />
          </div>

          <div className={fieldClassName}>
            <label htmlFor="kbis" className={labelClassName}>
              {t("kbis")}
            </label>
            <input
              key="kbis-upload"
              id="kbis"
              name="kbis"
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleKbisChange}
              className={`${inputClassName} file:mr-3 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-medium file:text-white`}
            />
            <p className="text-xs text-foreground-muted">{t("kbisHint")}</p>
            {kbisFile && (
              <p className="text-xs text-foreground-secondary">
                {t("kbisSelected", { name: kbisFile.name })}
              </p>
            )}
          </div>
        </div>

        <div className="mt-auto space-y-4">
          {stepError && <p className="text-sm text-error">{stepError}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={handlePrevStep} className="flex-1 rounded-md border border-border py-2 text-sm font-medium hover:bg-surface-2">
              {t("previous")}
            </button>
            <button type="button" onClick={handleNextStep} className="flex-1 rounded-md bg-primary py-2 text-sm font-medium text-white hover:bg-primary-hover">
              {t("next")}
            </button>
          </div>
        </div>
      </form>
    );
  }

  if (currentStep === 3) {
    const contactPhone = formatContactPhone(
      formData.phoneCountryCode,
      formData.contactPhone,
    );

    const recap = [
      { label: t("firstname"), value: formData.firstname },
      { label: t("lastname"), value: formData.lastname },
      { label: t("email"), value: formData.email },
      { label: t("password"), value: t("passwordMasked") },
      { label: t("companyName"), value: formData.companyName },
      { label: t("websiteUrl"), value: formData.websiteUrl },
      {
        label: t("kbis"),
        value: kbisFile?.name ?? t("notProvided"),
      },
      { label: t("contactPhone"), value: contactPhone },
    ];

    return (
      <form className={formStepClassName} onSubmit={handleSubmit}>
        <div className="space-y-1">
          <h2 className="text-lg font-medium">{t("stepConfirmTitle")}</h2>
          <p className="text-sm text-foreground-muted">
            {t("stepOf", { current: currentStep, total: TOTAL_STEPS })}
          </p>
        </div>

        <p className="text-sm text-foreground-secondary">{t("confirmIntro")}</p>

        <div className="rounded-lg border border-border bg-surface-2 px-4 py-2">
          {recap.map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-4 border-b border-border py-2 text-sm last:border-0">
              <span className="text-foreground-secondary">{label}</span>
              <span className="text-right font-medium break-all">{value}</span>
            </div>
          ))}
        </div>

        <div className={fieldClassName}>
          <span className={labelClassName}>{t("acceptTermsLabel")}</span>
          <label className="flex items-start gap-3 rounded-md border border-border bg-surface-2 px-3 py-3 text-sm">
            <input
              id="acceptTerms"
              name="acceptTerms"
              type="checkbox"
              checked={formData.acceptTerms}
              onChange={handleChange}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border"
            />
            <span className="text-foreground-secondary">{t("acceptTerms")}</span>
          </label>
        </div>

        <div className="mt-auto space-y-4">
          {stepError && <p className="text-sm text-error">{stepError}</p>}
          {error && <p className="text-sm text-error">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={handlePrevStep} className="flex-1 rounded-md border border-border py-2 text-sm font-medium hover:bg-surface-2">
              {t("previous")}
            </button>
            <button type="submit" disabled={!formData.acceptTerms || isSubmitting} className="flex-1 rounded-md bg-primary py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50">
              {isSubmitting ? t("submitting") : t("submit")}
            </button>
          </div>
        </div>
      </form>
    );
  }

  return null;
}
