"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/login/actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-semibold">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className="mt-1.5 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3"
          placeholder="admin@example.com"
        />
        {state?.errors?.email && (
          <p role="alert" className="mt-1 text-sm text-red-600">
            {state.errors.email}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-semibold">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
          className="mt-1.5 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3"
        />
        {state?.errors?.password && (
          <p role="alert" className="mt-1 text-sm text-red-600">
            {state.errors.password}
          </p>
        )}
      </div>

      {state?.error && (
        <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="min-h-[44px] w-full rounded-md bg-[var(--accent)] text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-xs text-[var(--muted)]">
        10 attempts per 15 minutes per IP. Multiple failures lock that IP temporarily.
      </p>
    </form>
  );
}
