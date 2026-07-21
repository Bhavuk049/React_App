import { useState } from "react";
import { useGetSettingsQuery, useUpdateSettingsMutation } from "../../store/api/settingsApi.js";
import { useLazyLookupPincodeQuery } from "../../store/api/usersApi.js";
import { INDIAN_STATES } from "../../utils/indianStates.js";
import { PhoneInput } from "../../components/PhoneInput.jsx";
import { FieldError } from "../../components/FieldError.jsx";
import { getFieldErrors } from "../../utils/formErrors.js";

const emptyForm = {
  supportPhone: "",
  supportEmail: "",
  gstNumber: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
};

export function AdminSettingsPage() {
  const { data: settings, isLoading: loading } = useGetSettingsQuery();
  const [updateSettings] = useUpdateSettingsMutation();
  const [triggerLookupPincode] = useLazyLookupPincodeQuery();

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [pincodeStatus, setPincodeStatus] = useState("");
  const [loadedSettings, setLoadedSettings] = useState(null);

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
    });
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
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
      const updated = await updateSettings(form).unwrap();
      setForm({
        supportPhone: updated.supportPhone ?? "",
        supportEmail: updated.supportEmail ?? "",
        gstNumber: updated.gstNumber ?? "",
        addressLine1: updated.addressLine1 ?? "",
        addressLine2: updated.addressLine2 ?? "",
        city: updated.city ?? "",
        state: updated.state ?? "",
        postalCode: updated.postalCode ?? "",
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

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Store settings</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Support contact details, GST number, and shop address shown to customers.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-8">
        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-base font-semibold text-neutral-900">Support contact</h2>
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
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                  fieldErrors.supportEmail ? "border-red-400" : "border-neutral-300"
                }`}
              />
              <FieldError message={fieldErrors.supportEmail} />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-base font-semibold text-neutral-900">GST</h2>
          <div className="mt-4">
            <label className="block text-sm font-medium text-neutral-700">GSTIN</label>
            <input
              placeholder="e.g. 29ABCDE1234F1Z5"
              value={form.gstNumber}
              onChange={(e) => updateField("gstNumber", e.target.value.toUpperCase())}
              maxLength={15}
              className={`mt-1 w-full max-w-xs rounded-md border px-3 py-2 text-sm uppercase ${
                fieldErrors.gstNumber ? "border-red-400" : "border-neutral-300"
              }`}
            />
            <FieldError message={fieldErrors.gstNumber} />
          </div>
        </section>

        <section className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-base font-semibold text-neutral-900">Shop address</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-neutral-700">Address line 1</label>
              <input
                value={form.addressLine1}
                onChange={(e) => updateField("addressLine1", e.target.value)}
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
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
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
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
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
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
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
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
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                  fieldErrors.city ? "border-red-400" : "border-neutral-300"
                }`}
              />
              <FieldError message={fieldErrors.city} />
            </div>
          </div>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-400"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
          {saved && <span className="text-sm text-green-600">Saved.</span>}
        </div>
      </form>
    </div>
  );
}
