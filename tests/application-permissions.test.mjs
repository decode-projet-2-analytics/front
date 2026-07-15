import test from "node:test";
import assert from "node:assert/strict";
import { getApplicationCapabilities } from "../src/lib/application-permissions.mjs";

test("global admin receives inventory-only capabilities", () => {
  assert.deepEqual(getApplicationCapabilities("Admin", null), {
    read: false,
    manage: false,
    manageSessions: false,
    deleteApplication: false,
  });
});

test("member is read-only", () => {
  assert.deepEqual(getApplicationCapabilities("Webmaster", "member"), {
    read: true,
    manage: false,
    manageSessions: false,
    deleteApplication: false,
  });
});

test("application admin manages app but not sessions or deletion", () => {
  assert.deepEqual(getApplicationCapabilities("Webmaster", "admin"), {
    read: true,
    manage: true,
    manageSessions: false,
    deleteApplication: false,
  });
});

test("owner receives every capability", () => {
  assert.deepEqual(getApplicationCapabilities("Webmaster", "owner"), {
    read: true,
    manage: true,
    manageSessions: true,
    deleteApplication: true,
  });
});
