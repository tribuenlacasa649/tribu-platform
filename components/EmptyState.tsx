import Link from "next/link";

type EmptyStateProps = {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
};

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm text-zinc-400">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-emerald-400 px-5 text-base font-semibold text-zinc-950 transition hover:bg-emerald-300 sm:w-auto"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
