import test from "node:test";
import assert from "node:assert/strict";
import {
  startCookieTransition,
  stopCookieTransition,
} from "../src/lib/impersonation-policy.mjs";

test("start preserves admin token and activates impersonated token", () => {
  assert.deepEqual(startCookieTransition("admin", "webmaster"), {
    accessToken: "webmaster",
    adminToken: "admin",
  });
});

test("stop restores admin token and removes impersonation marker", () => {
  assert.deepEqual(stopCookieTransition("admin"), {
    accessToken: "admin",
    deleteAdminToken: true,
  });
});
