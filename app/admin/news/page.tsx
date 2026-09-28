import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/app/PageHeading";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/States";
import { requireOfficerPage } from "@/lib/auth/guards";
import { listAllNews } from "@/lib/services/news";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "News" };

export default async function AdminNewsPage() {
  await requireOfficerPage("/admin/news");
  const posts = await listAllNews();

  return (
    <>
      <PageHeading
        title="News"
        description="Announcements, results, and deadlines. Drafts are invisible to everyone but officers."
        actions={
          <>
            <ButtonLink href="/admin/news/new" size="sm">
              Write a post
            </ButtonLink>
            <ButtonLink href="/news" size="sm" variant="outline" external>
              View public page
            </ButtonLink>
          </>
        }
      />

      {posts.length === 0 ? (
        <EmptyState
          title="Nothing written yet"
          description="Post tournament results, recruitment notices, or deadlines. Publishing a post emails it to every member and their parent or guardian."
          action={{ href: "/admin/news/new", label: "Write the first post" }}
        />
      ) : (
        <TableWrap label="News posts">
          <Table className="min-w-[860px]">
            <thead>
              <tr>
                <Th>Title</Th>
                <Th>Status</Th>
                <Th>Audience</Th>
                <Th>Email</Th>
                <Th>Author</Th>
                <Th>Published</Th>
                <Th>Updated</Th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <Tr key={post.id}>
                  <Td>
                    <Link href={`/admin/news/${post.id}`} className="block">
                      <span className="block text-sm font-semibold text-ink hover:text-navy-600">{post.title}</span>
                      <span className="block max-w-md truncate text-sm text-ink/60">{post.excerpt}</span>
                    </Link>
                  </Td>
                  <Td>
                    <Badge tone={post.status === "PUBLISHED" ? "good" : "warn"}>
                      {post.status === "PUBLISHED" ? "Published" : "Draft"}
                    </Badge>
                  </Td>
                  <Td className="whitespace-nowrap text-ink/60">
                    {post.visibility === "MEMBERS" ? "Members only" : "Public"}
                  </Td>
                  <Td className="whitespace-nowrap">
                    {post.emailedAt && post.emailRecipientCount == null ? (
                      // Published before news emails existed; marked so it is
                      // never offered for a surprise send to every family.
                      <Badge tone="neutral">Predates email</Badge>
                    ) : post.emailedAt ? (
                      <Badge tone={post.emailError ? "warn" : "good"}>
                        {post.emailError ? "Partly sent" : `Sent · ${post.emailRecipientCount ?? 0}`}
                      </Badge>
                    ) : post.status === "PUBLISHED" ? (
                      <Badge tone="bad">Not sent</Badge>
                    ) : (
                      <span className="text-ink/40">—</span>
                    )}
                  </Td>
                  <Td className="text-ink/60">{post.author?.displayName ?? "—"}</Td>
                  <Td className="whitespace-nowrap text-ink/60">{post.publishedAt ? formatDate(post.publishedAt) : "—"}</Td>
                  <Td className="whitespace-nowrap text-ink/60">{formatDate(post.updatedAt)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      )}
    </>
  );
}
