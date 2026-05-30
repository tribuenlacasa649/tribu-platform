"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function redirectIfLoggedIn() {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        router.replace("/dashboard");
      }
    }

    redirectIfLoggedIn();
  }, [router, supabase]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const { error: requestError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsLoading(false);

    if (requestError) {
      setError(requestError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-8 text-white">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30 sm:p-7">
        <div className="mb-8">
          <p className="text-sm font-semibold text-emerald-300">Tribu Platform</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Iniciar sesion
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Acceso interno para produccion de eventos.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-zinc-200">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-h-12 w-full rounded-lg border border-white/10 bg-zinc-950 px-4 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              placeholder="usuario@tribu.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-zinc-200">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-h-12 w-full rounded-lg border border-white/10 bg-zinc-950 px-4 text-base text-white outline-none transition placeholder:text-zinc-600 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              placeholder="Tu password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="min-h-12 w-full rounded-lg bg-emerald-400 px-5 text-base font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Ingresando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
