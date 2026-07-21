export function PhoneInput({ value, onChange, required, hasError }) {
  return (
    <div
      className={`mt-1 flex overflow-hidden rounded-md border ${hasError ? "border-red-400" : "border-neutral-300"}`}
    >
      <span className="flex items-center gap-1.5 border-r border-neutral-300 bg-neutral-50 px-3 text-sm text-neutral-600">
        <span aria-hidden="true">🇮🇳</span> +91
      </span>
      <input
        type="tel"
        inputMode="numeric"
        required={required}
        maxLength={10}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
        className="w-full min-w-0 flex-1 px-3 py-2 text-sm focus:outline-none"
      />
    </div>
  );
}
