"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "../lib/supabase";
import { getUserDisplayName, internalRoleLabels } from "../lib/auth";
import type { InternalRole } from "../types/database";
import { getEventIdFromPathname, getEventRoute } from "../lib/routes";

type AppShellProps = {
  children: React.ReactNode;
  title?: string;
  requireAuth?: boolean;
};

function getNavigation(eventId: string | null) {
  return [
    { href: "/dashboard", label: "Dashboard", active: true },
    { href: "/events", label: "Eventos", active: true },
    {
      href: eventId ? getEventRoute(eventId, "guests") : "/events",
      label: "Invitados",
      active: true,
    },
    {
      href: eventId ? getEventRoute(eventId, "tickets") : "/events",
      label: "Entradas",
      active: true,
    },
    {
      href: eventId ? getEventRoute(eventId, "checkin") : "/events",
      label: "Check-in",
      active: true,
    },
    {
      href: eventId ? getEventRoute(eventId, "payments") : "/events",
      label: "Pagos",
      active: true,
    },
    { href: "#", label: "Produccion", active: false },
    { href: "#", label: "Stock", active: false },
    {
      href: eventId ? getEventRoute(eventId, "reports") : "/events",
      label: "Reportes",
      active: true,
    },
  ];
}

export function AppShell({
  children,
  title = "Tribu Platform",
  requireAuth = true,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const eventId = getEventIdFromPathname(pathname);
  const navigation = getNavigation(eventId);
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<InternalRole | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(requireAuth);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile(userId: string) {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (isMounted && data?.role) {
        setRole(data.role as InternalRole);
      }
    }

    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user ?? null;

      if (!isMounted) {
        return;
      }

      if (requireAuth && !sessionUser) {
        router.replace("/login");
        return;
      }

      setUser(sessionUser);
      if (sessionUser) {
        await loadProfile(sessionUser.id);
      }
      setIsCheckingSession(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (requireAuth && !sessionUser) {
        router.replace("/login");
      }

      if (sessionUser) {
        loadProfile(sessionUser.id);
      } else {
        setRole(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [requireAuth, router, supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (isCheckingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-white">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-zinc-300">
          Cargando sesion...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl">
        <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-zinc-950/95 px-4 py-5 lg:block">
          <Link href="/dashboard" className="block rounded-xl bg-white/[0.04] p-4">
            <p className="text-sm font-medium text-emerald-300">Tribu</p>
            <p className="mt-1 text-xl font-semibold">Platform</p>
          </Link>

          <nav className="mt-6 space-y-1">
            {navigation.map((item) =>
              item.active ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`block rounded-lg px-3 py-3 text-sm font-semibold transition ${
                    pathname === item.href || pathname.startsWith(`${item.href}/`)
                      ? "bg-emerald-400 text-zinc-950"
                      : "text-zinc-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg px-3 py-3 text-sm font-semibold text-zinc-600"
                >
                  {item.label}
                  <span className="text-xs font-medium">Pronto</span>
                </div>
              )
            )}
          </nav>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/90 px-4 py-3 backdrop-blur sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                  {title}
                </p>
                <p className="text-sm text-zinc-400">
                  {getUserDisplayName(user)}
                  {role ? ` · ${internalRoleLabels[role]}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="min-h-10 rounded-lg border border-white/10 px-4 text-sm font-semibold text-zinc-100 transition hover:bg-white/5"
              >
                Salir
              </button>
            </div>
          </header>

          <div className="w-full px-4 py-5 sm:px-6 lg:px-8">{children}</div>
        </section>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-zinc-950/95 px-3 py-2 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
          {navigation.slice(0, 4).map((item) =>
            item.active ? (
              <Link
                key={item.label}
                href={item.href}
                className={`rounded-lg px-2 py-2 text-center text-xs font-semibold ${
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? "bg-emerald-400 text-zinc-950"
                    : "text-zinc-400"
                }`}
              >
                {item.label}
              </Link>
            ) : (
              <div
                key={item.label}
                className="rounded-lg px-2 py-2 text-center text-xs font-semibold text-zinc-600"
              >
                {item.label}
              </div>
            )
          )}
        </div>
      </nav>
    </main>
  );
}
