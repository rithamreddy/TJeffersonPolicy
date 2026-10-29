import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section } from "@/components/site/PageHero";
import { Reveal } from "@/components/ui/Reveal";
import { EmptyState } from "@/components/ui/States";
import { listPublishedNews, postTags } from "@/lib/services/news";
import { formatDate } from "@/lib/utils/format";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "News",
  description:
    "Announcements, tournament results, and deadlines from the TJ Policy Debate officer team.",
  path: "/news",
});

export default async function NewsIndexPage() {
  const posts = await listPublishedNews();
  const [lead, ...rest] = posts;

  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "News", path: "/news" }])} />

      <PageHero
        eyebrow="News"
        title="Announcements & results"
        description="Tournament results, recruitment notices, deadlines, and team updates, written by the officer team."
        index="04"
      />

      <Section tone="raised">
        {posts.length === 0 ? (
          <EmptyState
            title="No posts yet"
            action={{ href: "/contact", label: "Where else to find us" }}
          />
        ) : (
          <div className="space-y-16">
            {/* Lead story gets the wide treatment. */}
            <Reveal>
              <Link href={`/news/${lead.slug}`} className="c-frame-link group block p-10 md:p-14">
                <div className="u-grid-12 items-end">
                  <div className="col-span-12 lg:col-span-9">
                    <div className="flex flex-wrap items-center gap-5">
                      <span className="bg-signal px-3 py-1.5 font-display text-[11px] font-extrabold uppercase tracking-[0.18em] text-paper">
                        Latest
                      </span>
                      <time
                        className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-ink/55"
                        dateTime={lead.publishedAt?.toISOString()}
                      >
                        {formatDate(lead.publishedAt)}
                      </time>
                    </div>
                    <h2 className="t-h2 mt-8 text-ink">{lead.title}</h2>
                    <p className="t-body-lg t-muted mt-8 max-w-2xl">{lead.excerpt}</p>
                    <span className="mt-10 inline-block border-b-2 border-signal pb-1 font-display text-sm font-bold uppercase tracking-[0.14em] text-navy-600">
                      Read the full post →
                    </span>
                  </div>
                  {lead.author ? (
                    <p className="col-span-12 mt-10 border-t-2 border-rule-faint pt-6 font-display text-xs font-bold uppercase tracking-[0.16em] text-ink/55 lg:col-span-3 lg:mt-0 lg:border-t-0 lg:pt-0 lg:text-right">
                      By {lead.author.displayName}
                      {lead.author.officer ? (
                        <span className="mt-1 block text-navy-600">{lead.author.officer.position}</span>
                      ) : null}
                    </p>
                  ) : null}
                </div>
              </Link>
            </Reveal>

            {rest.length > 0 ? (
              <ul className="grid gap-px border-2 border-rule bg-rule md:grid-cols-2 lg:grid-cols-3">
                {rest.map((post, index) => {
                  const tags = postTags(post);
                  return (
                    <li key={post.id} className="bg-paper-raised">
                      <Reveal delay={index * 70} className="h-full">
                        <Link
                          href={`/news/${post.slug}`}
                          className="group flex h-full flex-col p-9 hover:bg-paper-sunk"
                        >
                          <time
                            className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-ink/55"
                            dateTime={post.publishedAt?.toISOString()}
                          >
                            {formatDate(post.publishedAt)}
                          </time>
                          <h2 className="t-h3 mt-5 text-ink">{post.title}</h2>
                          <p className="t-body t-muted mt-5 line-clamp-3">{post.excerpt}</p>
                          {tags.length > 0 ? (
                            <ul className="mt-6 flex flex-wrap gap-2">
                              {tags.slice(0, 3).map((tag) => (
                                <li
                                  key={tag}
                                  className="border-2 border-rule-faint px-3 py-1 font-display text-[11px] font-bold uppercase tracking-[0.12em] text-ink/70"
                                >
                                  {tag}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                          <span className="mt-auto pt-8 font-display text-xs font-bold uppercase tracking-[0.16em] text-navy-600 group-hover:text-ink">
                            Read more →
                          </span>
                        </Link>
                      </Reveal>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        )}
      </Section>
    </>
  );
}
