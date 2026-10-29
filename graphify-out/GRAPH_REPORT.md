# Graph Report - TJeffersonPolicy  (2026-10-28)

## Corpus Check
- 218 files · ~121,143 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 13 file(s) not represented in the graph (top: (none) 6, .example 1, .log 1)

## Summary
- 1221 nodes · 4630 edges · 56 communities (48 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 28 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cc3e4079`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- PageHeading
- (site)/page.tsx
- Icons.tsx
- guards.ts
- schemas.ts
- requireOfficerApi
- Content review
- constants.ts
- ion.ts
- cn
- db.ts
- news-template.ts
- FormBuilder.tsx
- next
- forms.ts
- session.ts
- package.json
- Button
- readParams
- BottomBars.tsx
- scripts
- compilerOptions
- jsonOk
- States.tsx
- HttpError
- Alert
- OfficerEditor.tsx
- ResourceEditor.tsx
- Architecture
- dependencies
- orders.ts
- dues.ts
- devDependencies
- External integrations
- security.test.ts
- Product
- callback/route.ts
- Security
- env.ts
- domain.test.ts
- Button.tsx
- ProfileForm.tsx
- seed.ts
- 2026-09-13T02-54-09Z__app-site-page-tsx.md
- 2026-09-13T03-10-12Z__app-site-page-tsx.md
- FormBuilder
- apple-icon.tsx
- eslint.config.mjs
- proxy.ts
- OnboardingTour
- AGENTS.md
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `next` - 97 edges
2. `PageHeading()` - 74 edges
3. `EmptyState()` - 67 edges
4. `Alert()` - 61 edges
5. `jsonOk()` - 57 edges
6. `ButtonLink()` - 56 edges
7. `requireOfficerApi()` - 55 edges
8. `recordAudit()` - 53 edges
9. `cn()` - 53 edges
10. `Card()` - 52 edges

## Surprising Connections (you probably didn't know these)
- `What this app deliberately does not do` --references--> `DevAuthProvider`  [INFERRED]
  docs/INTEGRATIONS.md → lib/auth/dev.ts
- `Strings instead of enums` --references--> `labelFor()`  [INFERRED]
  docs/ARCHITECTURE.md → lib/constants.ts
- `Capabilities and Constraints` --references--> `withApi()`  [INFERRED]
  PRODUCT.md → lib/http/api.ts
- `What this app does with it` --references--> `extractTournamentMetadata()`  [INFERRED]
  docs/INTEGRATIONS.md → lib/integrations/tabroom.ts
- `Dues are computed, not entered {#dues-are-computed-not-entered}` --references--> `seasonBalance()`  [INFERRED]
  docs/ARCHITECTURE.md → lib/services/dues.ts

## Import Cycles
- None detected.

## Communities (56 total, 8 thin omitted)

### Community 0 - "PageHeading"
Cohesion: 0.05
Nodes (159): AnalyticsPage(), metadata, AuditPage(), chip(), metadata, PageProps, AdminDuesPage(), metadata (+151 more)

### Community 1 - "(site)/page.tsx"
Cohesion: 0.05
Nodes (91): archivo, inter, metadata, RootLayout(), viewport, alt, contentType, size (+83 more)

### Community 2 - "Icons.tsx"
Cohesion: 0.08
Nodes (51): AdminLayout(), metadata, DevSignInPage(), dynamic, metadata, metadata, PortalLayout(), AppShell() (+43 more)

### Community 3 - "guards.ts"
Cohesion: 0.10
Nodes (34): generateMetadata(), GET(), GET(), PATCH, onboardingSchema, POST, POST, POST (+26 more)

### Community 4 - "schemas.ts"
Cohesion: 0.05
Nodes (36): RFC-4180, csvCell(), toCsv(), achievementLevelSchema, achievementSchema, centsSchema, debateEventSchema, formFieldInputSchema (+28 more)

### Community 5 - "requireOfficerApi"
Cohesion: 0.16
Nodes (29): PUT, DELETE, PUT, POST, DELETE, PATCH, POST, DELETE (+21 more)

### Community 6 - "Content review"
Cohesion: 0.06
Nodes (30): 10. Demo records — delete before launch, 1. Two different Discord invites — needs a decision, 2. A second contact address — probably obsolete, 3. "50+ debaters" and "10+ tournaments a year" — unverifiable claims, 4. Competitive claims without specifics — resolved by omission, 5. Officer roster — 2025–26, needs re-election update, 6. Constitution PDF — dated 2025-09-08, 7. Ion activity IDs — verify each September (+22 more)

### Community 7 - "constants.ts"
Cohesion: 0.07
Nodes (29): AchievementLevel, CHOICE_FIELD_TYPES, DebateEvent, DuesStatus, FORM_FIELD_TYPES, FORM_STATUSES, FormStatus, MEMBER_STATUSES (+21 more)

### Community 8 - "ion.ts"
Cohesion: 0.14
Nodes (13): toggle(), change(), DevAuthProvider, ACCEPTED_USER_TYPES, base64url(), IonAuthProvider, IonProfile, normaliseIonProfile() (+5 more)

### Community 9 - "cn"
Cohesion: 0.17
Nodes (16): DuesWaiverControl(), MemberControls(), SettingsForm(), Question(), OrderForm(), DivisionOption, RegisterForm(), RegisterFormDefaults (+8 more)

### Community 10 - "db.ts"
Cohesion: 0.12
Nodes (23): DELETE, PATCH, POST, createPrismaClient(), disconnectAfterResponse(), globalForPrisma, requestClients, requestScope() (+15 more)

### Community 11 - "news-template.ts"
Cohesion: 0.12
Nodes (21): buildNewsEmail(), escape(), NewsEmailContent, NewsEmailPost, newsPostUrl(), newsRecipients(), RecipientSource, describeFailure() (+13 more)

### Community 12 - "FormBuilder.tsx"
Cohesion: 0.15
Nodes (18): save(), draftFromForm(), emptyFormDraft, FieldDraft, FormDraft, DivisionDraft, draftFromTournament(), emptyDraft (+10 more)

### Community 13 - "next"
Cohesion: 0.18
Nodes (13): SettingField, SettingGroup, InlineCheckbox(), STEPS, TourStep, api, ApiError, ApiFieldErrors (+5 more)

### Community 14 - "forms.ts"
Cohesion: 0.15
Nodes (19): POST, PUT, parseRecord(), parseStringList(), serializeStringList(), Answers, AnswerValue, assertStructureUnchanged() (+11 more)

### Community 15 - "session.ts"
Cohesion: 0.13
Nodes (19): ERROR_MESSAGES, metadata, PageProps, SignInPage(), baseCookieOptions, createSession(), CSRF_COOKIE, destroySession() (+11 more)

### Community 16 - "package.json"
Cohesion: 0.09
Nodes (20): name, private, version, clsx, jose, motion, @neondatabase/serverless, @opennextjs/cloudflare (+12 more)

### Community 17 - "Button"
Cohesion: 0.12
Nodes (11): DeleteMemberControl(), EmailStatus(), emptyNewsDraft, MARKDOWN_HELP, NewsDraft, NewsEditor(), NewsEmailState, DangerZone() (+3 more)

### Community 18 - "readParams"
Cohesion: 0.24
Nodes (15): DELETE, PATCH, DELETE, PATCH, destroyAllSessionsForUser(), isListedOfficer(), readParams(), removeOfficerProfile() (+7 more)

### Community 19 - "BottomBars.tsx"
Cohesion: 0.19
Nodes (16): PublicLayout(), BottomBars(), CookieNotice, CTA_HIDDEN_ON, getAckServerSnapshot(), getAckSnapshot(), getCtaSectionServerSnapshot(), getCtaSectionSnapshot() (+8 more)

### Community 20 - "scripts"
Cohesion: 0.11
Nodes (19): scripts, build, cf-typegen, db:deploy, db:generate, db:migrate, db:reset, db:seed (+11 more)

### Community 21 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 22 - "jsonOk"
Cohesion: 0.32
Nodes (13): generateMetadata(), POST, DELETE, PATCH, POST, jsonOk(), deleteNewsPost(), describeNewsEmailOutcome() (+5 more)

### Community 23 - "States.tsx"
Cohesion: 0.21
Nodes (9): PortalLoading(), Answers, ResponseField, ResponseForm(), showErrors(), submit(), PortalLoading(), LoadingRows() (+1 more)

### Community 24 - "HttpError"
Cohesion: 0.23
Nodes (12): POST, HttpError, asString(), extractTournamentMetadata(), fetchTournament(), parseTabroomDate(), parseTabroomReference(), TabroomEvent (+4 more)

### Community 25 - "Alert"
Cohesion: 0.20
Nodes (10): blank, CatalogueEditor(), startEdit(), CatalogueItem, Draft, draftFrom(), CataloguePage(), metadata (+2 more)

### Community 26 - "OfficerEditor.tsx"
Cohesion: 0.20
Nodes (8): MemberOption, OfficerEditor(), OfficerRow, AdminOfficersPage(), metadata, listOfficerProfiles(), officerEvents(), listMembers()

### Community 27 - "ResourceEditor.tsx"
Cohesion: 0.19
Nodes (8): AdminResourcesPage(), metadata, blank, Draft, ResourceEditor(), ResourceItem, listResourcesForUser(), resourceTags()

### Community 28 - "Architecture"
Cohesion: 0.14
Nodes (11): Accessibility, Architecture, Data model, Design system, Dues are computed, not entered {#dues-are-computed-not-entered}, Registration details are a snapshot, not a profile lookup {#registration-snapshot}, Registrations and orders share one workflow, Request flow (+3 more)

### Community 29 - "dependencies"
Cohesion: 0.14
Nodes (14): dependencies, clsx, jose, motion, @neondatabase/serverless, next, @opennextjs/cloudflare, @prisma/adapter-neon (+6 more)

### Community 30 - "orders.ts"
Cohesion: 0.26
Nodes (9): GET(), PATCH, POST, createOrder(), listOrdersForOfficers(), ordersToCsv(), updateOrderAsOfficer(), createOrderSchema (+1 more)

### Community 31 - "dues.ts"
Cohesion: 0.23
Nodes (12): deriveStatus(), DuesStatusLabel, FeeBearingOrder, FeeBearingRegistration, listOwnDuesHistory(), listOwnUnpaidItems(), MemberSeasonBalance, OWED_STATUSES (+4 more)

### Community 32 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, eslint, eslint-config-next, prisma, tailwindcss, @tailwindcss/postcss, tsx, @types/node (+5 more)

### Community 33 - "External integrations"
Cohesion: 0.17
Nodes (11): External integrations, MySchoolBucks and the NSDA — links only, openCaselist — deep links only, by decision, Tabroom — implemented, read-only, TJ Ion — implemented, Turning it on, What it does not do, What this app deliberately does not do (+3 more)

### Community 34 - "security.test.ts"
Cohesion: 0.20
Nodes (10): parseOfficerList(), RATE_LIMITS, resetRateLimits(), Window, windows, externalUrlSchema, updateProfileSchema, member (+2 more)

### Community 35 - "Product"
Cohesion: 0.17
Nodes (11): Accessibility & Inclusion, Brand Commitments, Capabilities and Constraints, Evidence on Hand, Operating Context, Platform, Positioning, Product (+3 more)

### Community 36 - "callback/route.ts"
Cohesion: 0.44
Nodes (8): failure(), GET(), GET(), safeRedirect(), authProvider(), callbackUrl(), clientKey(), upsertUserFromProfile()

### Community 37 - "Security"
Cohesion: 0.20
Nodes (11): Audit, Authentication, Deliberately absent, Injection and output safety, Known limitations, Privacy, Reporting a problem, Request integrity (+3 more)

### Community 38 - "env.ts"
Cohesion: 0.22
Nodes (5): dynamic, env, isProduction, listedOfficerUsernames, schema

### Community 39 - "domain.test.ts"
Cohesion: 0.24
Nodes (7): asKey(), DUES_STATUSES, MYSCHOOLBUCKS_HOME, NSDA_MEMBERSHIP_INFO, currentCaselistSlug(), openCaselist, pluralize()

### Community 40 - "Button.tsx"
Cohesion: 0.22
Nodes (7): metadata, NotFound(), CommonProps, Size, sizes, Variant, variants

### Community 41 - "ProfileForm.tsx"
Cohesion: 0.25
Nodes (5): ProfileForm(), ProfileFormValues, Section(), TextKey, DEBATE_EVENTS

### Community 42 - "seed.ts"
Cohesion: 0.33
Nodes (8): setDuesWaiver(), SETTING_DEFAULTS, DEMO, main(), prisma, seedCatalogue(), seedDemo(), seedSettings()

### Community 43 - "2026-09-13T02-54-09Z__app-site-page-tsx.md"
Cohesion: 0.25
Nodes (7): Design Health Score, Design Specificity Verdict, Minor Observations, Persona Red Flags, Priority Issues, Questions to Consider, What's Working

### Community 44 - "2026-09-13T03-10-12Z__app-site-page-tsx.md"
Cohesion: 0.25
Nodes (7): Design Health Score, Design Specificity Verdict, Minor Observations, Persona Red Flags, Priority Issues, Questions to Consider, What's Working

### Community 45 - "FormBuilder"
Cohesion: 0.43
Nodes (5): FormBuilder(), addField(), moveField(), removeField(), update()

### Community 47 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): eslintConfig, eslint, eslint-config-next

### Community 48 - "proxy.ts"
Cohesion: 0.67
Nodes (3): analyticsOriginFrom(), config, proxy()

## Knowledge Gaps
- **14 isolated node(s):** `RFC-4180`, `@neondatabase/serverless`, `jose`, `motion`, `react-dom` (+9 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 441 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `PageHeading`, `(site)/page.tsx`, `Icons.tsx`, `guards.ts`, `requireOfficerApi`, `cn`, `db.ts`, `FormBuilder.tsx`, `session.ts`, `package.json`, `Button`, `BottomBars.tsx`, `States.tsx`, `Alert`, `OfficerEditor.tsx`, `ResourceEditor.tsx`, `callback/route.ts`, `env.ts`, `Button.tsx`, `ProfileForm.tsx`, `apple-icon.tsx`, `proxy.ts`?**
  _High betweenness centrality (0.218) - this node is a cross-community bridge._
- **What connects `RFC-4180`, `@neondatabase/serverless`, `jose` to the rest of the system?**
  _14 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `PageHeading` be split into smaller, more focused modules?**
  _Cohesion score 0.051602204555430915 - nodes in this community are weakly interconnected._
- **Why does `withApi()` connect `guards.ts` to `Product`, `callback/route.ts`, `requireOfficerApi`, `Security`, `db.ts`, `forms.ts`, `session.ts`, `readParams`, `jsonOk`, `HttpError`, `orders.ts`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Should `(site)/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05028571428571429 - nodes in this community are weakly interconnected._
- **Why does `Security` connect `Security` to `guards.ts`, `Architecture`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Should `Icons.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08221153846153846 - nodes in this community are weakly interconnected._