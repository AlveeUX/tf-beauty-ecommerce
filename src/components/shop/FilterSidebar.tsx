"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import { useFilterUi } from "./FilterUi";
import { formatMoney } from "@/lib/money";
import type { CategoryNode, Facets } from "@/server/catalog/service";
import styles from "./FilterSidebar.module.css";

type FilterSidebarProps = {
  facets: Facets;
  /** Route the filters apply to, e.g. "/shop". */
  basePath: string;
  /** Where the filters are shown: the sidebar (default), the top panel, a dropdown bar or the drawer. */
  variant?: "sidebar" | "panel" | "dropdowns" | "drawer" | "sheet";
};

const PRICE_PRESETS = [
  { label: "Under $50", value: "0-50" },
  { label: "$20 - $50", value: "20-50" },
  { label: "$50 - $100", value: "50-100" },
  { label: "$100+", value: "100-" },
];

/**
 * Shop filter sidebar (Figma 3:5475: 308 wide, dashed border, 25px padding, 31px row pitch).
 * Every change rewrites the URL query string; the server renders the matching results (CAT-002/003).
 */
export function FilterSidebar({ facets, basePath, variant = "sidebar" }: FilterSidebarProps) {
  const router = useRouter();
  const search = useSearchParams();
  const [pending, startTransition] = useTransition();

  // The URL a click should extend. While a navigation is pending, `search` still shows the
  // old URL, so successive clicks must build on the latest params we pushed (not on `search`).
  const latest = useRef(search.toString());
  useEffect(() => {
    if (!pending) latest.current = search.toString();
  }, [search, pending]);

  const values = (key: string) =>
    search
      .getAll(key)
      .flatMap((v) => v.split(","))
      .filter(Boolean);

  function update(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(latest.current);
    mutate(params);
    params.delete("page"); // any filter change returns to the first page
    const qs = params.toString();
    latest.current = qs;
    startTransition(() => router.push(qs ? `${basePath}?${qs}` : basePath, { scroll: false }));
  }

  function toggle(key: string, value: string) {
    update((p) => {
      const current = p
        .getAll(key)
        .flatMap((v) => v.split(","))
        .filter(Boolean);
      p.delete(key);
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      next.forEach((v) => p.append(key, v));
    });
  }

  function setSingle(key: string, value: string | null) {
    update((p) => (value === null || p.get(key) === value ? p.delete(key) : p.set(key, value)));
  }

  const selectedCategories = values("category");
  const selectedSizes = values("size");
  const selectedColors = values("color");
  const selectedAvailability = values("availability");
  const rating = search.get("rating");
  const price = search.get("price");

  const groups: Group[] = [
    {
      id: "categories",
      title: "Categories",
      body: (
        <ul className={styles.list}>
          {facets.categories.map((node) => (
            <CategoryRow
              key={node.slug}
              node={node}
              selected={selectedCategories}
              onToggle={(slug) => toggle("category", slug)}
            />
          ))}
        </ul>
      ),
    },
    {
      id: "price",
      title: "Price range",
      body: (
        <PriceRange
          key={price ?? "all"}
          minCents={facets.price.minCents}
          maxCents={facets.price.maxCents}
          active={price}
          onApply={(value) => setSingle("price", value)}
        />
      ),
    },
    {
      id: "size",
      title: "Size",
      body: (
        <ul className={styles.list}>
          {facets.sizes.map((s) => (
            <li key={s.bucket}>
              <CheckRow
                checked={selectedSizes.includes(s.bucket)}
                onChange={() => toggle("size", s.bucket)}
                label={s.label}
                count={SIZE_HINT[s.bucket]}
                disabled={s.count === 0 && !selectedSizes.includes(s.bucket)}
              />
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: "color",
      title: "Color",
      body: (
        <ul className={styles.list}>
          {facets.colors.map((c) => (
            <li key={c.slug}>
              <CheckRow
                checked={selectedColors.includes(c.slug)}
                onChange={() => toggle("color", c.slug)}
                label={c.name}
                count={pad(c.count)}
                swatch={c.hex}
                disabled={c.count === 0 && !selectedColors.includes(c.slug)}
              />
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: "rating",
      title: "Rating",
      body: (
        <ul className={styles.list}>
          {facets.ratings.map((r) => (
            <li key={r.min}>
              <button
                type="button"
                className={styles.ratingRow}
                aria-pressed={rating === String(r.min)}
                onClick={() => setSingle("rating", String(r.min))}
                disabled={r.count === 0 && rating !== String(r.min)}
              >
                <span className={styles.stars} aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Icon
                      key={n}
                      name="star"
                      size={13}
                      filled={n <= Math.floor(r.min)}
                      strokeWidth={1.2}
                    />
                  ))}
                </span>
                <span className={styles.ratingLabel}>{r.min.toFixed(1)} &amp; up</span>
                <span className={styles.count}>{pad(r.count)}</span>
              </button>
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: "availability",
      title: "Availability",
      body: (
        <ul className={styles.list}>
          <li>
            <CheckRow
              checked={selectedAvailability.includes("in-stock")}
              onChange={() => toggle("availability", "in-stock")}
              label="In Stock"
              count={pad(facets.availability.inStock)}
            />
          </li>
          <li>
            <CheckRow
              checked={selectedAvailability.includes("on-sale")}
              onChange={() => toggle("availability", "on-sale")}
              label="On Sale"
              count={pad(facets.availability.onSale)}
            />
          </li>
        </ul>
      ),
    },
  ];

  if (variant === "panel") return <PanelFilters groups={groups} busy={pending} />;
  if (variant === "dropdowns") return <DropdownFilters groups={groups} busy={pending} />;
  const stack = (
    <div className={styles.sidebar}>
      {groups.map((g) => (
        <Section key={g.id} title={g.title}>
          {g.body}
        </Section>
      ))}
    </div>
  );
  if (variant === "drawer") return <DrawerFilters busy={pending}>{stack}</DrawerFilters>;
  if (variant === "sheet")
    return (
      <DrawerFilters busy={pending} sheet>
        {stack}
      </DrawerFilters>
    );
  return (
    <aside aria-label="Product filters" aria-busy={pending}>
      {stack}
    </aside>
  );
}

type Group = { id: string; title: string; body: ReactNode };

/** "Shop top filter" (Figma 3:7276): five columns under the toolbar; Categories and Color scroll. */
function PanelFilters({ groups, busy }: { groups: Group[]; busy: boolean }) {
  const { open } = useFilterUi();
  const shown = groups.filter((g) => g.id !== "availability");
  return (
    <section
      id="shop-filters"
      className={styles.panel}
      aria-label="Product filters"
      aria-busy={busy}
      hidden={!open}
    >
      {shown.map((g) => (
        <div key={g.id} className={styles.col}>
          <h2 className={styles.colTitle}>{g.title}</h2>
          <div
            className={styles.colBody}
            data-scroll={g.id === "categories" || g.id === "color" || undefined}
          >
            {g.body}
          </div>
        </div>
      ))}
    </section>
  );
}

/** "Shop horizontal filter" (Figma 3:11117): a bar of five dropdown buttons; each opens a 262 wide list. */
function DropdownFilters({ groups, busy }: { groups: Group[]; busy: boolean }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const bar = useRef<HTMLElement>(null);
  const shown = groups.filter((g) => g.id !== "availability");

  useEffect(() => {
    if (!openId) return;
    const onDown = (e: MouseEvent) => {
      if (bar.current && !bar.current.contains(e.target as Node)) setOpenId(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenId(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openId]);

  return (
    <section ref={bar} className={styles.bar} aria-label="Product filters" aria-busy={busy}>
      {shown.map((g) => {
        const isOpen = openId === g.id;
        return (
          <div key={g.id} className={styles.dropdown}>
            <button
              type="button"
              className={styles.dropButton}
              aria-expanded={isOpen}
              aria-controls={`filter-${g.id}`}
              onClick={() => setOpenId(isOpen ? null : g.id)}
            >
              <span>{g.title}</span>
              <Icon name="chevron-down" size={14} />
            </button>
            <div id={`filter-${g.id}`} className={styles.popover} hidden={!isOpen}>
              <div
                className={styles.popBody}
                data-scroll={g.id === "categories" || g.id === "color" || undefined}
              >
                {g.body}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}

/** "Filter drawer" (Figma 3:12394): a 368 wide panel sliding in from the left over a dimmed page. */
function DrawerFilters({
  children,
  busy,
  sheet,
}: {
  children: ReactNode;
  busy: boolean;
  /** The tablet/phone sheet of the inline layouts: own state, own id, a "Done" button, hidden above 1100 px. */
  sheet?: boolean;
}) {
  const ui = useFilterUi();
  const open = sheet ? ui.sheetOpen : ui.open;
  const close = sheet ? ui.closeSheet : ui.close;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  if (!open) return null;
  return (
    <div
      className={`${styles.overlay} ${sheet ? styles.sheetOnly : ""}`}
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div
        id={sheet ? "shop-filters-sheet" : "shop-filters"}
        ref={ref}
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label="Filter"
        aria-busy={busy}
      >
        <header className={styles.drawerHead}>
          <h2>Filter</h2>
          <button type="button" onClick={close} aria-label="Close filters">
            <Icon name="x" size={18} />
          </button>
        </header>
        {children}
        <button type="button" className={styles.done} onClick={close}>
          Show results
        </button>
      </div>
    </div>
  );
}

const SIZE_HINT = { mini: "15ml", standard: "30ml", large: "50ml", jumbo: "50ml+" } as const;
const pad = (n: number) => String(n).padStart(2, "0");

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className={styles.section} open>
      <summary className={styles.summary}>
        <span>{title}</span>
        <Icon name="chevron-up" size={16} />
      </summary>
      <div className={styles.body}>{children}</div>
    </details>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
  count,
  swatch,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  count: string;
  swatch?: string;
  disabled?: boolean;
}) {
  return (
    <label className={styles.row} data-disabled={disabled || undefined}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
      <span className={styles.box} aria-hidden="true">
        <Icon name="check" size={12} strokeWidth={2.5} />
      </span>
      {swatch ? (
        <span className={styles.swatch} style={{ background: swatch }} aria-hidden="true" />
      ) : null}
      <span className={styles.label}>{label}</span>
      <span className={styles.count}>{count}</span>
    </label>
  );
}

function CategoryRow({
  node,
  selected,
  onToggle,
}: {
  node: CategoryNode;
  selected: string[];
  onToggle: (slug: string) => void;
}) {
  return (
    <li>
      <CheckRow
        checked={selected.includes(node.slug)}
        onChange={() => onToggle(node.slug)}
        label={node.name}
        count={pad(node.count)}
        disabled={node.count === 0 && !selected.includes(node.slug)}
      />
      {node.children.length > 0 ? (
        <ul className={`${styles.list} ${styles.nested}`}>
          {node.children.map((child) => (
            <CategoryRow key={child.slug} node={child} selected={selected} onToggle={onToggle} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/** Two-handle price slider (Figma "Price: $20 - $135" + FILTER) with the preset chips. */
function PriceRange({
  minCents,
  maxCents,
  active,
  onApply,
}: {
  minCents: number;
  maxCents: number;
  active: string | null;
  onApply: (value: string | null) => void;
}) {
  const floor = Math.floor(minCents / 100);
  const ceil = Math.ceil(maxCents / 100);
  const [activeMin, activeMax] = parseRange(active, floor, ceil);
  const [low, setLow] = useState(activeMin);
  const [high, setHigh] = useState(activeMax);

  return (
    <div className={styles.price}>
      <div className={styles.slider}>
        <div
          className={styles.track}
          style={{
            left: `${((low - floor) / Math.max(1, ceil - floor)) * 100}%`,
            right: `${100 - ((high - floor) / Math.max(1, ceil - floor)) * 100}%`,
          }}
        />
        <input
          type="range"
          min={floor}
          max={ceil}
          value={low}
          aria-label="Minimum price"
          onChange={(e) => setLow(Math.min(Number(e.target.value), high))}
        />
        <input
          type="range"
          min={floor}
          max={ceil}
          value={high}
          aria-label="Maximum price"
          onChange={(e) => setHigh(Math.max(Number(e.target.value), low))}
        />
      </div>
      <div className={styles.priceLine}>
        <span>
          Price: {formatMoney(low * 100)} - {formatMoney(high * 100)}
        </span>
        <button type="button" onClick={() => onApply(`${low}-${high}`)}>
          Filter
        </button>
      </div>
      <ul className={styles.presets}>
        {PRICE_PRESETS.map((p) => (
          <li key={p.value}>
            <button
              type="button"
              aria-pressed={active === p.value}
              data-active={active === p.value || undefined}
              onClick={() => onApply(p.value)}
            >
              {p.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function parseRange(value: string | null, floor: number, ceil: number): [number, number] {
  const m = value ? /^(\d*)-(\d*)$/.exec(value) : null;
  if (!m) return [floor, ceil];
  return [m[1] ? Number(m[1]) : floor, m[2] ? Number(m[2]) : ceil];
}
