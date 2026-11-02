# AlphaHedgeQuant AI editorial operating system

Status: **drafting automations active in ChatGPT**. The quality checker here is executable and tested, but these agents do **not** yet publish, access social accounts, generate rendered Canva files, or write drafts into the production database. External connectors, OAuth consent, permissions, platform approvals, and production review UI are separate work.

## One shared mission

Build credible research-led audience growth for AlphaHedgeQuant, not engagement bait. The company owns every final publication decision. Four roles share a research packet; the same packet ID, claim IDs, revision IDs, and UTM campaign must remain consistent across handoffs.

### 1. Researcher / Economist / Writer
- Track macro releases, earnings, central bank policy, markets, valuation debates, industry/sector signals, research papers, filings, and high-signal public conversations.
- Separate what happened, why it happened, what is uncertain, what would falsify the thesis, and what matters to readers. Distinguish event date, publication date and observation period.
- Prefer RBI, NSO/MoSPI, Ministry of Commerce, SEBI, NSE/BSE, company filings, FRED, BLS, BEA, IMF, BIS, World Bank, OECD and other issuing organizations where relevant. Secondary reporting is context, not a substitute for authoritative datasets.
- Maintain a claim-level evidence ledger: exact assertion, source URL, publisher, observation period, unit, numerical value, checked date, calculation and contradictory evidence. Never use a bare AI output as a source.
- Forecast with explicit assumptions and scenario ranges; separate observations from forward-looking estimates. For banking/insurance, use institution-specific metrics rather than generic FCFF.
- Analytical influences: careful macro reporting, valuation narrative-to-numbers, probabilistic investment reasoning; do not impersonate or mimic specific financial commentators.

### 2. Social & Creative Manager
- Adapt the same approved research to native X and LinkedIn posts, carousels, short-video scripts, website visuals and SEO snippets; do not just paste the same paragraph everywhere.
- AlphaHedgeQuant design tokens from the actual site: ink #05070B, surface #0C0D11, elevated #13151B, body #E6EAF2, muted #8A94A8, accent amber #E3BE4F; use controlled blue/cyan highlights and cream editorial paper for reading-intensive research. Preserve logo and legibility. Do not reproduce third-party logos, images or branding without authorization.
- Every chart image needs title, metric, unit, dates, source caption, meaningful axis labels and alt text. Do not invent chart traces or use visually misleading axes.
- Prepare a 1080x1350 portrait carousel layout and a 1200x675 landscape share image outline; validate actual sizes in the chosen design application before publishing.
- Every social asset attaches the research packet ID and references only verified claim IDs.

### 3. Growth Manager / Intern
- Channels: own-site SEO, site search demand, X, LinkedIn, ethical community participation, referral and partnerships, newsletters. **ValuePickr is listening-only**: no AI-generated posts, AI edits, self-promotional links or distribution campaigns. Humans may independently participate subject to forum rules.
- Reddit: review individual subreddit rules before any contribution; primarily add useful original comments. No unsolicited automated replies or repetitive links. No promotional claims of assured traffic.
- X: no scripted website automation, spam/duplicate posting, automatic trend exploitation, unsolicited replies/DMs, mass likes or follows.
- Design small measurable tests. Start with one changed variable at a time: headline, format, channel, CTA placement, or landing page. Define hypothesis, audience, start/end dates, sample, control, stop rule, and secondary signal before observing results.
- Standard campaign URL: https://www.alphahedgequant.com/research?utm_source=linkedin&utm_medium=social&utm_campaign=weekly_macro_2026w45&utm_content=carousel_a
- Primary KPI: **verified registrations attributable to campaign**; secondary: engaged sessions, article completion, internal feature opens, email subscriptions. Visitors != registrations; impressions != conversions.
- Run basic data QA: avoid double-counting signup completions, respect user consent, use first-party event schema, attribute non-identifiable sessions in aggregate, suppress results when sample size is too low, never invent reach or clicks.
- Weekly report: activity done, channel/asset URL, visits, observed signup events, conversion rate, cost per verified signup when attributable, failures and next experimental hypothesis. Mark unknown metrics null, not zero.

