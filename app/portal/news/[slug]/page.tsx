import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/app/PageHeading";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody } from "@/components/ui/Card";
import { requireUserPage } from "@/lib/auth/guards";
import { getMemberPost } from "@/lib/services/news";
import { formatDate } from "@/lib/utils/format";
import { renderMarkdown } from "@/lib/utils/markdown";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getMemberPost(slug);
  return { title: post?.title ?? "Post not found" };
}

export default async function PortalNewsPostPage({ params }: PageProps) {
  const { slug } = await params;
  await requireUserPage(`/portal/news/${slug}`);

  const post = await getMemberPost(slug);
  if (!post) notFound();

  return (
    <>
      <Link href="/portal/news" className="mb-4 inline-block text-sm font-semibold text-navy-600 hover:text-navy-500">
        ← All news
      </Link>

      <PageHeading
        title={post.title}
        description={`${formatDate(post.publishedAt)}${post.author ? ` · ${post.author.displayName}` : ""}`}
        actions={post.visibility === "MEMBERS" ? <Badge tone="info">Members only</Badge> : undefined}
      />

      <Card>
        <CardBody className="sm:p-10">
          <p className="mb-8 max-w-3xl text-lg leading-relaxed text-ink/75">{post.excerpt}</p>
          {/* Same restricted renderer as the public site — see lib/utils/markdown.ts. */}
          <article className="prose-news max-w-3xl" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }} />
        </CardBody>
      </Card>
    </>
  );
}
