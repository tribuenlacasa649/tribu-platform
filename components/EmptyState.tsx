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
    <div className="tribu-card rounded-[1.75rem] p-7 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#DCE5D2] text-xl font-black text-[#315C38]">
        +
      </div>
      <h2 className="mt-4 text-xl font-black text-[#18251A]">{title}</h2>
      <p className="mt-2 text-sm font-medium leading-6 text-[#6F7668]">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#315C38] px-5 text-base font-black text-[#FFFDF8] transition hover:bg-[#294F2F] sm:w-auto"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
