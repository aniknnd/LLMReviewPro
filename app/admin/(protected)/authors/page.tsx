import type { Metadata } from "next";
import { getAllAuthors } from "@/lib/queries";
import { saveAuthor, deleteAuthor } from "@/app/admin/taxonomy/actions";

export const metadata: Metadata = {
  title: "Authors",
  robots: { index: false, follow: false },
};

export default async function AdminAuthorsPage() {
  const authors = await getAllAuthors();

  return (
    <div>
      <h1 className="text-3xl font-bold">Authors</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Author pages build E-E-A-T (Person schema + bio).</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        <form
          action={async (formData: FormData) => {
            "use server";
            await saveAuthor({
              name: String(formData.get("name") || ""),
              title: String(formData.get("title") || "Contributor"),
              bio: String(formData.get("bio") || ""),
              bioMd: String(formData.get("bioMd") || ""),
              avatarUrl: String(formData.get("avatarUrl") || ""),
              twitter: String(formData.get("twitter") || ""),
              github: String(formData.get("github") || ""),
              linkedin: String(formData.get("linkedin") || ""),
              website: String(formData.get("website") || ""),
              expertise: String(formData.get("expertise") || ""),
              credentials: String(formData.get("credentials") || ""),
            });
          }}
          className="h-fit space-y-3 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5"
        >
          <h2 className="font-bold">New author</h2>
          {[
            ["name", "Full name", "text"],
            ["title", "Role / title", "text"],
            ["avatarUrl", "Avatar URL (https://… or blank)", "url"],
            ["twitter", "X / Twitter (@handle or URL)", "text"],
            ["github", "GitHub (handle or URL)", "text"],
            ["linkedin", "LinkedIn (handle or URL)", "text"],
            ["website", "Website (https://…)", "url"],
          ].map(([id, label, type]) => (
            <div key={id}>
              <label htmlFor={`a-${id}`} className="block text-sm font-semibold">{label}</label>
              <input id={`a-${id}`} name={id} type={type} required={id === "name"} className="mt-1 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3" />
            </div>
          ))}
          <div>
            <label htmlFor="a-bio" className="block text-sm font-semibold">Short bio (for cards/meta)</label>
            <textarea id="a-bio" name="bio" rows={2} className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2" />
          </div>
          <div>
            <label htmlFor="a-bioMd" className="block text-sm font-semibold">Long bio (Markdown)</label>
            <textarea id="a-bioMd" name="bioMd" rows={4} className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2" placeholder="Background, years, focus…" />
          </div>
          <div>
            <label htmlFor="a-expertise" className="block text-sm font-semibold">Expertise (comma-separated)</label>
            <input id="a-expertise" name="expertise" className="mt-1 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3" placeholder="LLM benchmarking, agents" />
          </div>
          <div>
            <label htmlFor="a-credentials" className="block text-sm font-semibold">Credentials</label>
            <input id="a-credentials" name="credentials" className="mt-1 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3" placeholder="ex-Google, PhD CS" />
          </div>
          <button type="submit" className="min-h-[44px] w-full rounded-md bg-[var(--accent)] text-sm font-semibold text-white">
            Create author
          </button>
        </form>

        <div className="grid gap-4 sm:grid-cols-2">
          {authors.map((a) => (
            <article key={a.id} className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
              <h2 className="font-bold">
                {a.name} <span className="font-normal text-[var(--muted)]">/author/{a.slug}</span>
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{a.title}</p>
              <p className="mt-2 text-sm">{a.bio}</p>
              <form action={async () => { "use server"; await deleteAuthor(a.id); }} className="mt-3">
                <button type="submit" className="text-sm text-red-600 hover:underline">Delete (if no posts)</button>
              </form>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
