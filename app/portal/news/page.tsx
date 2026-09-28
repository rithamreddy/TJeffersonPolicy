import type { Metadata } from "next";
import Link from "next/link";
import { PageHeading } from "@/components/app/PageHeading";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { requireUserPage } from "@/lib/auth/guards";
import { listMemberNews } from "@/lib/services/news";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "News" };

/**
 * Every published post, including the members-only ones the public site never
 * shows. Signing in is what grants access — requireUserPage below, and the
 * portal layout above it.
 */
export default async function PortalNewsPage() {
  await requireUserPage("/portal/news");
  const posts = await listMemberNews();

  return (
    <>
      <PageHeading
        title="News"
        description="Announcements from the officer team. Posts marked Members only are not on the public website."
      />

      {posts.length === 0 ? (
        <EmptyState
          title="No posts yet"
          description="When officers publish an announcement it will appear here, and it will also arrive in your email."
        />
      ) : (
        <ul className="border-t-2 border-rule">
          {posts.map((post) => (
            <li key={post.id} className="border-b-2 border-rule-faint">
              <Link href={`/portal/news/${post.slug}`} className="group block py-7 hover:bg-paper-sunk sm:px-4">
                <div className="flex flex-wrap items-center gap-3">
                  <time
                    dateTime={post.publishedAt?.toISOString()}
                    className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-ink/55"
                  >
                    {formatDate(post.publishedAt)}
                  </time>
                  {post.visibility === "MEMBERS" ? <Badge tone="info">Members only</Badge> : null}
                </div>
                <h2 className="t-h3 mt-3 text-ink group-hover:text-navy-600">{post.title}</h2>
                <p className="mt-3 max-w-3xl text-base leading-relaxed text-ink/70">{post.excerpt}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
