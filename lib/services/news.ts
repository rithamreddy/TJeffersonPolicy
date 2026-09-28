/**
 * News publishing.
 *
 * Two independent gates decide who can read a post:
 *   - status/publishedAt: drafts are visible only to officers.
 *   - visibility: MEMBERS posts appear only in the signed-in portal.
 *
 * Every public query filters on both, so a members-only slug cannot be
 * guessed into view on /news/[slug], and it never reaches the home page, the
 * public list, or the sitemap.
 */
import { prisma } from "../db";
import { parseStringList, serializeStringList } from "../json";
import { uniqueSlug } from "../utils/slug";

const publicSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  body: true,
  imageUrl: true,
  tags: true,
  publishedAt: true,
  visibility: true,
  // Surfaced as `dateModified` in the article's structured data, so a post
  // corrected after publication is not presented as untouched since.
  updatedAt: true,
  author: { select: { displayName: true, officer: { select: { position: true } } } },
} as const;

/** Live posts, before the visibility gate is applied. */
function liveWhere() {
  return { status: "PUBLISHED", publishedAt: { not: null, lte: new Date() } } as const;
}

/** Public site: live *and* public. */
export async function listPublishedNews(limit?: number) {
  return prisma.newsPost.findMany({
    where: { ...liveWhere(), visibility: "PUBLIC" },
    select: publicSelect,
    orderBy: { publishedAt: "desc" },
    ...(limit ? { take: limit } : {}),
  });
}

export async function getPublishedPost(slug: string) {
  return prisma.newsPost.findFirst({
    where: { slug, ...liveWhere(), visibility: "PUBLIC" },
    select: publicSelect,
  });
}

/** Member portal: every live post, public or members-only. Callers must be signed in. */
export async function listMemberNews(limit?: number) {
  return prisma.newsPost.findMany({
    where: liveWhere(),
    select: publicSelect,
    orderBy: { publishedAt: "desc" },
    ...(limit ? { take: limit } : {}),
  });
}

export async function getMemberPost(slug: string) {
  return prisma.newsPost.findFirst({ where: { slug, ...liveWhere() }, select: publicSelect });
}

export async function listAllNews() {
  return prisma.newsPost.findMany({
    include: { author: { select: { displayName: true } } },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });
}

export async function getNewsPost(id: string) {
  return prisma.newsPost.findUnique({ where: { id } });
}

export async function saveNewsPost(input: {
  id?: string;
  title: string;
  excerpt: string;
  body: string;
  imageUrl?: string;
  status: string;
  visibility: string;
  tags: string[];
  authorId: string;
}) {
  const existing = input.id ? await prisma.newsPost.findUnique({ where: { id: input.id } }) : null;

  // publishedAt is stamped once, the first time a post goes live, so editing a
  // published post does not reorder the feed.
  const publishedAt =
    input.status === "PUBLISHED" ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null);

  const data = {
    title: input.title,
    excerpt: input.excerpt,
    body: input.body,
    imageUrl: input.imageUrl ?? null,
    status: input.status,
    visibility: input.visibility,
    tags: serializeStringList(input.tags),
    publishedAt,
  };

  if (existing) return prisma.newsPost.update({ where: { id: existing.id }, data });

  const slug = await uniqueSlug(input.title, async (candidate) =>
    Boolean(await prisma.newsPost.findUnique({ where: { slug: candidate }, select: { id: true } })),
  );
  return prisma.newsPost.create({ data: { ...data, slug, authorId: input.authorId } });
}

export async function deleteNewsPost(id: string) {
  return prisma.newsPost.delete({ where: { id } });
}

export function postTags(post: { tags: string }): string[] {
  return parseStringList(post.tags);
}
