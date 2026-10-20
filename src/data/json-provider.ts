import { parsePdpLayout } from "@/lib/pdp-layouts";
import { safeJson, type BlogBlock, type BlogCard, type BlogComment } from "@/lib/blog";
import {
  RATING_THRESHOLDS,
  SIZE_BUCKETS,
  SIZE_BUCKET_RANGES,
  type ProductSummary,
  type SizeBucket,
} from "@/lib/catalog-types";
import { parseProductContent } from "@/lib/product-content";
import { DEFAULT_QUERY, type CatalogQuery } from "@/server/catalog/query";
import type { CategoryNode, ProductDetail, VariantDetail } from "@/server/catalog/service";
import type { DataProvider } from "./provider";
import type { Tables } from "./tables";

type Product = Tables["products"][number];
type Variant = Tables["variants"][number];
type Category = Tables["categories"][number];
type BlogPost = Tables["blogPosts"][number];
type FacetGroup = "categories" | "price" | "size" | "color" | "rating" | "availability";

const FALLBACK_IMAGE = "/images/ui/page-hero.png";

const bySort = <T extends { sortOrder: number; id?: number }>(a: T, b: T) =>
  a.sortOrder - b.sortOrder || (a.id ?? 0) - (b.id ?? 0);

/** Groups rows by a numeric key so lookups are not linear scans. */
function groupBy<T>(rows: T[], key: (row: T) => number): Map<number, T[]> {
  const map = new Map<number, T[]>();
  for (const row of rows) {
    const k = key(row);
    const list = map.get(k);
    if (list) list.push(row);
    else map.set(k, [row]);
  }
  return map;
}

/** A fixed ISO deadline, or "read time + duration" for the rolling demo countdowns. */
const deadline = (fixed: string | null, inMs: number | null, now: Date): Date | null =>
  fixed ? new Date(fixed) : inMs ? new Date(now.getTime() + inMs) : null;

const contains = (haystack: string | null | undefined, needle: string) =>
  (haystack ?? "").toLowerCase().includes(needle.toLowerCase());