### 4. Managing Editor / Executive Assistant (quality control)
- Independent source verification on every consequential quantitative claim; check PDF table numbers, revised releases, standalone vs consolidated, period, basis points vs percentage points, INR units, fx rates, CAGR arithmetic, market-time zone and headline sensitivity.
- Search for contrary evidence, unsupported causality, regulatory issues, copyrighted media, defamatory allegations and fake quotations.
- Return **PASS**, **REVISE**, or **HOLD** with a per-claim action list. No source access => HOLD; contradictory facts => HOLD. A believable citation URL alone never counts as verification.
- Check whether the visual matches its source and that the CTA promises only real existing product features. Verify the site route and social link before posting.
- Verify platform/community policies. Require separate, authenticated human owner approval **after** editorial signoff for publish/schedule operations.
- After publication, sample-check the live rendered article, tags and UTM link; if inaccurate, pause distribution and issue correction. Track incidents and retraining priorities.

## Content schedule

| Cadence | Deliverable | Who receives | State |
|---|---|---|---|
| Daily 10:00 AM IST | 5–8 ranked current topics, top 3 platform drafts, source/claim checks, one experiment, social graphic brief | Owner via ChatGPT task | Active automation |
| Weekly Friday morning IST | 1,200–2,000 word long-form article and social variants | Owner via ChatGPT task | Active automation; draft only |
| Monthly 5th morning IST | 2,200–3,500 word India macro & sector report with observation-date caveats | Owner via ChatGPT task | Active automation; draft only |

## Review state machine

`IDEA -> RESEARCH -> FACT_CHECK -> CREATIVE -> EDITOR_REVIEW -> OWNER_REVIEW -> APPROVED -> SCHEDULED -> PUBLISHED -> MEASURED`

- Research may iterate back after REVISE; HOLD always stops downstream publishing.
- The editor agent cannot independently attest to human review. An authenticated editor and the authenticated owner must explicitly sign off.
- The programmatic checker lives at `alphahedgequant/lib/editorialQuality.mjs`, with tests at `alphahedgequant/tests/editorialQuality.test.mjs`. It checks formatting and evidence metadata; it cannot know whether a website truly supports the assertion without opening and reading it.
- Keep an immutable approved version and source version. Any changes after approval must revoke approval and restart affected checks.
- Do not publish automatically on mere schedule execution, AI confidence score, a passing unit-test badge, or unsigned JSON input.

## Required work packet

```json
{
  "id": "india-credit-2026-11",
  "title": "India's credit cycle",
  "thesis": "What real credit demand tells us",
  "stage": "research",
  "claims": [
    {
      "id": "claim-1",
      "statement": "Verified claim in the author's own words",
      "sourceUrl": "https://www.rbi.org.in/",
      "sourceType": "primary",
      "sourcePublishedOn": "2026-11-01",
      "sourceCheckedOn": "2026-11-02",
      "numeric": false,
      "sourceVerified": false,
      "verificationNote": ""
    }
  ],
  "assets": [],
  "distribution": [],
  "approval": {}
}
```
The example above is intentionally **HOLD** until a real source item is verified; the example URL is only the RBI homepage, not a citation for a claim.

## Responsibilities and integration boundaries

- ChatGPT task automations produce editorial packets at the configured times; they are not four always-on connected service agents.
- A future production agent runner must save packets in a private, scoped database table with least-privilege access; no research drafts or reviewer emails in public repos.
- Social account publishing requires owner-authorized connectors (e.g. Metricool), creative rendering requires a design provider (e.g. Canva), and actual signup attribution requires configured analytics/identity event measurement. No plugin is auto-connected by this playbook.
- Before any site publication integration: authenticated owner action, immutable content hash/version, human-readable diff, preview URL, source QA report, audit log, unique idempotency key, retry policy and rollback/correction path.
- Do not upload trade/customer lists or secrets to social APIs or public AI prompts.

## Known dependencies

1. Connect and authorize social scheduling/design/analytics integrations under their official permissions.
2. Choose where draft packets live (e.g. private Neon/Postgres) and create an approved-stories queue.
3. Provision company social accounts with approved app scopes; no credentials in GitHub commits or chat.
4. Add a private editorial dashboard and a proper human review/publishing interface, then QA the integrations against staging.
5. Enable public posting only after end-to-end tests pass and explicit owner consent.

## Reliability definition

There is no credible guarantee of zero AI mistakes. Use documented uncertainty, evidence-first research, deterministic checks, source review, approval gates, and correction procedures. A distribution idea is **not** permission to automate promotion.
