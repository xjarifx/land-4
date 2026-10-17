import assert from "node:assert/strict";
import test from "node:test";
import { lookupRegisteredDeed } from "../lib/registry-lookup";

test("lookup is case-insensitive and trims input", () => {
  assert.equal(lookupRegisteredDeed(" demo-1001 ")?.status, "STOP");
  assert.equal(lookupRegisteredDeed("DEMO-2002")?.status, "CLEAR");
});

test("unknown deeds return no synthetic match", () => {
  assert.equal(lookupRegisteredDeed("UNKNOWN-9999"), null);
});
