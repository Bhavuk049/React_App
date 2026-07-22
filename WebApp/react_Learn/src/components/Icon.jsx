export function Icon({ path, className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={`shrink-0 ${className}`}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

export function SectionHeading({ icon, children, iconClassName = "bg-indigo-50 text-indigo-600" }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`flex h-7 w-7 items-center justify-center rounded-md ${iconClassName}`}>
        <Icon path={icon} className="h-4 w-4" />
      </span>
      <h2 className="text-sm font-semibold text-neutral-900">{children}</h2>
    </div>
  );
}
