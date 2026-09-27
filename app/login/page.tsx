"use client";

import { Droplets } from "lucide-react";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/hooks/use-login";

function LoginForm() {
  const { form, mutation, errorMessage, onSubmit } = useLogin();
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          placeholder="admin@blivap.com"
          {...register("email")}
        />
        {errors.email ? (
          <p className="mt-1 text-xs text-[var(--danger)]">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
        />
        {errors.password ? (
          <p className="mt-1 text-xs text-[var(--danger)]">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      {errorMessage ? (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {errorMessage}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--sidebar)] px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 20% 20%, rgba(180,35,24,0.35), transparent), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(255,255,255,0.06), transparent)",
        }}
      />
      <div className="relative w-full max-w-md rounded-xl border border-white/10 bg-white p-8 shadow-2xl shadow-black/30">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand)] text-white">
            <Droplets className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-[var(--ink)]">
              Blivap Admin
            </h1>
            <p className="text-sm text-[var(--ink-muted)]">
              Sign in with your admin credentials
            </p>
          </div>
        </div>
        <Suspense
          fallback={<p className="text-sm text-[var(--ink-muted)]">Loading…</p>}
        >
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
