"use client";

import { useActionState, useState } from "react";
// NOTE: Server Action lives in app/contact/actions.ts (use server).
import { submitContact } from "@/app/contact/actions";

export default function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, undefined);
  const [showError, setShowError] = useState(false);

  return (
    <form action={action} className="space-y-5" noValidate>
      {/* Honeypot: hidden from humans, traps bots. */}
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="company">Company (leave blank)</label>
        <input id="company" name="company" type="text" autoComplete="off" tabIndex={-1} />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-semibold">
          Name <span className="text-red-600" aria-hidden="true">*</span>
        </label>
        <input
          id="name"
          name="name"
          required
          minLength={2}
          maxLength={120}
          autoComplete="name"
          className="mt-1.5 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3"
          placeholder="Jane Doe"
          aria-describedby={state?.errors?.name ? "err-name" : undefined}
        />
        {state?.errors?.name && (
          <p id="err-name" role="alert" className="mt-1 text-sm text-red-600">
            {state.errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-semibold">
          Email <span className="text-red-600" aria-hidden="true">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1.5 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3"
          placeholder="jane@example.com"
          aria-describedby={state?.errors?.email ? "err-email" : undefined}
        />
        {state?.errors?.email && (
          <p id="err-email" role="alert" className="mt-1 text-sm text-red-600">
            {state.errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-semibold">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          maxLength={200}
          className="mt-1.5 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3"
          placeholder="Benchmark correction"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-semibold">
          Message <span className="text-red-600" aria-hidden="true">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={6}
          className="mt-1.5 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2"
          placeholder="Tell us what you'd like to see covered (or corrected)…"
          aria-describedby={state?.errors?.message ? "err-msg" : undefined}
        />
        {state?.errors?.message && (
          <p id="err-msg" role="alert" className="mt-1 text-sm text-red-600">
            {state.errors.message}
          </p>
        )}
      </div>

      {state?.success && (
        <p role="status" className="rounded-md border border-green-300 bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
          ✓ Message sent. We&apos;ll reply within 1–3 business days.
        </p>
      )}
      {state?.error && (
        <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-[44px] items-center rounded-md bg-[var(--accent)] px-6 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
      <span className="block text-xs text-[var(--muted)]">
        We never sell your data. See{" "}
        <a href="/privacy-policy" className="underline">
          Privacy Policy
        </a>
        .
      </span>
    </form>
  );
}