/** Read-side data provider backed by the JSON files in `src/data`. */
export function createJsonProvider(t: Tables): DataProvider {
  const published = t.products.filter((p) => p.status === "published");
  const variantsOf = groupBy(t.variants, (v) => v.productId);
  const imagesOf = groupBy(
    [...t.productImages].sort(bySort),
    (i) => i.productId,
  );
  const tagsOf = groupBy(t.productTags, (x) => x.productId);
  const categoryLinksOf = groupBy(t.productCategories, (x) => x.productId);
  const colorLinksOf = groupBy(t.productColors, (x) => x.productId);
  const inventoryOf = new Map(t.inventory.map((i) => [i.variantId, i]));
  const categoryById = new Map(t.categories.map((c) => [c.id, c]));
  const colorById = new Map(t.colors.map((c) => [c.id, c]));
  const activeCategories = t.categories.filter((c) => c.isActive).sort(bySort);

  const available = (variantId: number) => {
    const inv = inventoryOf.get(variantId);
    return inv ? inv.onHand - inv.reserved : 0;
  };
  const defaultVariant = (p: Product): Variant | undefined =>
    (variantsOf.get(p.id) ?? []).find((v) => v.isDefault);
  const inStock = (p: Product) => (variantsOf.get(p.id) ?? []).some((v) => available(v.id) > 0);
  const onSale = (v: Variant) => v.compareAtCents !== null && v.compareAtCents > v.priceCents;

  /* ----------------------------- list + facets ----------------------------- */

  function expandCategoryIds(slugs: string[]): Set<number> {
    if (slugs.length === 0) return new Set();
    const parents = new Set(t.categories.filter((c) => slugs.includes(c.slug)).map((c) => c.id));
    return new Set(
      activeCategories
        .filter((c) => slugs.includes(c.slug) || (c.parentId !== null && parents.has(c.parentId)))
        .map((c) => c.id),
    );
  }

  const hasCategory = (p: Product, ids: Set<number>) =>
    (categoryLinksOf.get(p.id) ?? []).some((l) => ids.has(l.categoryId));
  const hasSize = (p: Product, bucket: SizeBucket) => {
    const r = SIZE_BUCKET_RANGES[bucket];
    return (variantsOf.get(p.id) ?? []).some(
      (v) => v.sizeMl !== null && v.sizeMl >= r.min && (r.max === null || v.sizeMl <= r.max),
    );
  };
  const hasColor = (p: Product, slug: string) =>
    (colorLinksOf.get(p.id) ?? []).some((l) => colorById.get(l.colorId)?.slug === slug);

  const matchesTerm = (p: Product, term: string) =>
    contains(p.name, term) ||
    contains(p.productType, term) ||
    contains(p.shortDescription, term) ||
    contains(p.ingredients, term) ||
    (tagsOf.get(p.id) ?? []).some((x) => contains(x.tag, term)) ||
    (categoryLinksOf.get(p.id) ?? []).some((l) => contains(categoryById.get(l.categoryId)?.name, term));

  /** Published products that have a default variant (as the former join required) and match the query. */
  function matching(q: CatalogQuery, omit?: FacetGroup, extra?: (p: Product, dv: Variant) => boolean) {
    const terms = q.q.split(/\s+/).filter(Boolean);
    const categoryIds = omit !== "categories" && q.categories.length > 0 ? expandCategoryIds(q.categories) : null;
    const collection = q.collection ? t.collections.find((c) => c.slug === q.collection) : null;
    const inCollection = collection
      ? new Set(t.collectionProducts.filter((l) => l.collectionId === collection.id).map((l) => l.productId))
      : null;
    return published.flatMap((p) => {
      const dv = defaultVariant(p);
      if (!dv) return [];
      if (!terms.every((term) => matchesTerm(p, term))) return [];
      if (categoryIds && !hasCategory(p, categoryIds)) return [];
      if (omit !== "price") {
        if (q.priceMinCents !== null && dv.priceCents < q.priceMinCents) return [];
        if (q.priceMaxCents !== null && dv.priceCents > q.priceMaxCents) return [];
      }
      if (omit !== "size" && q.sizes.length > 0 && !q.sizes.some((b) => hasSize(p, b))) return [];
      if (omit !== "color" && q.colors.length > 0 && !q.colors.some((c) => hasColor(p, c))) return [];
      if (omit !== "rating" && q.minRating !== null && p.ratingAvg < q.minRating) return [];
      if (omit !== "availability") {
        if (q.availability.includes("in-stock") && !inStock(p)) return [];
        if (q.availability.includes("on-sale") && !onSale(dv)) return [];
      }
      if (q.badge && p.badge !== q.badge) return [];
      if (inCollection === null ? q.collection : !inCollection.has(p.id)) return [];
      if (extra && !extra(p, dv)) return [];
      return [{ p, dv }];
    });
  }

  const toSummary = (p: Product, dv: Variant): ProductSummary => ({
    slug: p.slug,
    name: p.name,
    label: `${p.productType} · ${dv.sizeLabel}`,
    priceCents: dv.priceCents,
    compareAtCents: dv.compareAtCents,
    rating: p.ratingAvg,
    reviewCount: p.reviewCount,
    badge: p.badge,
    image: imagesOf.get(p.id)?.[0]?.url ?? FALLBACK_IMAGE,
    inStock: inStock(p),
    description: p.shortDescription,
  });

  const summaries = (rows: { p: Product; dv: Variant }[]) => rows.map((r) => toSummary(r.p, r.dv));

  const ORDER: Record<CatalogQuery["sort"], (a: { p: Product; dv: Variant }, b: { p: Product; dv: Variant }) => number> = {
    "best-seller": (a, b) => b.p.soldCount - a.p.soldCount || a.p.id - b.p.id,
    newest: (a, b) => b.p.publishedAt.localeCompare(a.p.publishedAt) || a.p.id - b.p.id,
    "price-asc": (a, b) => a.dv.priceCents - b.dv.priceCents || a.p.id - b.p.id,
    "price-desc": (a, b) => b.dv.priceCents - a.dv.priceCents || a.p.id - b.p.id,
    rating: (a, b) =>
      b.p.ratingAvg - a.p.ratingAvg || b.p.reviewCount - a.p.reviewCount || a.p.id - b.p.id,
  };

  function listProducts(q: CatalogQuery) {
    const rows = matching(q).sort(ORDER[q.sort]);
    const total = rows.length;
    const pageCount = Math.max(1, Math.ceil(total / q.pageSize));
    const page = Math.min(Math.max(1, q.page), pageCount);
    const slice = rows.slice((page - 1) * q.pageSize, page * q.pageSize);
    const from = total === 0 ? 0 : (page - 1) * q.pageSize + 1;
    return {
      items: summaries(slice),
      total,
      page,
      pageSize: q.pageSize,
      pageCount,
      from,
      to: total === 0 ? 0 : from + slice.length - 1,
    };
  }

  function getFacets(q: CatalogQuery) {
    const count = (omit: FacetGroup, extra?: (p: Product, dv: Variant) => boolean) =>
      matching(q, omit, extra).length;

    const catIdsFor = (slug: string) =>
      new Set(
        activeCategories
          .filter((c) => c.slug === slug || activeCategories.find((p) => p.id === c.parentId)?.slug === slug)
          .map((c) => c.id),
      );
    const toNode = (c: Category): CategoryNode => {
      const ids = catIdsFor(c.slug);
      return {
        slug: c.slug,
        name: c.name,
        count: count("categories", (p) => hasCategory(p, ids)),
        children: activeCategories.filter((k) => k.parentId === c.id).map(toNode),
      };
    };
    const prices = published.flatMap((p) => defaultVariant(p)?.priceCents ?? []);

    return {
      categories: activeCategories.filter((c) => c.parentId === null).map(toNode),
      sizes: SIZE_BUCKETS.map((bucket) => ({
        bucket,
        label: SIZE_BUCKET_RANGES[bucket].label,
        count: count("size", (p) => hasSize(p, bucket)),
      })),
      colors: [...t.colors].sort(bySort).map((c) => ({
        slug: c.slug,
        name: c.name,
        hex: c.hex,
        count: count("color", (p) => hasColor(p, c.slug)),
      })),
      ratings: RATING_THRESHOLDS.map((min) => ({
        min,
        count: count("rating", (p) => p.ratingAvg >= min),
      })),
      availability: {
        inStock: count("availability", (p) => inStock(p)),
        onSale: count("availability", (_p, dv) => onSale(dv)),
      },
      price: {
        minCents: prices.length ? Math.min(...prices) : 0,
        maxCents: prices.length ? Math.max(...prices) : 0,
      },
    };
  }

  /* ----------------------------- product detail ----------------------------- */

  function getProductBySlug(slug: string): ProductDetail | null {
    const p = published.find((x) => x.slug === slug);
    if (!p) return null;
    const variantRows: VariantDetail[] = [...(variantsOf.get(p.id) ?? [])].sort(bySort).map((v) => {
      const left = available(v.id);
      return {
        id: v.id,
        sku: v.sku,
        sizeLabel: v.sizeLabel,
        sizeMl: v.sizeMl,
        priceCents: v.priceCents,
        compareAtCents: v.compareAtCents,
        isDefault: v.isDefault,
        available: Math.max(0, left),
        inStock: left > 0,
      };
    });
    const dv = variantRows.find((v) => v.isDefault) ?? variantRows[0];
    if (!dv) return null; // a product without variants cannot be sold

    const empty = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      productType: p.productType,
      shortDescription: p.shortDescription,
      description: p.description,
      ingredients: p.ingredients,
      content: parseProductContent(p.content),
      badge: p.badge,
      ratingAvg: p.ratingAvg,
      reviewCount: p.reviewCount,
      ratingBreakdown: { ...empty, ...safeJson<Partial<typeof empty>>(p.ratingBreakdown, {}) },
      images: (imagesOf.get(p.id) ?? []).map((i) => ({ url: i.url, alt: i.alt })),
      variants: variantRows,
      defaultVariant: dv,
      categories: (categoryLinksOf.get(p.id) ?? []).flatMap((l) => {
        const c = categoryById.get(l.categoryId);
        return c ? [{ slug: c.slug, name: c.name }] : [];
      }),
      // alphabetical, as the former primary-key index returned them
      tags: (tagsOf.get(p.id) ?? []).map((x) => x.tag).sort((x, y) => (x < y ? -1 : x > y ? 1 : 0)),
      colors: (colorLinksOf.get(p.id) ?? [])
        .flatMap((l) => colorById.get(l.colorId) ?? [])
        .sort(bySort)
        .map((c) => ({ slug: c.slug, name: c.name, hex: c.hex })),
      inStock: variantRows.some((v) => v.inStock),
      pdpLayout: parsePdpLayout(p.pdpLayout),
      saleEndsAt: deadline(p.saleEndsAt, p.saleEndsInMs, new Date()),
    };
  }

  const getApprovedReviews: DataProvider["getApprovedReviews"] = (productId, limit = 20) =>
    t.reviews
      .filter((r) => r.productId === productId && r.status === "approved")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
      .slice(0, limit)
      .map((r) => ({
        id: r.id,
        authorName: r.authorName,
        rating: r.rating,
        title: r.title,
        body: r.body,
        isVerified: r.isVerified,
        recommend: r.recommend,
        createdAt: new Date(r.createdAt),
        brandReply: r.brandReply,
        brandReplyAuthor: r.brandReplyAuthor,
      }));

  /** Published products with a default variant, best sellers first. */
  const bestSellers = () =>
    published
      .flatMap((p) => {
        const dv = defaultVariant(p);
        return dv ? [{ p, dv }] : [];
      })
      .sort(ORDER["best-seller"]);

  const getRelatedProducts: DataProvider["getRelatedProducts"] = (productId, limit = 4) => {
    const mine = new Set((categoryLinksOf.get(productId) ?? []).map((l) => l.categoryId));
    const others = bestSellers().filter((r) => r.p.id !== productId);
    const same = others
      .filter((r) => (categoryLinksOf.get(r.p.id) ?? []).some((l) => mine.has(l.categoryId)))
      .slice(0, limit);
    if (same.length >= limit) return summaries(same);
    const seen = new Set(same.map((r) => r.p.slug));
    const rest = others.filter((r) => !seen.has(r.p.slug));
    return summaries([...same, ...rest].slice(0, limit));
  };

  const getProductsBySlugs: DataProvider["getProductsBySlugs"] = (slugs) => {
    const found = new Map(
      published.flatMap((p) => {
        const dv = defaultVariant(p);
        return dv && slugs.includes(p.slug) ? [[p.slug, toSummary(p, dv)] as const] : [];
      }),
    );
    return slugs.flatMap((slug) => found.get(slug) ?? []);
  };

  /* ----------------------------- navigation ----------------------------- */

  const countProductsIn = (ids: Set<number>) =>
    published.filter((p) => defaultVariant(p) && hasCategory(p, ids)).length;

  const getCategoryTree: DataProvider["getCategoryTree"] = (opts = {}) => {
    const build = (c: Category): CategoryNode => {
      const kids = activeCategories.filter((k) => k.parentId === c.id);
      return {
        slug: c.slug,
        name: c.name,
        count: countProductsIn(new Set([c.id, ...kids.map((k) => k.id)])),
        children: kids.map(build),
      };
    };
    const prune = (nodes: CategoryNode[]): CategoryNode[] =>
      nodes
        .filter((n) => opts.includeEmpty || n.count > 0)
        .map((n) => ({ ...n, children: prune(n.children) }));
    return prune(activeCategories.filter((c) => c.parentId === null).map(build));
  };

  const getCategoryCards: DataProvider["getCategoryCards"] = () => {
    const flat: CategoryNode[] = [];
    const walk = (nodes: CategoryNode[]) =>
      nodes.forEach((n) => {
        flat.push(n);
        walk(n.children);
      });
    walk(getCategoryTree());
    const meta = new Map(activeCategories.map((c) => [c.slug, c]));
    return flat.flatMap((n) => {
      const m = meta.get(n.slug);
      return m?.image
        ? [{ slug: n.slug, name: n.name, description: m.description, image: m.image, count: n.count }]
        : [];
    });
  };

  const getCollectionProducts: DataProvider["getCollectionProducts"] = (slug, limit = 8) => {
    const collection = t.collections.find((c) => c.slug === slug);
    if (!collection) return [];
    return t.collectionProducts
      .filter((l) => l.collectionId === collection.id)
      .flatMap((l) => {
        const p = published.find((x) => x.id === l.productId);
        const dv = p && defaultVariant(p);
        return p && dv ? [{ p, dv, sortOrder: l.sortOrder }] : [];
      })
      .sort((a, b) => a.sortOrder - b.sortOrder || a.p.id - b.p.id)
      .slice(0, limit)
      .map((r) => toSummary(r.p, r.dv));
  };

  const searchSuggestions: DataProvider["searchSuggestions"] = (term, limit = 6) => {
    const q = term.trim().slice(0, 80);
    if (q.length < 2) return { products: [], categories: [] };
    const found = listProducts({ ...DEFAULT_QUERY, q, pageSize: limit, sort: "best-seller" }).items;
    const cats = activeCategories
      .filter((c) => contains(c.name, q))
      .slice(0, 4)
      .map((c) => ({ slug: c.slug, name: c.name }));
    return { products: found, categories: cats };
  };

  /* ----------------------------- derived product views ----------------------------- */

  const lookupProducts: DataProvider["lookupProducts"] = (slugs) =>
    slugs.flatMap((slug) => {
      const p = getProductBySlug(slug);
      if (!p) return [];
      const v = p.defaultVariant;
      return [
        {
          slug: p.slug,
          name: p.name,
          label: `${p.productType} · ${v.sizeLabel}`,
          image: p.images[0]?.url ?? null,
          priceCents: v.priceCents,
          compareAtCents: v.compareAtCents,
          rating: p.ratingAvg,
          reviewCount: p.reviewCount,
          inStock: v.inStock,
          sku: v.sku,
          sizeLabel: v.sizeLabel,
        },
      ];
    });

  const getQuickView: DataProvider["getQuickView"] = (slug) => {
    const p = getProductBySlug(slug);
    if (!p) return null;
    const v = p.defaultVariant;
    return {
      slug: p.slug,
      name: p.name,
      badge: p.badge,
      shortDescription: p.shortDescription,
      rating: p.ratingAvg,
      reviewCount: p.reviewCount,
      images: p.images,
      variantId: v.id,
      sizeLabel: v.sizeLabel,
      priceCents: v.priceCents,
      compareAtCents: v.compareAtCents,
      inStock: v.inStock,
      available: v.available,
    };
  };

  /* ----------------------------- banners ----------------------------- */

  const getBanners: DataProvider["getBanners"] = (slot, now = new Date()) =>
    t.banners
      .filter((b) => {
        const endsAt = deadline(b.endsAt, b.endsInMs, now);
        return (
          b.slot === slot &&
          b.isActive &&
          (b.startsAt === null || new Date(b.startsAt) <= now) &&
          (endsAt === null || endsAt > now)
        );
      })
      .sort(bySort)
      .map((b) => ({
        id: b.id,
        slot: b.slot,
        eyebrow: b.eyebrow,
        title: b.title,
        subtitle: b.subtitle,
        ctaLabel: b.ctaLabel,
        ctaHref: b.ctaHref,
        image: b.image,
        data: safeJson<Record<string, unknown>>(b.data ?? "{}", {}),
        endsAt: deadline(b.endsAt, b.endsInMs, now),
      }));

  /* ----------------------------- blog ----------------------------- */

  const card = (row: BlogPost): BlogCard => ({
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    author: row.author,
    readMinutes: row.readMinutes,
    coverImage: row.coverImage,
    publishedAt: new Date(row.publishedAt).toISOString(),
  });
  const newestFirst = (a: BlogPost, b: BlogPost) =>
    b.publishedAt.localeCompare(a.publishedAt) || a.id - b.id;
  const livePosts = () => t.blogPosts.filter((p) => p.status === "published").sort(newestFirst);

  const listPosts: DataProvider["listPosts"] = (filter, page, pageSize) => {
    const q = filter.q?.trim().replace(/[%_\\]/g, "");
    const tag = filter.tag?.replace(/["%_\\]/g, "");
    const rows = livePosts().filter(
      (p) =>
        (!filter.category || p.category.toLowerCase() === filter.category.toLowerCase()) &&
        (!tag || contains(p.tags, `"${tag}"`)) &&
        (!q || contains(p.title, q) || contains(p.excerpt, q) || contains(p.category, q)),
    );
    const total = rows.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const current = Math.min(Math.max(1, page), pages);
    return {
      posts: rows.slice((current - 1) * pageSize, current * pageSize).map(card),
      total,
      pages,
      page: current,
    };
  };

  const sidebarData: DataProvider["sidebarData"] = (excludeSlug) => {
    const posts = livePosts();
    const counts = new Map<string, number>();
    for (const p of posts) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    const categories = [...counts]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
      .slice(0, 6);
    const tagSet = new Set<string>();
    for (const p of posts) for (const tag of safeJson<string[]>(p.tags, [])) tagSet.add(tag);
    return {
      categories,
      recent: posts.filter((p) => p.slug !== excludeSlug).slice(0, 3).map(card),
      tags: [...tagSet].sort((a, b) => a.localeCompare(b)).slice(0, 9),
    };
  };

  const getPost: DataProvider["getPost"] = (slug) => {
    const row = livePosts().find((p) => p.slug === slug);
    if (!row) return null;
    return {
      ...card(row),
      authorImage: row.authorImage,
      tags: safeJson<string[]>(row.tags, []),
      blocks: safeJson<BlogBlock[]>(row.content, []),
    };
  };

  const neighbours: DataProvider["neighbours"] = (slug) => {
    const all = livePosts();
    const i = all.findIndex((p) => p.slug === slug);
    if (i < 0 || all.length < 2) return { previous: null, next: null };
    return {
      previous: card(all[(i - 1 + all.length) % all.length]!),
      next: card(all[(i + 1) % all.length]!),
    };
  };

  const postIdFor: DataProvider["postIdFor"] = (slug) =>
    livePosts().find((p) => p.slug === slug)?.id ?? null;

  const approvedComments: DataProvider["approvedComments"] = (postId): BlogComment[] =>
    t.blogComments
      .filter((c) => c.postId === postId && c.status === "approved")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id - b.id)
      .map((c) => ({
        id: c.id,
        parentId: c.parentId,
        name: c.name,
        avatar: c.avatar,
        body: c.body,
        createdAt: new Date(c.createdAt).toISOString(),
      }));

  return {
    listProducts,
    getFacets,
    getProductBySlug,
    getApprovedReviews,
    getRelatedProducts,
    getProductsBySlugs,
    getCategoryTree,
    getCategoryCards,
    getCollectionProducts,
    searchSuggestions,
    lookupProducts,
    getQuickView,
    getBanners,
    listPosts,
    sidebarData,
    getPost,
    neighbours,
    postIdFor,
    approvedComments,
  };
}
