import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section } from "@/components/site/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { CLUB } from "@/lib/content/club";
import { breadcrumbSchema } from "@/lib/schema";
import { pageMetadata } from "@/lib/seo";
import { LegalBody, LegalSection, LegalUpdated } from "../legal-parts";

export const metadata: Metadata = pageMetadata({
  title: "Privacy",
  description:
    "What TJ Policy Debate stores about members, why, who can see it, and how to have it removed. Two strictly-necessary cookies, cookieless analytics, no advertising trackers.",
  path: "/privacy",
});

/**
 * Written against what the code actually does rather than from a template.
 * Every claim here is checkable: the cookies are set in lib/auth/session.ts,
 * the stored fields are the User and TournamentRegistration models in
 * prisma/schema.prisma, and the deletion path is the officer control in
 * app/admin/members/[id]/DeleteMemberControl.tsx.
 *
 * If any of those change, this page has to change with them.
 */
export default function PrivacyPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema([{ name: "Privacy", path: "/privacy" }])} />

      <PageHero
        eyebrow="Privacy"
        title="What we store, and why"
        description="This site is run by the student officer team. It holds only what is needed to enter the squad in tournaments and keep track of dues — nothing is sold, and nothing is shared for advertising."
        index="05"
      />

      <Section tone="raised">
        <LegalBody>
          <LegalUpdated />

          <LegalSection title="Who runs this site">
            <p>
              TJ Policy Debate is a student activity at {CLUB.school}. The site is built and maintained by the elected
              officer team. Questions about anything on this page go to{" "}
              <a href={`mailto:${CLUB.email}`} className="legal-link">
                {CLUB.email}
              </a>
              .
            </p>
          </LegalSection>

          <LegalSection title="Signing in">
            <p>
              Sign-in goes through <strong>Ion</strong>, the school&rsquo;s own intranet, using OAuth. You enter your
              password on <code>ion.tjhsst.edu</code> and never on this site. We never see it, never receive it, and
              never store it.
            </p>
            <p>
              When Ion confirms who you are, it returns your name, Ion username, school email, grade, and graduation
              year. Those are stored so officers can tell members apart and enter the right people on Tabroom. Your
              school email is only copied from Ion while it is blank; after that it is yours to edit.
            </p>
          </LegalSection>

          <LegalSection title="What is stored about a member">
            <p>Once you have signed in, the site may hold:</p>
            <ul>
              <li>
                <strong>From Ion:</strong> name, Ion username, grade, and graduation year, which refresh each time you
                sign in, and your school email, which is filled in once.
              </li>
              <li>
                <strong>You provide:</strong> a personal email, school email, phone number, preferred partner, NSDA
                member ID, and the events you compete in.
              </li>
              <li>
                <strong>Your parent or guardian:</strong> an email address and phone number, which you enter. Officers
                use them for tournament travel and emergencies, and team news emails are copied to the parent address.
              </li>
              <li>
                <strong>Form answers:</strong> whatever you enter in a form officers create — a permission slip, a
                t-shirt size, your availability for a weekend.
              </li>
              <li>
                <strong>Tournament entries:</strong> for each registration, your partner&rsquo;s name, your school and
                Tabroom email addresses, your phone number, your grade at the time, your partner&rsquo;s school email,
                and any note you add. This is collected fresh per tournament because officers need an accurate snapshot
                for Tabroom entry and day-of contact.
              </li>
              <li>
                <strong>Money owed:</strong> tournament fees and apparel orders, and whether an officer has marked each
                one paid. This site never takes a payment and never sees card or bank details — payment happens on
                MySchoolBucks.
              </li>
              <li>
                <strong>Results:</strong> awards and placements an officer records.
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="Cookies">
            <p>Two cookies, both strictly necessary. Neither is used for advertising or tracking.</p>
            <ul>
              <li>
                <code>tjpd_session</code> — proves you are signed in. It holds a random token and nothing else: no name,
                no role, no ID. It expires after 7 days, or immediately when you sign out.
              </li>
              <li>
                <code>tjpd_csrf</code> — blocks a malicious page from submitting a form to this site as you.
              </li>
            </ul>
            <p>
              Because both are required for the site to function at all, there is no consent toggle for them. Declining
              them is the same as not signing in.
            </p>
          </LegalSection>

          <LegalSection title="Analytics">
            <p>
              If analytics is enabled on this deployment, it is{" "}
              <a href="https://plausible.io/data-policy" className="legal-link" target="_blank" rel="noopener noreferrer">
                Plausible
              </a>
              , which sets no cookie and stores no device fingerprint or identifier. It records page views, referrer,
              and coarse device type in aggregate. It cannot follow you across sites and cannot be tied back to you.
            </p>
            <p>There are no advertising networks, no social media pixels, and no session-recording tools on this site.</p>
          </LegalSection>

          <LegalSection title="Email">
            <p>
              When officers publish a news post, it is emailed to each active member&rsquo;s personal address (or school
              address, if no personal one is on file) and to their parent or guardian&rsquo;s address. Each person gets
              their own copy — no email lists every family&rsquo;s address to every other family.
            </p>
            <p>
              Delivery is handled by{" "}
              <a href="https://resend.com/legal/privacy-policy" className="legal-link" target="_blank" rel="noopener noreferrer">
                Resend
              </a>
              , an email service that receives each recipient&rsquo;s address and the message in order to deliver it.
              It is not given anything else about you. There is no automatic unsubscribe: every active member and parent
              on file receives these. If a parent or guardian would rather not, tell an officer.
            </p>
          </LegalSection>

          <LegalSection title="Security records">
            <p>
              Administrative actions — role changes, dues updates, publishing — are written to an audit log so a mistake
              can be traced. Each entry records who acted, what they did, and when.
            </p>
            <p>
              Sign-in records store your browser&rsquo;s user-agent string and a <strong>hashed</strong> form of your IP
              address. The IP is never stored in readable form; it is put through a one-way hash with a secret key, so
              it can be matched against itself but not read back.
            </p>
          </LegalSection>

          <LegalSection title="Who can see your information">
            <ul>
              <li>
                <strong>You</strong> see everything about yourself in the member portal.
              </li>
              <li>
                <strong>Officers</strong> see member records — including parent or guardian contact details —
                registrations, dues, orders, and form answers. That is the job: they enter the squad on Tabroom, arrange
                travel, and chase fees.
              </li>
              <li>
                <strong>The public</strong> sees only the officer roster and anything an officer deliberately publishes
                to the public news or results pages. Members-only news posts, dues, orders, registrations, form answers,
                phone numbers, email addresses, and parent details are never shown publicly.
              </li>
            </ul>
            <p>
              Your information is not sold, rented, or given to advertisers. Entering a tournament necessarily means
              your name and details are given to that tournament&rsquo;s host through Tabroom, which runs under its own
              privacy policy.
            </p>
          </LegalSection>

          <LegalSection title="Keeping and deleting information">
            <p>
              Records are kept while you are on the team and for a period afterwards so the club keeps an accurate
              competitive history.
            </p>
            <p>
              You can ask an officer to delete your account. Doing so permanently removes your profile (including your
              parent or guardian&rsquo;s details), registrations, dues history, orders, awards, and form answers. Content you wrote for the team — a news post, for instance — stays up
              but is no longer attributed to your account. Deletion cannot be undone; signing in again creates a new,
              empty account.
            </p>
            <p>
              Most details, including your school email and your parent or guardian&rsquo;s, can be corrected on your
              profile page. For your name or grade, update your Ion profile and sign in again — the site re-reads them
              each time. Anything else, ask an officer or email{" "}
              <a href={`mailto:${CLUB.email}`} className="legal-link">
                {CLUB.email}
              </a>
              .
            </p>
          </LegalSection>

          <LegalSection title="Students under 13">
            <p>
              This site is for students at {CLUB.schoolShort}, who are generally 14 or older. It is not directed at
              children under 13 and we do not knowingly create accounts for them. If you believe one exists, contact an
              officer and it will be removed.
            </p>
          </LegalSection>

          <LegalSection title="Changes">
            <p>
              If what the site stores changes, this page changes with it. The date at the top is the last time it was
              revised.
            </p>
          </LegalSection>

          <LegalSection title="A note on scope">
            <p className="legal-note">
              This page describes how a student-run club website handles information. It is a plain-language
              description of the software&rsquo;s actual behaviour, not legal advice, and it is not a statement of
              compliance with any particular regulation. School policy governs where the two differ — if this site is
              adopted officially, the school&rsquo;s administration should review this page first.
            </p>
          </LegalSection>

          <p className="legal-footer">
            See also the{" "}
            <Link href="/terms" className="legal-link">
              terms of use
            </Link>
            .
          </p>
        </LegalBody>
      </Section>
    </>
  );
}
