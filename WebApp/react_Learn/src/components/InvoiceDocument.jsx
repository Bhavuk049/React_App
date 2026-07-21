import { paymentMethodLabel } from "../utils/paymentMethods.js";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

// The stored unit price is always the final amount actually charged for that line,
// regardless of how the product's GST was configured (inclusive/exclusive) at the time —
// so for invoicing we back-calculate the tax portion out of that charged total. This stays
// accurate to what the customer paid without needing to touch order totals.
function getLineBreakdown(item) {
  const lineTotal = Number(item.price) * item.quantity;
  const rate = Number(item.gstRate);
  if (rate <= 0) {
    return { taxable: lineTotal, gst: 0, lineTotal };
  }
  const taxable = lineTotal / (1 + rate / 100);
  return { taxable, gst: lineTotal - taxable, lineTotal };
}

export function InvoiceDocument({ order, settings, customer }) {
  const breakdowns = order.items.map(getLineBreakdown);
  const totalTaxable = breakdowns.reduce((sum, b) => sum + b.taxable, 0);
  const totalGst = breakdowns.reduce((sum, b) => sum + b.gst, 0);

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-sm text-neutral-800">
      <div className="flex items-start justify-between border-b border-neutral-300 pb-6">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">TheUniqPick</h1>
          {settings?.addressLine1 && (
            <p className="mt-1 text-neutral-600">
              {settings.addressLine1}
              {settings.addressLine2 ? `, ${settings.addressLine2}` : ""}
            </p>
          )}
          {(settings?.city || settings?.state || settings?.postalCode) && (
            <p className="text-neutral-600">
              {[settings.city, settings.state, settings.postalCode].filter(Boolean).join(", ")}, India
            </p>
          )}
          {settings?.supportPhone && <p className="text-neutral-600">Phone: +91 {settings.supportPhone}</p>}
          {settings?.supportEmail && <p className="text-neutral-600">Email: {settings.supportEmail}</p>}
          {settings?.gstNumber && <p className="mt-1 font-medium text-neutral-700">GSTIN: {settings.gstNumber}</p>}
        </div>
        <div className="text-right">
          <h2 className="text-lg font-semibold text-neutral-900">Invoice</h2>
          <p className="mt-1 text-neutral-600">Order #{order.id.slice(0, 8).toUpperCase()}</p>
          <p className="text-neutral-600">
            {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "long" })}
          </p>
          <p className="text-neutral-600">Payment: {paymentMethodLabel(order.paymentMethod)}</p>
          <p className="text-neutral-600">{order.isPaid ? "Paid" : "Payment pending"}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-neutral-900">Billed to</h3>
          <p className="mt-1 text-neutral-600">{customer.name}</p>
          {customer.phone && <p className="text-neutral-600">+91 {customer.phone}</p>}
          {customer.email && <p className="text-neutral-600">{customer.email}</p>}
        </div>
        <div>
          <h3 className="font-semibold text-neutral-900">
            {order.deliveryMethod === "PICKUP" ? "Pickup from store" : "Delivery address"}
          </h3>
          {order.deliveryMethod === "PICKUP" ? (
            <p className="mt-1 text-neutral-600">Contact phone: +91 {order.contactPhone}</p>
          ) : order.address ? (
            <>
              <p className="mt-1 text-neutral-600">
                {order.address.line1}
                {order.address.line2 ? `, ${order.address.line2}` : ""}
              </p>
              <p className="text-neutral-600">
                {order.address.city}, {order.address.state} {order.address.postalCode}, India
              </p>
              <p className="text-neutral-600">+91 {order.address.phone}</p>
            </>
          ) : (
            <p className="mt-1 text-neutral-600">In-store purchase — no delivery.</p>
          )}
        </div>
      </div>

      <table className="mt-8 w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-neutral-300 text-neutral-500">
            <th className="py-2 font-medium">Item</th>
            <th className="py-2 text-right font-medium">Qty</th>
            <th className="py-2 text-right font-medium">Rate</th>
            <th className="py-2 text-right font-medium">Taxable value</th>
            <th className="py-2 text-right font-medium">GST</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, index) => {
            const { taxable, gst, lineTotal } = breakdowns[index];
            return (
              <tr key={item.id} className="border-b border-neutral-100">
                <td className="py-2 text-neutral-900">{item.name}</td>
                <td className="py-2 text-right text-neutral-600">{item.quantity}</td>
                <td className="py-2 text-right text-neutral-600">{currency.format(item.price)}</td>
                <td className="py-2 text-right text-neutral-600">{currency.format(taxable)}</td>
                <td className="py-2 text-right text-neutral-600">
                  {Number(item.gstRate)}% ({currency.format(gst)})
                </td>
                <td className="py-2 text-right font-medium text-neutral-900">{currency.format(lineTotal)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end">
        <div className="w-64 space-y-1">
          <div className="flex justify-between text-neutral-600">
            <span>Taxable value</span>
            <span>{currency.format(totalTaxable)}</span>
          </div>
          <div className="flex justify-between text-neutral-600">
            <span>Total GST</span>
            <span>{currency.format(totalGst)}</span>
          </div>
          <div className="flex justify-between text-neutral-600">
            <span>Shipping</span>
            <span>{Number(order.shippingFee) === 0 ? "Free" : currency.format(order.shippingFee)}</span>
          </div>
          <div className="flex justify-between border-t border-neutral-300 pt-1 text-base font-semibold text-neutral-900">
            <span>Grand total</span>
            <span>{currency.format(order.total)}</span>
          </div>
        </div>
      </div>

      <p className="mt-10 text-center text-xs text-neutral-400">
        This is a computer-generated invoice and does not require a signature.
      </p>
    </div>
  );
}
