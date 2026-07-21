const PAYMENT_METHOD_LABELS = {
  COD: "COD",
  UPI: "UPI",
  UPI_PERSONAL: "UPI (Personal)",
  CARD: "Card",
  CASH: "Cash",
};

export function paymentMethodLabel(method) {
  return PAYMENT_METHOD_LABELS[method] ?? method;
}
