import test from "node:test";
import assert from "node:assert/strict";

import { shouldShowDashboardNav } from "../src/lib/backofficeNavigation.mjs";

test("hides the dashboard navigation entry from administrators", () => {
  assert.equal(shouldShowDashboardNav(true), false);
});

test("keeps the dashboard navigation entry for webmasters", () => {
  assert.equal(shouldShowDashboardNav(false), true);
});
