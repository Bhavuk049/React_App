import { lazy, Suspense, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminListProductsQuery } from "../../store/api/productsApi.js";
import { useAdminListCategoriesQuery } from "../../store/api/categoriesApi.js";
import { useAdminListUsersQuery } from "../../store/api/usersApi.js";
import { useCreatePosSaleMutation } from "../../store/api/ordersApi.js";
import { resolveImageUrl } from "../../utils/images.js";
import { PhoneInput } from "../../components/PhoneInput.jsx";
import { paymentMethodLabel } from "../../utils/paymentMethods.js";

const BarcodeScannerModal = lazy(() =>
  import("../../components/BarcodeScannerModal.jsx").then((m) => ({ default: m.BarcodeScannerModal })),
);

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "UPI_PERSONAL", label: "UPI (Personal)" },
  { value: "CARD", label: "Card" },
];

const EMPTY_PRODUCTS = [];

export function AdminPosPage() {
  const { data: productsData } = useAdminListProductsQuery({ pageSize: 100 });
  const products = productsData?.products ?? EMPTY_PRODUCTS;
  const { data: categories = [] } = useAdminListCategoriesQuery();
  const { data: allUsers = [] } = useAdminListUsersQuery();
  const customers = useMemo(() => allUsers.filter((u) => u.role === "CUSTOMER"), [allUsers]);
  const [createPosSale] = useCreatePosSaleMutation();
  const [productSearch, setProductSearch] = useState("");
  const [cart, setCart] = useState([]); // [{ product, quantity }]
  const [showScanner, setShowScanner] = useState(false);
  const [scanError, setScanError] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [pickerCategory, setPickerCategory] = useState("");
  const [pickerSearch, setPickerSearch] = useState("");

  const [customerMode, setCustomerMode] = useState("guest"); // "guest" | "existing"
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [charges, setCharges] = useState([]); // [{ id, name, amount, gstRate }] custom cart charges
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountType, setDiscountType] = useState("FIXED"); // "FIXED" | "PERCENTAGE"
  const [discountValue, setDiscountValue] = useState("");
  const [showRoundOff, setShowRoundOff] = useState(false);
  const [roundOffDirection, setRoundOffDirection] = useState("ADD"); // "ADD" | "SUBTRACT"
  const [roundOffValue, setRoundOffValue] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);

  const pickerProducts = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory = !pickerCategory || p.categoryId === pickerCategory;
      const matchesSearch = !q || p.name.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [products, pickerCategory, pickerSearch]);

  const matchingProducts = useMemo(() => {
    if (!productSearch.trim()) return [];
    const q = productSearch.trim().toLowerCase();
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(q)))
      .slice(0, 8);
  }, [products, productSearch]);

  const matchingCustomers = useMemo(() => {
    if (!customerSearch.trim()) return [];
    const q = customerSearch.trim().toLowerCase();
    return customers
      .filter((c) => {
        const name = [c.firstName, c.lastName].filter(Boolean).join(" ").toLowerCase();
        return name.includes(q) || c.email.toLowerCase().includes(q) || (c.phone && c.phone.includes(q));
      })
      .slice(0, 8);
  }, [customers, customerSearch]);

  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
  const productsSubtotal = cart.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);
  const chargesSubtotal = charges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const subtotal = productsSubtotal + chargesSubtotal;

  const parsedDiscountValue = Number(discountValue) || 0;
  const rawDiscountAmount =
    discountType === "PERCENTAGE" ? (subtotal * parsedDiscountValue) / 100 : parsedDiscountValue;
  const discountAmount = showDiscount ? Math.max(0, Math.min(rawDiscountAmount, subtotal)) : 0;

  const parsedRoundOffValue = Math.max(0, Number(roundOffValue) || 0);
  const roundOffAmount = showRoundOff ? (roundOffDirection === "SUBTRACT" ? -parsedRoundOffValue : parsedRoundOffValue) : 0;

  const totalPrice = subtotal - discountAmount + roundOffAmount;

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) => (i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { product, quantity: 1 }];
    });
    setProductSearch("");
  }

  function updateQuantity(productId, quantity) {
    if (quantity < 1) {
      setCart((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setCart((prev) => prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i)));
  }

  function handleBarcodeDetected(code) {
    setShowScanner(false);
    const product = products.find((p) => p.barcode === code);
    if (!product) {
      setScanError(`No product found with barcode "${code}".`);
      return;
    }
    setScanError("");
    addToCart(product);
  }

  function addCharge() {
    setCharges((prev) => [
      ...prev,
      { id: prev.length ? Math.max(...prev.map((c) => c.id)) + 1 : 1, name: "Charge", amount: "", gstRate: "0" },
    ]);
  }

  function updateCharge(id, field, value) {
    setCharges((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }

  function removeCharge(id) {
    setCharges((prev) => prev.filter((c) => c.id !== id));
  }

  function selectCustomer(customer) {
    setSelectedCustomer(customer);
    setCustomerSearch("");
  }

  function resetSale() {
    setCart([]);
    setCharges([]);
    setCustomerMode("guest");
    setSelectedCustomer(null);
    setGuestName("");
    setGuestPhone("");
    setPaymentMethod("CASH");
    setShowDiscount(false);
    setDiscountType("FIXED");
    setDiscountValue("");
    setShowRoundOff(false);
    setRoundOffDirection("ADD");
    setRoundOffValue("");
    setError("");
    setCompletedSale(null);
  }

  async function handleCompleteSale() {
    setError("");
    if (cart.length === 0) {
      setError("Add at least one product to the sale.");
      return;
    }
    setSubmitting(true);
    try {
      const validCharges = charges
        .filter((c) => Number(c.amount) > 0)
        .map((c) => ({
          name: c.name.trim() || "Charge",
          amount: Number(c.amount) || 0,
          gstRate: Number(c.gstRate) || 0,
        }));

      const sale = await createPosSale({
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        paymentMethod,
        ...(validCharges.length > 0 ? { charges: validCharges } : {}),
        ...(discountAmount > 0 ? { discountType, discountValue: parsedDiscountValue } : {}),
        ...(showRoundOff && parsedRoundOffValue > 0 ? { roundOffAmount } : {}),
        ...(customerMode === "existing" && selectedCustomer
          ? { customerId: selectedCustomer.id }
          : { guestName, guestPhone }),
      }).unwrap();
      setCompletedSale(sale);
    } catch (err) {
      setError(err.data?.error ?? "Failed to complete sale.");
    } finally {
      setSubmitting(false);
    }
  }

  if (completedSale) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-8 w-8 text-green-600" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-semibold text-neutral-900">Sale complete!</h1>
        <p className="mt-2 text-sm text-neutral-500">
          #{completedSale.id.slice(0, 8).toUpperCase()} — {currency.format(completedSale.total)} —{" "}
          {paymentMethodLabel(completedSale.paymentMethod)}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            to={`/admin/orders/${completedSale.id}/print`}
            target="_blank"
            rel="noopener"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
          >
            Print / Download bill
          </Link>
          <button
            onClick={resetSale}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            New sale
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Point of sale</h1>
      <p className="mt-1 text-sm text-neutral-500">Record an in-store sale — stock updates immediately.</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-lg border border-neutral-200 bg-white p-6">
            <h2 className="text-base font-semibold text-neutral-900">Add products</h2>
            <div className="mt-3 flex gap-2">
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search by product name or barcode..."
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="shrink-0 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
              >
                Scan
              </button>
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="shrink-0 rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
              >
                Select item
              </button>
            </div>
            {scanError && <p className="mt-2 text-sm text-red-600">{scanError}</p>}

            {matchingProducts.length > 0 && (
              <div className="mt-3 divide-y divide-neutral-100 rounded-md border border-neutral-200">
                {matchingProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addToCart(product)}
                    className="flex w-full items-center gap-3 p-3 text-left hover:bg-neutral-50"
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-neutral-100">
                      <img src={resolveImageUrl(product.images?.[0])} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-neutral-900">{product.name}</p>
                      <p className="text-neutral-500">
                        {currency.format(product.price)} · {product.stock} in stock
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-neutral-900">Cart ({totalItems})</h2>
              <button
                type="button"
                onClick={addCharge}
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
              >
                + Add charge
              </button>
            </div>
            {cart.length === 0 && charges.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500">No items added yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-neutral-100">
                {cart.map(({ product, quantity }) => (
                  <li key={product.id} className="flex items-center gap-4 py-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-neutral-100">
                      <img src={resolveImageUrl(product.images?.[0])} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-medium text-neutral-900">{product.name}</p>
                      <p className="text-neutral-500">{currency.format(product.price)} each</p>
                    </div>
                    <div className="flex items-center rounded-md border border-neutral-200">
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="px-3 py-1.5 text-neutral-600 hover:text-neutral-900"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        disabled={quantity >= product.stock}
                        className="px-3 py-1.5 text-neutral-600 hover:text-neutral-900 disabled:cursor-not-allowed disabled:text-neutral-300"
                      >
                        +
                      </button>
                    </div>
                    <p className="w-20 text-right text-sm font-medium text-neutral-900">
                      {currency.format(product.price * quantity)}
                    </p>
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, 0)}
                      className="rounded-md p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove ${product.name}`}
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </li>
                ))}
                {charges.map((charge) => (
                  <li key={charge.id} className="flex flex-wrap items-center gap-2 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-neutral-100 text-sm font-semibold text-neutral-400">
                      ₹
                    </div>
                    <input
                      value={charge.name}
                      onChange={(e) => updateCharge(charge.id, "name", e.target.value)}
                      placeholder="Charge name"
                      className="min-w-[7rem] flex-1 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-neutral-400">Amount ₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={charge.amount}
                        onChange={(e) => updateCharge(charge.id, "amount", e.target.value)}
                        placeholder="0"
                        className="w-20 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={charge.gstRate}
                        onChange={(e) => updateCharge(charge.id, "gstRate", e.target.value)}
                        className="w-16 rounded-md border border-neutral-300 px-2 py-1.5 text-sm"
                      />
                      <span className="text-xs text-neutral-400">% tax (incl.)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCharge(charge.id)}
                      className="rounded-md p-1.5 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove ${charge.name || "charge"}`}
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
          <section className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-900">Customer</h2>
              <div className="flex gap-1 rounded-md bg-neutral-100 p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setCustomerMode("guest")}
                  className={`rounded px-2.5 py-1 ${
                    customerMode === "guest" ? "bg-neutral-900 text-white" : "text-neutral-600"
                  }`}
                >
                  Walk-in
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode("existing")}
                  className={`rounded px-2.5 py-1 ${
                    customerMode === "existing" ? "bg-neutral-900 text-white" : "text-neutral-600"
                  }`}
                >
                  Existing
                </button>
              </div>
            </div>

            {customerMode === "guest" ? (
              <div className="mt-3 space-y-2">
                <input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Name (optional)"
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
                <PhoneInput value={guestPhone} onChange={setGuestPhone} />
              </div>
            ) : (
              <div className="mt-3">
                {selectedCustomer ? (
                  <div className="flex items-center justify-between rounded-md border border-neutral-200 p-2 text-sm">
                    <div>
                      <p className="font-medium text-neutral-900">
                        {[selectedCustomer.firstName, selectedCustomer.lastName].filter(Boolean).join(" ") ||
                          selectedCustomer.email}
                      </p>
                      <p className="text-neutral-500">{selectedCustomer.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(null)}
                      className="text-sm text-neutral-400 hover:text-red-600"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="Search by name, email, or phone..."
                      className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                    />
                    {matchingCustomers.length > 0 && (
                      <div className="mt-2 max-h-40 divide-y divide-neutral-100 overflow-y-auto rounded-md border border-neutral-200">
                        {matchingCustomers.map((customer) => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => selectCustomer(customer)}
                            className="block w-full p-2 text-left text-sm hover:bg-neutral-50"
                          >
                            <p className="font-medium text-neutral-900">
                              {[customer.firstName, customer.lastName].filter(Boolean).join(" ") || customer.email}
                            </p>
                            <p className="text-neutral-500">{customer.email}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-neutral-900">Payment method</h2>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value)}
                  className={`rounded-md border px-3 py-2 text-sm font-medium ${
                    paymentMethod === method.value
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </section>

          {(!showDiscount || !showRoundOff) && (
            <div className="flex flex-wrap gap-2">
              {!showDiscount && (
                <button
                  type="button"
                  onClick={() => setShowDiscount(true)}
                  className="rounded-md border border-dashed border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:border-neutral-400 hover:text-neutral-900"
                >
                  + Add discount
                </button>
              )}
              {!showRoundOff && (
                <button
                  type="button"
                  onClick={() => setShowRoundOff(true)}
                  className="rounded-md border border-dashed border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:border-neutral-400 hover:text-neutral-900"
                >
                  + Add round off
                </button>
              )}
            </div>
          )}

          {showDiscount && (
            <section className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-900">Discount</h2>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 rounded-md bg-neutral-100 p-0.5 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setDiscountType("FIXED")}
                      className={`rounded px-2 py-0.5 ${
                        discountType === "FIXED" ? "bg-neutral-900 text-white" : "text-neutral-600"
                      }`}
                    >
                      ₹
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountType("PERCENTAGE")}
                      className={`rounded px-2 py-0.5 ${
                        discountType === "PERCENTAGE" ? "bg-neutral-900 text-white" : "text-neutral-600"
                      }`}
                    >
                      %
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDiscount(false);
                      setDiscountValue("");
                    }}
                    className="text-neutral-400 hover:text-red-600"
                    aria-label="Remove discount"
                  >
                    ×
                  </button>
                </div>
              </div>
              <input
                type="number"
                min="0"
                max={discountType === "PERCENTAGE" ? 100 : undefined}
                step="0.01"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "PERCENTAGE" ? "e.g. 10" : "e.g. 50"}
                className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
              />
            </section>
          )}

          {showRoundOff && (
            <section className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-900">Round off</h2>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 rounded-md bg-neutral-100 p-0.5 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setRoundOffDirection("ADD")}
                      className={`rounded px-2 py-0.5 ${
                        roundOffDirection === "ADD" ? "bg-neutral-900 text-white" : "text-neutral-600"
                      }`}
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoundOffDirection("SUBTRACT")}
                      className={`rounded px-2 py-0.5 ${
                        roundOffDirection === "SUBTRACT" ? "bg-neutral-900 text-white" : "text-neutral-600"
                      }`}
                    >
                      Subtract
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRoundOff(false);
                      setRoundOffValue("");
                    }}
                    className="text-neutral-400 hover:text-red-600"
                    aria-label="Remove round off"
                  >
                    ×
                  </button>
                </div>
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={roundOffValue}
                onChange={(e) => setRoundOffValue(e.target.value)}
                placeholder="e.g. 0.50"
                className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
              />
            </section>
          )}

          <section className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-neutral-500">
                <span>Items subtotal</span>
                <span>{currency.format(productsSubtotal)}</span>
              </div>
              {chargesSubtotal > 0 && (
                <div className="flex justify-between text-neutral-500">
                  <span>Charges</span>
                  <span>+{currency.format(chargesSubtotal)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount{discountType === "PERCENTAGE" ? ` (${parsedDiscountValue}%)` : ""}</span>
                  <span>-{currency.format(discountAmount)}</span>
                </div>
              )}
              {roundOffAmount !== 0 && (
                <div className="flex justify-between text-neutral-500">
                  <span>Round off</span>
                  <span>
                    {roundOffAmount > 0 ? "+" : "-"}
                    {currency.format(Math.abs(roundOffAmount))}
                  </span>
                </div>
              )}
            </div>
            <div className="mt-2 flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold text-neutral-900">
              <span>Total</span>
              <span>{currency.format(totalPrice)}</span>
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <button
              onClick={handleCompleteSale}
              disabled={submitting || cart.length === 0}
              className="mt-4 w-full rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
            >
              {submitting ? "Completing sale..." : "Complete sale"}
            </button>
          </section>
        </div>
      </div>

      {showScanner && (
        <Suspense fallback={null}>
          <BarcodeScannerModal onDetected={handleBarcodeDetected} onClose={() => setShowScanner(false)} />
        </Suspense>
      )}

      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-lg bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-neutral-900">Select products</h2>
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
              >
                Done
              </button>
            </div>

            <input
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              placeholder="Search products..."
              className="mt-4 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPickerCategory("")}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                  !pickerCategory
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                }`}
              >
                All
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setPickerCategory(c.id)}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                    pickerCategory === c.id
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="mt-4 flex-1 overflow-y-auto">
              {pickerProducts.length === 0 ? (
                <p className="py-8 text-center text-sm text-neutral-500">No products match.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {pickerProducts.map((product) => {
                    const inCart = cart.find((i) => i.product.id === product.id);
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => addToCart(product)}
                        disabled={product.stock === 0}
                        className="relative rounded-md border border-neutral-200 p-2 text-left hover:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <div className="aspect-square overflow-hidden rounded bg-neutral-100">
                          <img
                            src={resolveImageUrl(product.images?.[0])}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <p className="mt-1 truncate text-xs font-medium text-neutral-900">{product.name}</p>
                        <p className="text-xs text-neutral-500">
                          {currency.format(product.price)} · {product.stock === 0 ? "Out of stock" : `${product.stock} left`}
                        </p>
                        {inCart && (
                          <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-semibold text-white">
                            {inCart.quantity}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
