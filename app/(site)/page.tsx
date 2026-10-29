import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { CountUp } from "@/components/ui/CountUp";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeading } from "@/components/site/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { EmptyState } from "@/components/ui/States";
import { CLUB, MEETINGS, POLICY_EXPLAINER, SEASON_PHASES } from "@/lib/content/club";
import { ACHIEVEMENT_LEVELS, labelFor } from "@/lib/constants";
import { organizationSchema, websiteSchema } from "@/lib/schema";
import { achievementParticipants, listFeaturedAchievements } from "@/lib/services/achievements";
import { listPublishedNews } from "@/lib/services/news";
import { getSettings } from "@/lib/services/settings";
import { formatDate } from "@/lib/utils/format";

/**
 * The root layout already supplies the site-wide title, description, and
 * social tags; the home page only needs to claim `/` as its canonical so a
 * visit with a tracking query string does not read as a separate document.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [featured, news, settings] = await Promise.all([
    listFeaturedAchievements(3),
    listPublishedNews(3),
    getSettings(),
  ]);

  return (
    <>
      {/* Organization and WebSite, emitted once on the home page. Subpages
          reference these by @id rather than repeating them. */}
      <JsonLd data={[organizationSchema(), websiteSchema()]} />

      {/* ================================================================ Hero
          A flat navy field with the team photograph knocked back to a duotone
          plate, crossed by hard signal bars. The headline is set as three
          stacked blocks so it reads as a printed poster, not a sentence. */}
      <section className="on-dark relative isolate flex min-h-[92svh] items-end overflow-hidden bg-navy-950">
        <Image
          src="/brand/team.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-[0.18] grayscale"
        />
        <div className="absolute inset-0 bg-navy-950/60" aria-hidden="true" />
        <div className="c-grid-texture absolute inset-0" aria-hidden="true" />

        {/* Crossed diagonals, cropped hard by the viewport edge. */}
        <div className="c-diagonal right-[6%] top-[-40%] h-[190%] w-10 opacity-95" aria-hidden="true" />
        <div className="c-diagonal right-[14%] top-[-40%] h-[190%] w-3 opacity-70" aria-hidden="true" />
        <div className="c-diagonal right-[2%] top-[-40%] h-[190%] w-1.5 opacity-50" aria-hidden="true" />

        <div className="u-container relative pb-24 pt-[calc(var(--header-height)+96px)] md:pb-32">
          {/* Above-the-fold: rendered plain, not wrapped in Reveal — this has to
              be visible the instant the page paints, not after JS hydrates and
              an IntersectionObserver fires. */}
          <div className="flex items-center gap-5">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center border-2 border-signal bg-navy-900">
              <Image src="/brand/logo.svg" alt="" width={40} height={40} className="h-10 w-10" />
            </span>
            <p className="max-w-[24ch] font-display text-[11px] font-bold uppercase leading-relaxed tracking-[0.2em] text-signal-bright sm:max-w-none">
              {CLUB.school}
            </p>
          </div>

          <h1 className="mt-12 text-white">
            <span className="t-display block">Jefferson</span>
            <span className="t-display block text-signal-bright">Policy</span>
            <span className="t-display block">Debate</span>
          </h1>

          <div className="mt-14 u-grid-12 items-end">
            <div className="col-span-12 lg:col-span-6">
              <div className="border-l-4 border-signal pl-7">
                <p className="text-lg leading-relaxed text-white/75">
                  A student-led program built on year-long research, evidence, and argument. Varsity and novice squads
                  competing across the local, state, and national circuits.
                </p>
              </div>
              <div className="mt-10 flex flex-wrap gap-5">
                <ButtonLink href="/join" size="lg" variant="primary">
                  Join the team
                </ButtonLink>
                <ButtonLink href="/about" size="lg" variant="onDark">
                  About the program
                </ButtonLink>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-6 lg:col-start-8">
              <dl className="grid grid-cols-1 divide-y-2 divide-white/20 border-t-2 border-white/20 sm:grid-cols-3 sm:divide-x-2 sm:divide-y-0">
                {[
                  // Published figures are the team's own approximate, officer-
                  // edited numbers (see PUBLISHED_FIGURES), not a count this
                  // application measured — an animated tally would claim a
                  // precision the "+" already disclaims, so these render static.
                  { label: "Active debaters", value: settings["figures.activeDebaters"], measured: false },
                  { label: "Tournaments a year", value: settings["figures.tournamentsPerYear"], measured: false },
                  { label: "Weekly meetings", value: String(MEETINGS.length), measured: true },
                ].map((stat) => (
                  <div key={stat.label} className="py-8 sm:pr-4">
                    <dd className="font-display text-4xl font-extrabold leading-none tracking-tight text-white lg:text-5xl">
                      {stat.measured ? <CountUp value={stat.value} /> : stat.value}
                    </dd>
                    <dt className="mt-4 font-display text-[11px] font-bold uppercase leading-snug tracking-[0.16em] text-white/50">
                      {stat.label}
                    </dt>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        <div className="c-rule-signal absolute inset-x-0 bottom-0" aria-hidden="true" />
      </section>

      {/* ========================================================= The record */}
      <Section tone="paper">
        <div className="u-grid-12">
          <Reveal className="col-span-12 lg:col-span-4">
            <SectionHeading
              eyebrow="The record"
              title={
                <>
                  Competing
                  <br />
                  where it
                  <br />
                  counts
                </>
              }
            />
            <p className="mt-8 text-lg leading-relaxed text-ink/65">
              Results are entered by the officer team as they happen — nothing on this page is a placeholder.
            </p>
            <div className="mt-10">
              <ButtonLink href="/achievements" variant="outline">
                See the full record
              </ButtonLink>
            </div>
          </Reveal>

          <div className="col-span-12 lg:col-span-7 lg:col-start-6">
            {featured.length === 0 ? (
              <EmptyState
                title="Results are being compiled"
                action={{ href: "/news", label: "Read the latest news" }}
              />
            ) : (
              <ul className="space-y-6">
                {featured.map((achievement, index) => {
                  const participants = achievementParticipants(achievement);
                  return (
                    <Reveal as="li" key={achievement.id} delay={index * 90}>
                      <article className="relative border-2 border-rule bg-paper-raised p-8 pl-12">
                        <span className="absolute inset-y-0 left-0 w-4 bg-navy-600" aria-hidden="true" />
                        <span
                          aria-hidden="true"
                          className="absolute right-6 top-6 font-display text-5xl font-extrabold leading-none text-ink/[0.07]"
                        >
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                          <span className="border-2 border-ink bg-signal px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-paper">
                            {labelFor(ACHIEVEMENT_LEVELS, achievement.level)}
                          </span>
                          <span className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-ink/50">
                            {achievement.seasonYear}–{String(achievement.seasonYear + 1).slice(2)}
                          </span>
                        </div>

                        <h3 className="t-h3 mt-5 max-w-lg">{achievement.title}</h3>
                        <p className="mt-3 text-base text-ink/65">
                          {achievement.placement} · {achievement.tournamentName}
                          {achievement.eventName ? ` · ${achievement.eventName}` : ""}
                        </p>
                        {participants.length > 0 ? (
                          <p className="mt-5 border-t-2 border-rule-faint pt-5 font-display text-sm font-bold uppercase tracking-wide text-navy-600">
                            {participants.join(" & ")}
                          </p>
                        ) : null}
                      </article>
                    </Reveal>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </Section>

      {/* =============================================================== About */}
      <Section tone="raised" id="about">
        <div className="u-grid-12">
          <Reveal className="col-span-12 lg:col-span-6">
            <SectionHeading eyebrow="Who we are" title="Policy debate at TJ" />
            <div className="mt-10 space-y-6 text-lg leading-relaxed text-ink/70">
              <p>
                Policy Debate has a long history at Thomas Jefferson. The team competes on the local, state, and
                national circuits, sending debaters to tournaments across the East Coast and beyond.
              </p>
              <p>
                Novices learn the format from the ground up — drills, lectures, and practice rounds — while the varsity
                squad works on case construction and prepares for the national circuit. Both squads meet weekly during
                eighth period.
              </p>
            </div>
            <div className="mt-12 flex flex-wrap gap-5">
              <ButtonLink href="/about" variant="outline">
                More about the program
              </ButtonLink>
              <ButtonLink href="/officers" variant="ghost">
                Meet the officers →
              </ButtonLink>
            </div>
          </Reveal>

          <div className="col-span-12 space-y-6 lg:col-span-5 lg:col-start-8">
            {MEETINGS.map((meeting, index) => (
              <Reveal key={meeting.squad} delay={index * 100}>
                <div className="border-2 border-rule bg-paper p-8">
                  <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-rule pb-5">
                    <h3 className="t-h3">{meeting.squad}</h3>
                    <span className="font-display text-[11px] font-bold uppercase tracking-[0.14em] text-navy-600">
                      {meeting.when}
                    </span>
                  </div>
                  <p className="mt-5 text-base leading-relaxed text-ink/65">{meeting.detail}</p>
                  <a
                    href={meeting.ionActivityUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-navy-600 underline decoration-signal decoration-[3px] underline-offset-[6px] hover:text-ink"
                  >
                    Sign up on Ion <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      {/* ====================================================== What is policy */}
      <Section tone="paper">
        <SectionHeading
          eyebrow="The format"
          title="What policy debate actually is"
          description="Two-on-two, one national resolution for the whole year, and every claim backed by evidence you cut yourself."
        />

        <ul className="mt-20 grid gap-px border-2 border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {POLICY_EXPLAINER.map((card, index) => (
            <li key={card.title} className="bg-paper-raised">
              <Reveal delay={index * 80} className="h-full p-9">
                <span className="c-numeral block text-[3.5rem]">{String(index + 1).padStart(2, "0")}</span>
                <div className="c-rule-signal mt-6 w-14" aria-hidden="true" />
                <h3 className="t-h3 mt-7">{card.title}</h3>
                <p className="mt-5 text-base leading-relaxed text-ink/65">{card.body}</p>
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      {/* ========================================================== The season */}
      <section className="on-dark relative overflow-hidden bg-navy-900 u-section">
        <div className="c-grid-texture absolute inset-0" aria-hidden="true" />
        <div className="c-diagonal -left-16 top-[-30%] h-[180%] w-8 opacity-80" aria-hidden="true" />

        <div className="u-container relative">
          <SectionHeading
            eyebrow="The season"
            title="September to May, one resolution"
            description="The competitive calendar builds from early invitationals through districts and states to the national post-season."
            className="[&_h2]:text-white [&_p]:text-white/65"
          />

          <ol className="mt-20 grid gap-px border-2 border-white/20 bg-white/20 sm:grid-cols-2 lg:grid-cols-4">
            {SEASON_PHASES.map((phase, index) => (
              <li key={phase.window} className="bg-navy-900">
                <Reveal delay={index * 80} className="h-full p-9">
                  <span className="font-display text-5xl font-extrabold leading-none tracking-tight text-signal-bright">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-7 font-display text-lg font-bold uppercase leading-tight tracking-tight text-white">
                    {phase.window}
                  </p>
                  <p className="mt-4 text-base leading-relaxed text-white/60">{phase.detail}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ================================================================ News */}
      <Section tone="raised">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SectionHeading eyebrow="Latest" title="Team news" className="max-w-xl" />
          <ButtonLink href="/news" variant="ghost">
            All announcements →
          </ButtonLink>
        </div>

        <div className="mt-20">
          {news.length === 0 ? (
            <EmptyState
              title="No announcements yet"
              action={{ href: "/join", label: "Join the team" }}
            />
          ) : (
            <ul className="grid gap-8 md:grid-cols-3">
              {news.map((post, index) => (
                <Reveal as="li" key={post.id} delay={index * 80}>
                  <Link href={`/news/${post.slug}`} className="c-frame-link group flex h-full flex-col p-8">
                    <time
                      className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-navy-600"
                      dateTime={post.publishedAt?.toISOString()}
                    >
                      {formatDate(post.publishedAt)}
                    </time>
                    <h3 className="t-h3 mt-5">{post.title}</h3>
                    <p className="mt-5 line-clamp-3 text-base leading-relaxed text-ink/65">{post.excerpt}</p>
                    <span className="mt-auto pt-8 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-ink">
                      Read more →
                    </span>
                  </Link>
                </Reveal>
              ))}
            </ul>
          )}
        </div>
      </Section>

      {/* ================================================================= CTA
          Marked so the sticky mobile join bar (components/site/BottomBars.tsx)
          hides itself while this section is on screen — the page's own "How
          to join" is the same call to action, and showing both at once is
          redundant, not reinforcing. */}
      <section data-hides-sticky-join-bar className="relative overflow-hidden bg-signal">
        <div className="c-grid-texture absolute inset-0" aria-hidden="true" />
        <div className="u-container relative py-28 text-center md:py-36">
          <h2 className="t-h2 mx-auto max-w-3xl text-paper">Ready to start debating?</h2>
          <p className="mx-auto mt-10 max-w-xl text-lg leading-relaxed text-paper/80">
            Whether you have competed for years or have never given a speech, there is a place for you on TJ Policy.
            Novices are welcome all year.
          </p>
          <div className="mt-12 flex flex-wrap justify-center gap-5">
            <ButtonLink href="/join" size="lg" variant="solid">
              How to join
            </ButtonLink>
            <ButtonLink href="/contact" size="lg" variant="onDark">
              Ask a question
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
