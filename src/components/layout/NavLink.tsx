"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";

type NavLinkProps = {
  href: string;
  className?: string;
  /** Extra class when this link points at the current page. */
  activeClassName?: string;
  /** When false the link is never highlighted (links that duplicate another entry's page). */
  match?: boolean;
  children: ReactNode;
  onClick?: () => void;
};

/**
 * Link that marks itself as the current page (aria-current) when the page and its layout variant match.
 * Reading the query string needs a Suspense boundary on statically rendered pages; the fallback is the same
 * link without the highlight, so the server HTML already contains every link.
 */
export function NavLink(props: NavLinkProps) {
  return (
    <Suspense fallback={<PlainLink {...props} current={false} />}>
      <CurrentAwareLink {...props} />
    </Suspense>
  );
}

function PlainLink({
  href,
  className,
  activeClassName,
  children,
  onClick,
  current,
}: NavLinkProps & { current: boolean }) {
  const classes = [className, current ? activeClassName : null].filter(Boolean).join(" ");
  return (
    <Link
      href={href}
      className={classes || undefined}
      aria-current={current ? "page" : undefined}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

function CurrentAwareLink(props: NavLinkProps) {
  const pathname = usePathname();
  const search = useSearchParams();
  const [target, query = ""] = props.href.split("?");
  const linkParams = new URLSearchParams(query);
  // Layout variants share one path, so the page's `layout` and `sticky` parameters must agree with the link's
  // (a link without them is the default variant). Filters and paging are ignored.
  const sameVariant = ["layout", "sticky"].every(
    (key) => (linkParams.get(key) ?? null) === (search.get(key) ?? null),
  );
  return (
    <PlainLink {...props} current={(props.match ?? true) && pathname === target && sameVariant} />
  );
}
