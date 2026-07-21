import { useState } from "react";
import { useAuth } from "../hooks/useAuth.js";
import {
  useCreateAddressMutation,
  useDeleteAddressMutation,
  useLazyLookupPincodeQuery,
  useListAddressesQuery,
  useUpdateAddressMutation,
  useUpdateProfileMutation,
} from "../store/api/usersApi.js";
import { INDIAN_STATES } from "../utils/indianStates.js";
import { ConfirmModal } from "../components/ConfirmModal.jsx";
import { PhoneInput } from "../components/PhoneInput.jsx";
import { FieldError } from "../components/FieldError.jsx";
import { getFieldErrors } from "../utils/formErrors.js";

const emptyAddressForm = {
  label: "",
  line1: "",
  line2: "",
  postalCode: "",
  state: "",
  city: "",
  phone: "",
  isDefault: false,
};

export function AccountPage() {
  const { user, setCurrentUser } = useAuth();
  const { data: addresses = [] } = useListAddressesQuery();
  const [updateProfile] = useUpdateProfileMutation();
  const [createAddress] = useCreateAddressMutation();
  const [updateAddress] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  const [triggerLookupPincode] = useLazyLookupPincodeQuery();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
  });
  const [profileError, setProfileError] = useState("");
  const [profileFieldErrors, setProfileFieldErrors] = useState({});
  const [profileSaved, setProfileSaved] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [addressError, setAddressError] = useState("");
  const [addressFieldErrors, setAddressFieldErrors] = useState({});
  const [pincodeStatus, setPincodeStatus] = useState("");
  const [pendingDeleteAddress, setPendingDeleteAddress] = useState(null);

  function updateProfileField(field, value) {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
    setProfileFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  function startEditProfile() {
    setProfileForm({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      phone: user?.phone ?? "",
    });
    setProfileError("");
    setProfileFieldErrors({});
    setIsEditingProfile(true);
  }

  function cancelEditProfile() {
    setIsEditingProfile(false);
    setProfileError("");
    setProfileFieldErrors({});
  }

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileError("");
    setProfileFieldErrors({});
    setProfileSaved(false);

    if (profileForm.phone && profileForm.phone.length !== 10) {
      setProfileFieldErrors({ phone: "Enter a 10-digit phone number" });
      return;
    }

    setSavingProfile(true);
    try {
      const updated = await updateProfile(profileForm).unwrap();
      setCurrentUser(updated);
      setIsEditingProfile(false);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setProfileFieldErrors(fieldErrors);
      } else {
        setProfileError(err.data?.error ?? "Failed to save your details.");
      }
    } finally {
      setSavingProfile(false);
    }
  }

  function updateAddressField(field, value) {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
    setAddressFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  function startAddAddress() {
    setAddressForm(emptyAddressForm);
    setEditingAddressId(null);
    setShowAddressForm(true);
    setAddressError("");
    setAddressFieldErrors({});
  }

  function startEditAddress(address) {
    setAddressForm({
      label: address.label ?? "",
      line1: address.line1,
      line2: address.line2 ?? "",
      postalCode: address.postalCode,
      state: address.state,
      city: address.city,
      phone: address.phone,
      isDefault: address.isDefault,
    });
    setEditingAddressId(address.id);
    setShowAddressForm(true);
    setAddressError("");
    setAddressFieldErrors({});
  }

  async function handlePostalCodeChange(value) {
    const digitsOnly = value.replace(/\D/g, "").slice(0, 6);
    updateAddressField("postalCode", digitsOnly);

    if (digitsOnly.length === 6) {
      setPincodeStatus("looking-up");
      try {
        const { state, city } = await triggerLookupPincode(digitsOnly).unwrap();
        setAddressForm((prev) => ({ ...prev, state, city }));
        setPincodeStatus("found");
      } catch {
        setPincodeStatus("not-found");
      }
    } else {
      setPincodeStatus("");
    }
  }

  async function handleAddressSubmit(e) {
    e.preventDefault();
    setAddressError("");
    setAddressFieldErrors({});

    if (addressForm.phone.length !== 10) {
      setAddressFieldErrors({ phone: "Enter a 10-digit phone number" });
      return;
    }
    if (addressForm.postalCode.length !== 6) {
      setAddressFieldErrors({ postalCode: "PIN code must be 6 digits" });
      return;
    }

    try {
      if (editingAddressId) {
        await updateAddress({ id: editingAddressId, payload: addressForm }).unwrap();
      } else {
        await createAddress(addressForm).unwrap();
      }
      setShowAddressForm(false);
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setAddressFieldErrors(fieldErrors);
      } else {
        setAddressError(err.data?.error ?? "Failed to save address.");
      }
    }
  }

  async function confirmDeleteAddress() {
    const address = pendingDeleteAddress;
    setPendingDeleteAddress(null);
    await deleteAddress(address.id).unwrap();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-neutral-900">My account</h1>

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">Profile details</h2>
          <div className="flex items-center gap-3">
            {profileSaved && <span className="text-sm text-green-600">Saved.</span>}
            {!isEditingProfile && (
              <button
                onClick={startEditProfile}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {!isEditingProfile ? (
          <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="font-medium text-neutral-700">Email</dt>
              <dd className="mt-1 text-neutral-600">{user?.email}</dd>
            </div>
            <div>
              <dt className="font-medium text-neutral-700">Name</dt>
              <dd className="mt-1 text-neutral-600">
                {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-neutral-700">Phone number</dt>
              <dd className="mt-1 text-neutral-600">{user?.phone ? `🇮🇳 +91 ${user.phone}` : "—"}</dd>
            </div>
          </dl>
        ) : (
          <form onSubmit={handleProfileSubmit} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-neutral-700">Email</label>
              <input
                disabled
                value={user?.email ?? ""}
                className="mt-1 w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">First name</label>
              <input
                required
                autoFocus
                value={profileForm.firstName}
                onChange={(e) => updateProfileField("firstName", e.target.value)}
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                  profileFieldErrors.firstName ? "border-red-400" : "border-neutral-300"
                }`}
              />
              <FieldError message={profileFieldErrors.firstName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">Last name</label>
              <input
                value={profileForm.lastName}
                onChange={(e) => updateProfileField("lastName", e.target.value)}
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                  profileFieldErrors.lastName ? "border-red-400" : "border-neutral-300"
                }`}
              />
              <FieldError message={profileFieldErrors.lastName} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">Phone number</label>
              <PhoneInput
                value={profileForm.phone}
                onChange={(phone) => updateProfileField("phone", phone)}
                hasError={Boolean(profileFieldErrors.phone)}
              />
              <FieldError message={profileFieldErrors.phone} />
            </div>

            {profileError && <p className="text-sm text-red-600 sm:col-span-2">{profileError}</p>}

            <div className="flex gap-3 sm:col-span-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:bg-neutral-400"
              >
                {savingProfile ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                onClick={cancelEditProfile}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">Addresses</h2>
          <button
            onClick={startAddAddress}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Add address
          </button>
        </div>

        {addresses.length === 0 && !showAddressForm && (
          <p className="mt-4 text-sm text-amber-600">
            You haven't added an address yet. Add one so you can check out.
          </p>
        )}

        {showAddressForm && (
          <form onSubmit={handleAddressSubmit} className="mt-4 grid grid-cols-1 gap-4 rounded-md border border-neutral-200 p-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-neutral-700">Label (optional)</label>
              <input
                placeholder="Home, Work..."
                value={addressForm.label}
                onChange={(e) => updateAddressField("label", e.target.value)}
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                  addressFieldErrors.label ? "border-red-400" : "border-neutral-300"
                }`}
              />
              <FieldError message={addressFieldErrors.label} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">Phone</label>
              <PhoneInput
                required
                value={addressForm.phone}
                onChange={(phone) => updateAddressField("phone", phone)}
                hasError={Boolean(addressFieldErrors.phone)}
              />
              <FieldError message={addressFieldErrors.phone} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-neutral-700">Address line 1</label>
              <input
                required
                value={addressForm.line1}
                onChange={(e) => updateAddressField("line1", e.target.value)}
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                  addressFieldErrors.line1 ? "border-red-400" : "border-neutral-300"
                }`}
              />
              <FieldError message={addressFieldErrors.line1} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-neutral-700">Address line 2 (optional)</label>
              <input
                value={addressForm.line2}
                onChange={(e) => updateAddressField("line2", e.target.value)}
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                  addressFieldErrors.line2 ? "border-red-400" : "border-neutral-300"
                }`}
              />
              <FieldError message={addressFieldErrors.line2} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">PIN code</label>
              <input
                required
                inputMode="numeric"
                value={addressForm.postalCode}
                onChange={(e) => handlePostalCodeChange(e.target.value)}
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                  addressFieldErrors.postalCode ? "border-red-400" : "border-neutral-300"
                }`}
              />
              <FieldError message={addressFieldErrors.postalCode} />
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
                required
                value={addressForm.state}
                onChange={(e) => updateAddressField("state", e.target.value)}
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                  addressFieldErrors.state ? "border-red-400" : "border-neutral-300"
                }`}
              >
                <option value="" disabled>
                  Select state
                </option>
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              <FieldError message={addressFieldErrors.state} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">City</label>
              <input
                required
                value={addressForm.city}
                onChange={(e) => updateAddressField("city", e.target.value)}
                className={`mt-1 w-full rounded-md border px-3 py-2 text-sm ${
                  addressFieldErrors.city ? "border-red-400" : "border-neutral-300"
                }`}
              />
              <FieldError message={addressFieldErrors.city} />
            </div>

            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={addressForm.isDefault}
                onChange={(e) => updateAddressField("isDefault", e.target.checked)}
              />
              Set as default address
            </label>

            {addressError && <p className="text-sm text-red-600 sm:col-span-2">{addressError}</p>}

            <div className="flex gap-3 sm:col-span-2">
              <button type="submit" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
                {editingAddressId ? "Save changes" : "Add address"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddressForm(false)}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {addresses.length > 0 && (
          <div className="mt-4 space-y-3">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="flex items-start justify-between gap-4 rounded-md border border-neutral-200 p-4 transition-colors hover:border-neutral-300"
              >
                <div className="text-sm text-neutral-700">
                  <div className="flex flex-wrap items-center gap-2">
                    {address.label && <p className="font-medium text-neutral-900">{address.label}</p>}
                    {address.isDefault && (
                      <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-1">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}
                  </p>
                  <p>
                    {address.city}, {address.state} {address.postalCode}
                  </p>
                  <p>India</p>
                  <p className="text-neutral-500">🇮🇳 +91 {address.phone}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => startEditAddress(address)}
                    title="Edit"
                    aria-label="Edit address"
                    className="inline-flex rounded p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                      <path d="M13.586 3.586a2 2 0 0 1 2.828 2.828l-.793.793-2.828-2.828.793-.793ZM11.379 5.793 3 14.172V17h2.828l8.38-8.379-2.83-2.828Z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setPendingDeleteAddress(address)}
                    title="Delete"
                    aria-label="Delete address"
                    className="inline-flex rounded p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M8.75 1a.75.75 0 0 0-.75.75V2h-3.25a.75.75 0 0 0 0 1.5h.324l.667 11.35A2.25 2.25 0 0 0 7.986 17h4.028a2.25 2.25 0 0 0 2.245-2.15l.667-11.35h.324a.75.75 0 0 0 0-1.5H12v-.25a.75.75 0 0 0-.75-.75h-2.5ZM8.5 6.25a.75.75 0 0 1 1.5 0v7a.75.75 0 0 1-1.5 0v-7Zm3.5 0a.75.75 0 0 0-1.5 0v7a.75.75 0 0 0 1.5 0v-7Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmModal
        open={pendingDeleteAddress !== null}
        title="Delete this address?"
        message="This can't be undone."
        confirmLabel="Delete"
        danger
        onConfirm={confirmDeleteAddress}
        onCancel={() => setPendingDeleteAddress(null)}
      />
    </div>
  );
}
