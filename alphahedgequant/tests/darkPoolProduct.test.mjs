import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const root = new URL("../", import.meta.url);
const read = path => readFileSync(new URL(path, root), "utf8");

test("Dark Pool and ECN Tracker is a public, indexable product", () => {
  const page = read("app/dark-pool/page.jsx");
  const nav = read("components/Nav.jsx");
  const middleware = read("middleware.js");
  const sitemap = read("app/sitemap.js");

  assert.match(page, /Dark Pool & ECN Tracker/);
  assert.match(page, /canonical: "\/dark-pool"/);
  assert.match(page, /isAccessibleForFree: true/);
  assert.match(nav, /href: "\/dark-pool", label: "Dark Pool & ECN Tracker"/);
  assert.match(middleware, /"\/dark-pool\(\.\*\)"/);
  assert.match(sitemap, /"\/dark-pool"/);
});

test("Tracker clearly identifies weekly historical data and source publication lag", () => {
  const page = read("app/dark-pool/page.jsx");

  assert.match(page, /HISTORICAL · DELAYED/);
  assert.match(page, /Latest published week/);
  assert.match(page, /~2 weeks/);
  assert.match(page, /~4 weeks/);
  assert.match(page, /reporting week, first publication date and last source-update date/);
  assert.match(page, /not a live scanner/i);
});

test("Tracker does not invent trade-level data or overstate what aggregates reveal", () => {
  const page = read("app/dark-pool/page.jsx");

  assert.match(page, /No sample prints, synthetic venue rankings or invented weekly totals/);
  assert.match(page, /do not identify the buyer, seller, beneficial owner, trade direction/);
  assert.match(page, /ATS and non-ATS OTC activity stay in separate categories/);
  assert.match(page, /applicable display rights are confirmed/);
});

test("Tracker attributes FINRA and SEC sources", () => {
  const page = read("app/dark-pool/page.jsx");

  assert.match(page, /developer\.finra\.org/);
  assert.match(page, /sec\.gov\/foia\/frequently-requested-documents\/alternative-trading-system-ats-list/);
  assert.match(page, /sec\\.gov\\/divisions\\/marketreg\\/form-ats-n-filings/);
  assert.match(page, /FINRA's applicable Equity Data terms/);
});
