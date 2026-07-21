import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { useCart } from "../hooks/useCart.js";
import { useListAddressesQuery } from "../store/api/usersApi.js";
import { useCreateOrderMutation } from "../store/api/ordersApi.js";
import { useGetSettingsQuery } from "../store/api/settingsApi.js";
import { PhoneInput } from "../components/PhoneInput.jsx";
import { FieldError } from "../components/FieldError.jsx";
import { getFieldErrors } from "../utils/formErrors.js";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const PAYMENT_METHODS = [
  { value: "COD", label: "Cash on delivery" },
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Credit / debit card" },
];

const DELIVERY_METHODS = [
  { value: "HOME_DELIVERY", label: "Home delivery" },
  { value: "PICKUP", label: "Pickup from store" },
];

export function CheckoutPage() {
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();

  const { data: addresses = [], isLoading: addressesLoading } = useListAddressesQuery();
  const { data: storeSettings } = useGetSettingsQuery();
  const [createOrder] = useCreateOrderMutation();

  const [selectedAddressIdOverride, setSelectedAddressIdOverride] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("HOME_DELIVERY");
  const [contactPhone, setContactPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const selectedAddressId = selectedAddressIdOverride || defaultAddress?.id || "";

  useEffect(() => {
    if (user?.phone) setContactPhone(user.phone);
  }, [user]);

  function handleDeliveryMethodChange(value) {
    setDeliveryMethod(value);
    setFieldErrors({});
  }

  async function handlePlaceOrder() {
    setError("");
    setFieldErrors({});

    if (deliveryMethod === "PICKUP" && !/^\d{10}$/.test(contactPhone)) {
      setFieldErrors({ contactPhone: "Enter a 10-digit phone number" });
      return;
    }

    setPlacing(true);
    try {
      const order = await createOrder({
        deliveryMethod,
        ...(deliveryMethod === "HOME_DELIVERY" ? { addressId: selectedAddressId } : { contactPhone }),
        paymentMethod,
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      }).unwrap();
      setPlacedOrder(order);
      clearCart();
    } catch (err) {
      setFieldErrors(getFieldErrors(err));
      setError(err.data?.error ?? "Could not place your order.");
    } finally {
      setPlacing(false);
    }
  }

  if (placedOrder) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-8 w-8 text-green-600" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-neutral-900">Order placed successfully!</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Order #{placedOrder.id.slice(0, 8).toUpperCase()} — {currency.format(placedOrder.total)} —{" "}
          {placedOrder.isPaid ? "paid" : placedOrder.deliveryMethod === "PICKUP" ? "pay at pickup" : "pay on delivery"}
        </p>
        {placedOrder.deliveryMethod === "PICKUP" && (
          <p className="mt-1 text-sm text-neutral-500">We'll notify you when it's ready for pickup at the store.</p>
        )}
        <Link to="/products" className="mt-8 inline-block rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800">
          Continue shopping
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
        <p className="text-neutral-500">Your cart is empty.</p>
        <Link to="/products" className="mt-4 inline-block text-sm font-medium text-neutral-900 underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-neutral-900">Checkout</h1>

      <section className="mt-8 rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-base font-semibold text-neutral-900">Order summary</h2>
        <ul className="mt-4 divide-y divide-neutral-100">
          {items.map(({ product, quantity }) => (
            <li key={product.id} className="flex items-center justify-between py-3 text-sm">
              <span className="text-neutral-700">
                {product.name} <span className="text-neutral-400">× {quantity}</span>
              </span>
              <span className="font-medium text-neutral-900">{currency.format(product.price * quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 space-y-1 border-t border-neutral-200 pt-4 text-sm">
          <div className="flex justify-between text-neutral-500">
            <span>Subtotal</span>
            <span>{currency.format(totalPrice)}</span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span>Shipping</span>
            <span>Free</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-neutral-900">
            <span>Total</span>
            <span>{currency.format(totalPrice)}</span>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-base font-semibold text-neutral-900">Contact details</h2>
        <dl className="mt-3 space-y-1 text-sm text-neutral-600">
          <div className="flex gap-2">
            <dt className="font-medium text-neutral-900">Name:</dt>
            <dd>{[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-neutral-900">Email:</dt>
            <dd>{user?.email}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-neutral-900">Phone:</dt>
            <dd>{user?.phone ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-base font-semibold text-neutral-900">How would you like to get your order?</h2>
        <div className="mt-4 space-y-3">
          {DELIVERY_METHODS.map((method) => (
            <label
              key={method.value}
              className={`flex items-center gap-3 rounded-md border p-4 text-sm ${
                deliveryMethod === method.value ? "border-neutral-900" : "border-neutral-200"
              }`}
            >
              <input
                type="radio"
                name="deliveryMethod"
                checked={deliveryMethod === method.value}
                onChange={() => handleDeliveryMethodChange(method.value)}
              />
              {method.label}
            </label>
          ))}
        </div>
      </section>

      {deliveryMethod === "HOME_DELIVERY" ? (
        <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-neutral-900">Delivery address</h2>
            <Link to="/account" className="text-sm font-medium text-neutral-900 underline">
              Manage addresses
            </Link>
          </div>

          {addressesLoading ? (
            <p className="mt-3 text-sm text-neutral-500">Loading...</p>
          ) : addresses.length === 0 ? (
            <p className="mt-3 text-sm text-amber-600">
              You don't have a saved address yet. <Link to="/account" className="underline">Add one</Link> to continue.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className={`block cursor-pointer rounded-md border p-4 text-sm ${
                    selectedAddressId === address.id ? "border-neutral-900" : "border-neutral-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    className="sr-only"
                    checked={selectedAddressId === address.id}
                    onChange={() => setSelectedAddressIdOverride(address.id)}
                  />
                  {address.label && <p className="font-medium text-neutral-900">{address.label}</p>}
                  <p className="text-neutral-700">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""}
                  </p>
                  <p className="text-neutral-700">
                    {address.city}, {address.state} {address.postalCode}, India
                  </p>
                  <p className="text-neutral-500">{address.phone}</p>
                </label>
              ))}
            </div>
          )}
          <FieldError message={fieldErrors.addressId} />
        </section>
      ) : (
        <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-base font-semibold text-neutral-900">Pickup details</h2>
          {storeSettings?.addressLine1 && (
            <div className="mt-3 text-sm text-neutral-600">
              <p className="font-medium text-neutral-900">Pickup location</p>
              <p>
                {storeSettings.addressLine1}
                {storeSettings.addressLine2 ? `, ${storeSettings.addressLine2}` : ""}
              </p>
              <p>
                {[storeSettings.city, storeSettings.state, storeSettings.postalCode].filter(Boolean).join(", ")}, India
              </p>
            </div>
          )}

          <div className="mt-4">
            <label className="block text-sm font-medium text-neutral-700">Contact email</label>
            <input
              value={user?.email ?? ""}
              disabled
              className="mt-1 w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500"
            />
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-neutral-700">Contact phone</label>
            <PhoneInput value={contactPhone} onChange={setContactPhone} required hasError={!!fieldErrors.contactPhone} />
            <FieldError message={fieldErrors.contactPhone} />
          </div>
        </section>
      )}

      <section className="mt-6 rounded-lg border border-neutral-200 bg-white p-6">
        <h2 className="text-base font-semibold text-neutral-900">Payment method</h2>
        <div className="mt-4 space-y-3">
          {PAYMENT_METHODS.map((method) => (
            <label
              key={method.value}
              className={`flex items-center gap-3 rounded-md border p-4 text-sm ${
                paymentMethod === method.value ? "border-neutral-900" : "border-neutral-200"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                checked={paymentMethod === method.value}
                onChange={() => setPaymentMethod(method.value)}
              />
              {method.label}
            </label>
          ))}
        </div>
      </section>

      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      <button
        onClick={handlePlaceOrder}
        disabled={
          placing ||
          (deliveryMethod === "HOME_DELIVERY" ? !selectedAddressId : !/^\d{10}$/.test(contactPhone))
        }
        className="mt-6 w-full rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
      >
        {placing ? "Placing order..." : `Place order — ${currency.format(totalPrice)}`}
      </button>
    </div>
  );
}
