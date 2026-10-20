import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogDetail } from "@/components/blog/BlogDetail";
import { BlogSidebar } from "@/components/blog/BlogSidebar";
import { PageHero } from "@/components/layout/PageHero";
import {
  approvedComments,
  getPost,
  neighbours,
  postIdFor,
  sidebarData,
} from "@/server/blog/queries";
import styles from "@/components/blog/BlogDetail.module.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPost((await params).slug);
  return post ? { title: post.title, description: post.excerpt } : { title: "Post not found" };
}

/** Figma 3:26684. No benefit strip: the footer follows the comment form. */
export default async function BlogPostRoute({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  const postId = postIdFor(slug);
  if (!post || postId === null) notFound();
  return (
    <>
      <PageHero
        title="Blog details"
        crumbs={[{ label: "Blog", href: "/blog" }, { label: "Blog details" }]}
      />
      <div className={`container ${styles.wrap}`}>
        <BlogDetail post={post} comments={approvedComments(postId)} neighbours={neighbours(slug)} />
        <BlogSidebar data={sidebarData(slug)} />
      </div>
    </>
  );
}
