import type { Metadata } from "next";
import { BlogIndex } from "@/components/blog/BlogIndex";
import { PageHero } from "@/components/layout/PageHero";
import { BLOG_PAGE_SIZE, parseBlogLayout } from "@/lib/blog";
import { listPosts, sidebarData } from "@/server/blog/queries";

export const metadata: Metadata = { title: "Blog" };
export const dynamic = "force-dynamic"; // posts are managed in the admin and must show immediately

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function first(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.trim() || undefined;
}

/**
 * Figma 3:25805 (grid) and its four variants chosen with `?layout=` (list 3:25320, standard 3:26239,
 * sidebar-left 3:28943, sidebar-right 3:24811). No benefit strip: the footer follows the pagination.
 */
export default async function BlogRoute({ searchParams }: Props) {
  const params = await searchParams;
  const layout = parseBlogLayout(first(params.layout));
  const filter = {
    category: first(params.category),
    tag: first(params.tag),
    q: first(params.q)?.slice(0, 80),
  };
  const requested = Number.parseInt(first(params.page) ?? "1", 10);
  const result = listPosts(
    filter,
    Number.isFinite(requested) ? requested : 1,
    BLOG_PAGE_SIZE[layout],
  );
  return (
    <>
      <PageHero title="Blog" />
      <BlogIndex
        layout={layout}
        posts={result.posts}
        page={result.page}
        pages={result.pages}
        total={result.total}
        sidebar={sidebarData()}
        filter={filter}
      />
    </>
  );
}
