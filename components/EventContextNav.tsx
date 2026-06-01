"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getActiveEventModule, getEventModuleLinks } from "../lib/routes";

type EventContextNavProps = {
  eventId: string;
};

export function EventContextNav({ eventId }: EventContextNavProps) {
  const pathname = usePathname();
  const activeModule = getActiveEventModule(pathname);

  return (
    <nav className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="flex min-w-max gap-2">
        {getEventModuleLinks(eventId).map((link) => (
          <Link
            key={link.key}
            href={link.href}
            className={`flex min-h-11 items-center rounded-lg px-4 text-sm font-semibold transition ${
              activeModule === link.key
                ? "bg-[#315C38] text-[#FFFDF8]"
                : "border border-[#18251A]/10 text-[#18251A] hover:bg-[#F0EADF]"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
