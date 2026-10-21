import Link from "next/link";
import type { CSSProperties } from "react";
import { BenefitStrip } from "@/components/layout/BenefitStrip";
import { PageHero, type Crumb } from "@/components/layout/PageHero";
import { ProductCard } from "@/components/product/ProductCard";
import { Icon } from "@/components/ui/Icon";
import { MAX_PAGE_SIZE } from "@/lib/catalog-types";
import { SHOP_LAYOUT_TRAITS, type ShopLayout } from "@/lib/shop-layouts";
import { toSearchParams, type CatalogQuery } from "@/server/catalog/query";
import type { CatalogResult, Facets } from "@/server/catalog/service";
import { ActiveFilters } from "./ActiveFilters";
import styles from "./CatalogView.module.css";
import { FilterButton, FilterUiProvider, SheetFilterButton } from "./FilterUi";
import { FilterSidebar } from "./FilterSidebar";
import { Pagination } from "./Pagination";
import { SortSelect } from "./SortSelect";
import { ViewToggle } from "./ViewToggle";

type CatalogViewProps = {
  title: string;
  crumbs?: Crumb[];
  basePath: string;
  query: CatalogQuery;
  result: CatalogResult;
  facets: Facets;
};

/** How many more products "Load more" adds each time (one page). */
const LOAD_MORE_STEP = 12;

/**
 * Shop listing in the ten layouts of the design, chosen by `query.layout` (see src/lib/shop-layouts.ts):
 * sidebar left/right, list rows, load more, top filter panel, horizontal dropdowns and the filter drawer.
 */
export function CatalogView({ title, crumbs, basePath, query, result, facets }: CatalogViewProps) {
  const layout = query.layout;
  const traits = SHOP_LAYOUT_TRAITS[layout];
  const hrefFor = (next: ShopLayout) => {
    const qs = toSearchParams({ ...query, layout: next, page: 1 }).toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const clearQs = toSearchParams({ layout }).toString();
  const clearHref = clearQs ? `${basePath}?${clearQs}` : basePath;

  const summary = (
    <p className={styles.summary} data-testid="results-summary">
      Showing{" "}
      <strong>
        {result.from}-{result.to}
      </strong>{" "}
      of <strong>{result.total}</strong> Products
    </p>
  );

  const hasSidebar = traits.filters === "sidebar-left" || traits.filters === "sidebar-right";
  /** Layouts that show their filters in the page above 1100 px; up to there they use the sheet. */
  const inlineFilters = traits.filters !== "drawer";
  const nextSize = Math.min(query.pageSize + LOAD_MORE_STEP, MAX_PAGE_SIZE);
  const canLoadMore = result.to < result.total && query.pageSize < MAX_PAGE_SIZE;
  const loadMoreQuery = toSearchParams({ ...query, pageSize: nextSize, page: 1 }).toString();

  const content = (
    <section className={styles.content} aria-label="Products">
      <div className={styles.toolbar} data-reveal="fade">
        <div className={styles.left}>
          <ViewToggle layout={layout} hrefFor={hrefFor} />
          {summary}
        </div>
        <div className={styles.right}>
          <SortSelect value={query.sort} basePath={basePath} />
          {traits.filters === "drawer" ? (
            <FilterButton controls="shop-filters" drawer />
          ) : traits.filters === "panel" ? (
            <span className={styles.inlineOnly}>
              <FilterButton controls="shop-filters" />
            </span>
          ) : null}
          {inlineFilters ? <SheetFilterButton /> : null}
        </div>
      </div>

      {traits.filters === "panel" ? (
        <div className={styles.inlineOnly}>
          <FilterSidebar facets={facets} basePath={basePath} variant="panel" />
        </div>
      ) : null}
      {traits.filters === "dropdowns" ? (
        <div className={styles.inlineOnly}>
          <FilterSidebar facets={facets} basePath={basePath} variant="dropdowns" />
        </div>
      ) : null}

      <ActiveFilters query={query} facets={facets} basePath={basePath} />

      {result.items.length > 0 ? (
        <ul
          className={traits.view === "list" ? styles.rows : styles.grid}
          data-testid="product-grid"
          data-columns={traits.columns}
          data-view={traits.view}
          data-reveal-stagger
        >
          {result.items.map((product, i) => (
            <li
              key={product.slug}
              {...(i < 3
                ? { className: "m-enter", style: { "--i": i } as CSSProperties } // on screen at load: a CSS entrance
                : { "data-reveal": "fade-up" })}
            >
              <ProductCard
                product={product}
                priority={i < 3}
                layout={traits.view === "list" ? "row" : "default"}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div
          className={styles.empty}
          role="status"
          data-testid="empty-results"
          data-reveal="fade-up"
        >
          <h2>No products match your filters</h2>
          <p>Try removing a filter or searching for something else.</p>
          <Link href={clearHref} className={styles.reset}>
            Clear all filters
          </Link>
        </div>
      )}

      {traits.loadMore ? (
        canLoadMore ? (
          <div className={styles.more} data-reveal="fade">
            <Link
              href={loadMoreQuery ? `${basePath}?${loadMoreQuery}` : basePath}
              scroll={false}
              className={styles.loadMore}
              data-testid="load-more"
            >
              <span>Load more</span>
              <Icon name="refresh" size={16} />
            </Link>
          </div>
        ) : null
      ) : (
        <div className={styles.footer} data-reveal="fade">
          {result.items.length > 0 ? summary : <span />}
          <Pagination
            query={query}
            basePath={basePath}
            page={result.page}
            pageCount={result.pageCount}
          />
        </div>
      )}
    </section>
  );

  const sidebar = hasSidebar ? (
    <div className={styles.inlineOnly} data-reveal="fade">
      <FilterSidebar facets={facets} basePath={basePath} />
    </div>
  ) : null;
  const page = (
    <>
      <PageHero title={title} crumbs={crumbs} />
      <div
        className={`container ${hasSidebar ? styles.layout : styles.layoutFull} ${
          traits.filters === "sidebar-right" ? styles.sideRight : ""
        }`}
        data-layout={layout}
      >
        {traits.filters === "sidebar-left" ? sidebar : null}
        {content}
        {traits.filters === "sidebar-right" ? sidebar : null}
      </div>
      <FilterSidebar
        facets={facets}
        basePath={basePath}
        variant={traits.filters === "drawer" ? "drawer" : "sheet"}
      />
      <BenefitStrip />
    </>
  );

  return <FilterUiProvider defaultOpen={traits.filters === "panel"}>{page}</FilterUiProvider>;
}
