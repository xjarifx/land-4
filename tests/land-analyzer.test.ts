import assert from "node:assert/strict";
import test from "node:test";
import { analyzeLandCase } from "../lib/land-analyzer";
import { getAnalysisInput, lookupRegisteredDeed } from "../lib/registry-lookup";

test("DEMO-1001 produces high risk and a broken title chain", () => {
  const record = lookupRegisteredDeed("DEMO-1001");
  assert.ok(record);
  const report = analyzeLandCase(getAnalysisInput(record));
  assert.equal(report.double_selling_risk_level, "High");
  assert.equal(report.chain_of_title_status, "Broken");
  assert.match(report.identified_loopholes_and_flags.join(" "), /plot numbers/i);
});

test("DEMO-2002 produces low risk with a valid title chain", () => {
  const record = lookupRegisteredDeed("DEMO-2002");
  assert.ok(record);
  const report = analyzeLandCase(getAnalysisInput(record));
  assert.equal(report.double_selling_risk_level, "Low");
  assert.equal(report.chain_of_title_status, "Valid");
});

test("analyzer identifies an incomplete chain", () => {
  const record = lookupRegisteredDeed("DEMO-2002");
  assert.ok(record);
  const report = analyzeLandCase({
    ...getAnalysisInput(record),
    chainComplete: false
  });
  assert.equal(report.chain_of_title_status, "Incomplete");
  assert.match(report.identified_loopholes_and_flags.join(" "), /intermediate transfer deeds/i);
});
