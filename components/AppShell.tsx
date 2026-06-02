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

type NavItem = {
  href: string;
  label: string;
  short: string;
  active: boolean;
};

function getNavigation(eventId: string | null): NavItem[] {
  return [
    { href: "/dashboard", label: "Inicio", short: "Inicio", active: true },
    {
      href: eventId ? getEventRoute(eventId, "guests") : "/events",
      label: "Participantes",
      short: "Personas",
      active: true,
    },
    {
      href: eventId ? getEventRoute(eventId, "checkin") : "/events",
      label: "Scanner QR",
      short: "Scan",
      active: true,
    },
    {
      href: eventId ? getEventRoute(eventId, "reports") : "/events",
      label: "Reportes",
      short: "Stats",
      active: true,
    },
    { href: "/events", label: "Eventos", short: "Eventos", active: true },
    { href: "/community", label: "Comunidad", short: "CRM", active: true },
    { href: "/recipes", label: "Recetario", short: "Cocina", active: true },
  ];
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
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
      <main className="flex min-h-screen items-center justify-center bg-[#F6F1E8] px-4 text-[#18251A]">
        <div className="tribu-card rounded-[1.5rem] px-5 py-4 text-sm font-semibold">
          Cargando sesion...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F6F1E8] text-[#18251A]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl">
        <aside className="hidden w-64 shrink-0 px-4 py-5 lg:block">
          <Link href="/dashboard" className="tribu-card block rounded-[1.75rem] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#315C38] text-sm font-black text-[#FFFDF8]">
                QR
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#7F936A]">Tribu</p>
                <p className="text-xl font-black text-[#294F2F]">Platform</p>
              </div>
            </div>
          </Link>

          <nav className="mt-5 space-y-2">
            {navigation.slice(0, 7).map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex min-h-12 items-center rounded-2xl px-4 text-sm font-bold transition ${
                  isActive(pathname, item.href)
                    ? "bg-[#315C38] text-[#FFFDF8] shadow-lg shadow-[#315C38]/20"
                    : "text-[#42503E] hover:bg-[#FFFDF8]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col pb-24 lg:pb-0">
          <header className="sticky top-0 z-20 bg-[#F6F1E8]/90 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xl font-black tracking-tight text-[#18251A]">
                  {title}
                </p>
                <p className="truncate text-xs font-semibold text-[#6F7668]">
                  {getUserDisplayName(user)}
                  {role ? ` · ${internalRoleLabels[role]}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="min-h-11 rounded-2xl bg-[#FFFDF8] px-4 text-sm font-bold text-[#294F2F] shadow-sm ring-1 ring-[#18251A]/10 transition hover:bg-[#DCE5D2]"
              >
                Salir
              </button>
            </div>
          </header>

          <div className="w-full px-4 pb-6 pt-1 sm:px-6 lg:px-8">{children}</div>
        </section>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-30 rounded-[2rem] border border-[#18251A]/10 bg-[#FFFDF8]/92 p-2 shadow-2xl shadow-[#294F2F]/20 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {navigation.slice(0, 5).map((item, index) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex min-h-14 flex-col items-center justify-center rounded-[1.4rem] text-[11px] font-black transition ${
                  active
                    ? "bg-[#315C38] text-[#FFFDF8]"
                    : index === 2
                      ? "bg-[#DCE5D2] text-[#294F2F]"
                      : "text-[#66705F]"
                }`}
              >
                <span className="text-base leading-none">{index === 2 ? "QR" : "•"}</span>
                <span>{item.short}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </main>
  );
}
