import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeading } from "@/components/app/PageHeading";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { requireOfficerPage } from "@/lib/auth/guards";
import { isEmailConfigured } from "@/lib/email/resend";
import { getNewsPost, postTags } from "@/lib/services/news";
import { formatDateTime } from "@/lib/utils/format";
import { NewsEditor } from "../NewsEditor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getNewsPost(id);
  return { title: post ? `Edit: ${post.title}` : "Post" };
}

export default async function EditNewsPage({ params }: PageProps) {
  await requireOfficerPage("/admin/news");
  const { id } = await params;

  const post = await getNewsPost(id);
  if (!post) notFound();

  return (
    <>
      <Link href="/admin/news" className="mb-4 inline-block text-sm font-semibold text-navy-600 hover:text-navy-500">
        ← All posts
      </Link>

      <PageHeading
        title="Edit post"
        description={post.publishedAt ? `First published ${formatDateTime(post.publishedAt)}` : "Not published yet"}
        actions={
          <>
            <Badge tone={post.status === "PUBLISHED" ? "good" : "warn"}>
              {post.status === "PUBLISHED" ? "Published" : "Draft"}
            </Badge>
            {post.visibility === "MEMBERS" ? <Badge tone="info">Members only</Badge> : null}
            {post.status === "PUBLISHED" ? (
              <ButtonLink
                href={post.visibility === "MEMBERS" ? `/portal/news/${post.slug}` : `/news/${post.slug}`}
                size="sm"
                variant="outline"
              >
                View live
              </ButtonLink>
            ) : null}
          </>
        }
      />

      <Card>
        <CardBody className="sm:p-6">
          <NewsEditor
            postId={post.id}
            initial={{
              title: post.title,
              excerpt: post.excerpt,
              body: post.body,
              imageUrl: post.imageUrl ?? "",
              status: post.status,
              visibility: post.visibility,
              tags: postTags(post).join(", "),
            }}
            email={{
              emailedAt: post.emailedAt?.toISOString() ?? null,
              recipientCount: post.emailRecipientCount,
              error: post.emailError,
              configured: isEmailConfigured(),
            }}
          />
        </CardBody>
      </Card>
    </>
  );
}
