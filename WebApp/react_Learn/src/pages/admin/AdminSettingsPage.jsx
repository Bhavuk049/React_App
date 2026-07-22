import { useState } from "react";
import { useGetSettingsQuery, useUpdateSettingsMutation } from "../../store/api/settingsApi.js";
import { useLazyLookupPincodeQuery } from "../../store/api/usersApi.js";
import { useAdminListLegalPagesQuery, useAdminUpdateLegalPageMutation } from "../../store/api/legalPagesApi.js";
import { INDIAN_STATES } from "../../utils/indianStates.js";
import { PhoneInput } from "../../components/PhoneInput.jsx";
import { FieldError } from "../../components/FieldError.jsx";
import { getFieldErrors } from "../../utils/formErrors.js";
import { Icon, SectionHeading } from "../../components/Icon.jsx";
import { RichTextEditor } from "../../components/RichTextEditor.jsx";
import { ICON_PATHS } from "../../utils/iconPaths.js";

const emptyForm = {
  supportPhone: "",
  supportEmail: "",
  gstNumber: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  promoBarEnabled: true,
  promoBarMessages: [],
};

export function AdminSettingsPage() {
  const { data: settings, isLoading: loading } = useGetSettingsQuery();
  const [updateSettings] = useUpdateSettingsMutation();
  const [triggerLookupPincode] = useLazyLookupPincodeQuery();
  const { data: legalPages = [] } = useAdminListLegalPagesQuery();
  const [updateLegalPage] = useAdminUpdateLegalPageMutation();

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [pincodeStatus, setPincodeStatus] = useState("");
  const [loadedSettings, setLoadedSettings] = useState(null);

  const [editingPage, setEditingPage] = useState(null);
  const [pageTitle, setPageTitle] = useState("");
  const [pageContent, setPageContent] = useState("");
  const [pageError, setPageError] = useState("");
  const [pageSaving, setPageSaving] = useState(false);

  if (settings && settings !== loadedSettings) {
    setLoadedSettings(settings);
    setForm({
      supportPhone: settings.supportPhone ?? "",
      supportEmail: settings.supportEmail ?? "",
      gstNumber: settings.gstNumber ?? "",
      addressLine1: settings.addressLine1 ?? "",
      addressLine2: settings.addressLine2 ?? "",
      city: settings.city ?? "",
      state: settings.state ?? "",
      postalCode: settings.postalCode ?? "",
      promoBarEnabled: settings.promoBarEnabled ?? true,
      promoBarMessages: settings.promoBarMessages ?? [],
    });
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  function addPromoMessage() {
    setForm((prev) => ({ ...prev, promoBarMessages: [...prev.promoBarMessages, ""] }));
  }

  function updatePromoMessage(index, value) {
    setForm((prev) => ({
      ...prev,
      promoBarMessages: prev.promoBarMessages.map((m, i) => (i === index ? value : m)),
    }));
  }

  function removePromoMessage(index) {
    setForm((prev) => ({
      ...prev,
      promoBarMessages: prev.promoBarMessages.filter((_, i) => i !== index),
    }));
  }

  async function handlePostalCodeChange(value) {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 6);
    updateField("postalCode", digitsOnly);

    if (digitsOnly.length === 6) {
      setPincodeStatus("looking-up");
      try {
        const { state, city } = await triggerLookupPincode(digitsOnly).unwrap();
        setForm((prev) => ({ ...prev, state, city }));
        setPincodeStatus("found");
      } catch {
        setPincodeStatus("not-found");
      }
    } else {
      setPincodeStatus("");
    }
  }

  function startEditLegalPage(page) {
    setEditingPage(page);
    setPageTitle(page.title);
    setPageContent(page.content);
    setPageError("");
  }

  async function handleLegalPageSubmit(e) {
    e.preventDefault();
    setPageError("");
    setPageSaving(true);
    try {
      await updateLegalPage({
        slug: editingPage.slug,
        payload: { title: pageTitle, content: pageContent },
      }).unwrap();
      setEditingPage(null);
    } catch (err) {
      setPageError(err.data?.error ?? "Failed to save page.");
    } finally {
      setPageSaving(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSaved(false);

    if (form.supportPhone && form.supportPhone.length !== 10) {
      setFieldErrors({ supportPhone: "Enter a 10-digit phone number" });
      return;
    }
    if (form.postalCode && form.postalCode.length !== 6) {
      setFieldErrors({ postalCode: "PIN code must be 6 digits" });
      return;
    }

    setSaving(true);
    try {
      const updated = await updateSettings({
        ...form,
        promoBarMessages: form.promoBarMessages.map((m) => m.trim()).filter(Boolean),
      }).unwrap();
      setForm({
        supportPhone: updated.supportPhone ?? "",
        supportEmail: updated.supportEmail ?? "",
        gstNumber: updated.gstNumber ?? "",
        addressLine1: updated.addressLine1 ?? "",
        addressLine2: updated.addressLine2 ?? "",
        city: updated.city ?? "",
        state: updated.state ?? "",
        postalCode: updated.postalCode ?? "",
        promoBarEnabled: updated.promoBarEnabled ?? true,
        promoBarMessages: updated.promoBarMessages ?? [],
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      const errors = getFieldErrors(err);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
      } else {
        setError(err.data?.error ?? "Failed to save settings.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-neutral-500">Loading...</p>;
  }

  const addressLines = [form.addressLine1, form.addressLine2].filter(Boolean);
  const cityLine = [form.city, form.state, form.postalCode].filter(Boolean).join(", ");

  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <Icon path={ICON_PATHS.settings} className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Store settings</h1>
          <p className="text-sm text-neutral-500">
            Support contact details, GST number, and shop address shown to customers.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-lg border border-neutral-200 bg-white p-6">
            <SectionHeading icon={ICON_PATHS.idCard} iconClassName="bg-sky-50 text-sky-600">
              Support contact
            </SectionHeading>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-neutral-700">Support phone</label>
                <PhoneInput
                  value={form.supportPhone}
                  onChange={(phone) => updateField("supportPhone", phone)}
                  hasError={Boolean(fieldErrors.supportPhone)}
                />
                <FieldError message={fieldErrors.supportPhone} />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Support email</label>
                <input
                  type="email"
                  value={form.supportEmail}
                  onChange={(e) => updateField("supportEmail", e.target.value)}
                  className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 ${
                    fieldErrors.supportEmail ? "border-red-400" : "border-neutral-300"
                  }`}
                />
                <FieldError message={fieldErrors.supportEmail} />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-6">
            <SectionHeading icon={ICON_PATHS.tag} iconClassName="bg-amber-50 text-amber-600">
              Shop address
            </SectionHeading>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-neutral-700">Address line 1</label>
                <input
                  value={form.addressLine1}
                  onChange={(e) => updateField("addressLine1", e.target.value)}
                  className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 ${
                    fieldErrors.addressLine1 ? "border-red-400" : "border-neutral-300"
                  }`}
                />
                <FieldError message={fieldErrors.addressLine1} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-neutral-700">Address line 2 (optional)</label>
                <input
                  value={form.addressLine2}
                  onChange={(e) => updateField("addressLine2", e.target.value)}
                  className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 ${
                    fieldErrors.addressLine2 ? "border-red-400" : "border-neutral-300"
                  }`}
                />
                <FieldError message={fieldErrors.addressLine2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">PIN code</label>
                <input
                  inputMode="numeric"
                  value={form.postalCode}
                  onChange={(e) => handlePostalCodeChange(e.target.value)}
                  className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 ${
                    fieldErrors.postalCode ? "border-red-400" : "border-neutral-300"
                  }`}
                />
                <FieldError message={fieldErrors.postalCode} />
                {pincodeStatus === "looking-up" && <p className="mt-1 text-xs text-neutral-500">Looking up...</p>}
                {pincodeStatus === "found" && <p className="mt-1 text-xs text-green-600">State and city auto-filled.</p>}
                {pincodeStatus === "not-found" && (
                  <p className="mt-1 text-xs text-amber-600">Couldn't find that PIN code — enter state/city manually.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Country</label>
                <input
                  disabled
                  value="India"
                  className="mt-1 w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">State</label>
                <select
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 ${
                    fieldErrors.state ? "border-red-400" : "border-neutral-300"
                  }`}
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                <FieldError message={fieldErrors.state} />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">City</label>
                <input
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  className={`mt-1 w-full rounded-md border px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 ${
                    fieldErrors.city ? "border-red-400" : "border-neutral-300"
                  }`}
                />
                <FieldError message={fieldErrors.city} />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <SectionHeading icon={ICON_PATHS.megaphone} iconClassName="bg-rose-50 text-rose-600">
                Promo bar
              </SectionHeading>
              <label className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={form.promoBarEnabled}
                  onChange={(e) => updateField("promoBarEnabled", e.target.checked)}
                />
                Show on storefront
              </label>
            </div>
            <p className="mt-1 text-sm text-neutral-500">
              Rotating announcement strip shown above the header. Add one or more messages.
            </p>

            <div className="mt-4 space-y-2">
              {form.promoBarMessages.map((message, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    value={message}
                    onChange={(e) => updatePromoMessage(index, e.target.value)}
                    placeholder="e.g. Free shipping on all orders"
                    maxLength={200}
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={() => removePromoMessage(index)}
                    aria-label="Remove message"
                    className="rounded-md p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Icon path={ICON_PATHS.trash} className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {form.promoBarMessages.length < 10 && (
              <button
                type="button"
                onClick={addPromoMessage}
                className="mt-3 flex items-center gap-1.5 text-sm font-medium text-rose-600 hover:text-rose-800"
              >
                <Icon path={ICON_PATHS.plusCircle} className="h-4 w-4" />
                Add message
              </button>
            )}

            {form.promoBarMessages.length === 0 && (
              <p className="mt-3 text-xs text-neutral-400">
                No messages yet — the promo bar is hidden on the storefront until you add at least one.
              </p>
            )}
          </section>
        </div>

        <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <section className="rounded-lg border border-neutral-200 bg-white p-4">
            <SectionHeading icon={ICON_PATHS.receipt} iconClassName="bg-violet-50 text-violet-600">
              GST
            </SectionHeading>
            <div className="mt-3">
              <label className="block text-sm font-medium text-neutral-700">GSTIN</label>
              <input
                placeholder="e.g. 29ABCDE1234F1Z5"
                value={form.gstNumber}
                onChange={(e) => updateField("gstNumber", e.target.value.toUpperCase())}
                maxLength={15}
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm uppercase focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 ${
                  fieldErrors.gstNumber ? "border-red-400" : "border-neutral-300"
                }`}
              />
              <FieldError message={fieldErrors.gstNumber} />
            </div>
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-4">
            <SectionHeading icon={ICON_PATHS.info} iconClassName="bg-sky-50 text-sky-600">
              Preview
            </SectionHeading>
            <p className="mt-1 text-xs text-neutral-400">How this appears to customers</p>
            <div className="mt-3 space-y-1.5 text-sm text-neutral-600">
              <p className="font-medium text-neutral-900">{form.supportPhone || form.supportEmail ? "Contact" : "—"}</p>
              {form.supportPhone && <p>+91 {form.supportPhone}</p>}
              {form.supportEmail && <p>{form.supportEmail}</p>}
              {form.gstNumber && (
                <p className="pt-2 text-xs text-neutral-500">
                  GSTIN: <span className="font-medium text-neutral-700">{form.gstNumber}</span>
                </p>
              )}
              {(addressLines.length > 0 || cityLine) && (
                <div className="pt-2">
                  {addressLines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                  {cityLine && <p>{cityLine}, India</p>}
                </div>
              )}
              {!form.supportPhone && !form.supportEmail && addressLines.length === 0 && !cityLine && (
                <p className="text-neutral-400">Nothing filled in yet.</p>
              )}
            </div>
          </section>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
            >
              {!saving && <Icon path={ICON_PATHS.check} className="h-4 w-4" />}
              {saving ? "Saving..." : "Save changes"}
            </button>
            {saved && <span className="text-sm text-green-600">Saved.</span>}
          </div>
        </div>
      </form>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
        <SectionHeading icon={ICON_PATHS.info} iconClassName="bg-violet-50 text-violet-600">
          Legal pages
        </SectionHeading>
        <p className="mt-1 text-sm text-neutral-500">
          Content shown to customers on the storefront footer. Select a page to update it.
        </p>
        <ul className="mt-4 divide-y divide-neutral-100">
          {legalPages.map((page) => (
            <li key={page.slug} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-neutral-900">{page.title}</p>
                <p className="text-xs text-neutral-400">/{page.slug}</p>
              </div>
              <button
                type="button"
                onClick={() => startEditLegalPage(page)}
                className="flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
              >
                <Icon path={ICON_PATHS.edit} className="h-3.5 w-3.5" />
                Edit
              </button>
            </li>
          ))}
        </ul>
      </section>

      {editingPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8">
          <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <Icon path={ICON_PATHS.edit} className="h-4 w-4" />
                </span>
                <h2 className="text-lg font-semibold text-neutral-900">Edit {editingPage.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingPage(null)}
                aria-label="Close"
                className="rounded p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <Icon path={ICON_PATHS.close} className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleLegalPageSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700">Title</label>
                <input
                  required
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Content</label>
                <div className="mt-1">
                  <RichTextEditor value={pageContent} onChange={setPageContent} resetKey={editingPage?.slug} />
                </div>
                <p className="mt-1 text-xs text-neutral-400">
                  Use the toolbar to bold, italicize, underline, or add lists and links.
                </p>
              </div>

              {pageError && <p className="text-sm text-red-600">{pageError}</p>}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={pageSaving}
                  className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
                >
                  {!pageSaving && <Icon path={ICON_PATHS.check} className="h-4 w-4" />}
                  {pageSaving ? "Saving..." : "Save changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPage(null)}
                  className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
