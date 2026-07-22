import { useEffect, useMemo, useState } from "react";
import { useGetSettingsQuery } from "../store/api/settingsApi.js";
import { Icon } from "./Icon.jsx";
import { ICON_PATHS } from "../utils/iconPaths.js";

const NO_MESSAGES = [];

export function PromoBar() {
  const { data: settings, isLoading } = useGetSettingsQuery();
  const [index, setIndex] = useState(0);
  const messages = useMemo(() => settings?.promoBarMessages ?? NO_MESSAGES, [settings]);

  useEffect(() => {
    if (messages.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % messages.length), 4000);
    return () => clearInterval(timer);
  }, [messages]);

  if (isLoading || settings?.promoBarEnabled === false || messages.length === 0) return null;

  function go(delta) {
    setIndex((i) => (i + delta + messages.length) % messages.length);
  }

  return (
    <div className="flex items-center justify-center gap-3 overflow-hidden bg-rose-100 px-4 py-2 text-sm font-medium text-rose-700">
      <button onClick={() => go(-1)} aria-label="Previous message" className="text-rose-400 hover:text-rose-600">
        <Icon path={ICON_PATHS.chevronLeft} className="h-4 w-4" />
      </button>
      <span key={index % messages.length} className="animate-promo-fade">
        {messages[index % messages.length]}
      </span>
      <button onClick={() => go(1)} aria-label="Next message" className="text-rose-400 hover:text-rose-600">
        <Icon path={ICON_PATHS.chevronRight} className="h-4 w-4" />
      </button>
    </div>
  );
}
