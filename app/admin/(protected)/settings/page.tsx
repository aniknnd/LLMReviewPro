import type { Metadata } from "next";
import { getAllSettings } from "@/lib/queries";
import { saveSetting } from "./actions";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const settings: Record<string, string> = await getAllSettings().catch(() => ({} as Record<string, string>));
  const adsEnabled = settings.ads_enabled ?? "true";

  return (
    <div>
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Key-value settings stored in the DB (overrides env where safe).
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="ads-heading" className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <h2 id="ads-heading" className="font-bold">Ads (AdSense)</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Global toggle. When off, no ad slots render and the AdSense script never loads.
          </p>
          <form action={async (formData: FormData) => { "use server"; await saveSetting("ads_enabled", String(formData.get("ads_enabled") || "")); }} className="mt-4 space-y-3">
            <div>
              <label htmlFor="ads_enabled" className="block text-sm font-semibold">ads_enabled</label>
              <select id="ads_enabled" name="ads_enabled" defaultValue={adsEnabled} className="mt-1 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3">
                <option value="true">true — show ads (after consent)</option>
                <option value="false">false — hide ads everywhere</option>
              </select>
            </div>
            <button type="submit" className="min-h-[44px] w-full rounded-md bg-[var(--accent)] text-sm font-semibold text-white">
              Save
            </button>
          </form>
          <p className="mt-3 text-xs text-[var(--muted)]">
            Publisher ID &amp; verification come from env:{" "}
            <code>NEXT_PUBLIC_ADSENSE_PUB_ID</code> · <code>NEXT_PUBLIC_ADSENSE_VERIFICATION</code>
          </p>
        </section>

        <section aria-labelledby="site-heading" className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <h2 id="site-heading" className="font-bold">Site identity</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-[var(--muted)]">Name</dt><dd className="font-medium">{site.name}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--muted)]">URL</dt><dd className="font-medium">{site.url}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--muted)]">Ads (env)</dt><dd className="font-medium">{site.adsEnabled ? "on" : "off"}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--muted)]">Publisher ID set?</dt><dd className="font-medium">{site.adsensePublisherId ? "yes" : "no"}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-[var(--muted)]">
            Change site URL/name in <code>.env</code> and restart PM2. See <code>.env.example</code>.
          </p>
        </section>
      </div>

      <section aria-labelledby="all-heading" className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
        <h2 id="all-heading" className="font-bold">All settings</h2>
        <form action={async (formData: FormData) => { "use server"; await saveSetting(String(formData.get("key") || ""), String(formData.get("value") || "")); }} className="mt-3 flex flex-wrap gap-2">
          <input name="key" required placeholder="key" className="min-h-[44px] rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm" />
          <input name="value" placeholder="value" className="min-h-[44px] flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm" />
          <button type="submit" className="min-h-[44px] rounded-md border border-[var(--border)] px-4 text-sm font-medium">Save key</button>
        </form>
        <table className="mt-4 w-full text-sm">
          <thead className="text-left text-[var(--muted)]">
            <tr><th className="py-2">Key</th><th className="py-2">Value</th></tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {Object.entries(settings).map(([k, v]) => (
              <tr key={k}>
                <td className="py-2 font-mono text-xs">{k}</td>
                <td className="py-2">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
