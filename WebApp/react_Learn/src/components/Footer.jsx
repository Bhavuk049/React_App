import { Link } from "react-router-dom";
import { useGetSettingsQuery } from "../store/api/settingsApi.js";
import { useListLegalPagesQuery } from "../store/api/legalPagesApi.js";
import { Icon } from "./Icon.jsx";
import { ICON_PATHS } from "../utils/iconPaths.js";

export function Footer() {
  const { data: settings } = useGetSettingsQuery();
  const { data: legalPages = [] } = useListLegalPagesQuery();

  const addressLines = [settings?.addressLine1, settings?.addressLine2].filter(Boolean);
  const cityLine = [settings?.city, settings?.state, settings?.postalCode].filter(Boolean).join(", ");

  return (
    <footer className="border-t border-rose-100 bg-rose-50">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:grid-cols-3 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-2">
          <img src="/logo.webp" alt="TheUniqPick" className="h-20 w-auto" />
          <p className="font-display text-lg font-semibold text-neutral-900">TheUniqPick</p>
          <p className="text-sm text-neutral-500">Everyday essentials, uniquely picked. 💕</p>
        </div>

        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-rose-600">Quick links</h3>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600">
            {legalPages.map((page) => (
              <li key={page.slug}>
                <Link to={`/${page.slug}`} className="hover:text-rose-600">
                  {page.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-rose-600">Get in touch</h3>
          <ul className="mt-3 space-y-2.5 text-sm text-neutral-600">
            {(addressLines.length > 0 || cityLine) && (
              <li className="flex items-start gap-2">
                <Icon path={ICON_PATHS.mapPin} className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                <span>
                  {addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                  {cityLine && <span className="block">{cityLine}</span>}
                </span>
              </li>
            )}
            {settings?.supportPhone && (
              <li className="flex items-center gap-2">
                <Icon path={ICON_PATHS.phone} className="h-4 w-4 shrink-0 text-rose-400" />
                <a href={`tel:+91${settings.supportPhone}`} className="hover:text-rose-600">
                  +91 {settings.supportPhone}
                </a>
              </li>
            )}
            {settings?.supportEmail && (
              <li className="flex items-center gap-2">
                <Icon path={ICON_PATHS.mail} className="h-4 w-4 shrink-0 text-rose-400" />
                <a href={`mailto:${settings.supportEmail}`} className="hover:text-rose-600">
                  {settings.supportEmail}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-rose-100 py-4 text-center text-xs text-neutral-500">
        &copy; {new Date().getFullYear()} TheUniqPick. All rights reserved.
      </div>
    </footer>
  );
}
