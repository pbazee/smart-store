import { test } from "node:test";
import assert from "node:assert/strict";
import { shouldSkipLiveDataDuringBuild, shouldUseMockData } from "../lib/live-data-mode";

test("build flag forces mock data without changing runtime env semantics", () => {
  assert.equal(shouldUseMockData({ USE_MOCK_DATA: "true", SKIP_LIVE_DATA_DURING_BUILD: "false" }), true);
  assert.equal(
    shouldUseMockData({
      USE_MOCK_DATA: "false",
      SKIP_LIVE_DATA_DURING_BUILD: "true",
      NEXT_PHASE: "phase-production-build",
    }),
    true
  );
  assert.equal(shouldUseMockData({ USE_MOCK_DATA: "false", SKIP_LIVE_DATA_DURING_BUILD: "false" }), false);
  assert.equal(
    shouldSkipLiveDataDuringBuild({
      SKIP_LIVE_DATA_DURING_BUILD: "true",
      NEXT_PHASE: "phase-production-build",
    }),
    true
  );
  assert.equal(shouldSkipLiveDataDuringBuild({ SKIP_LIVE_DATA_DURING_BUILD: "false" }), false);
});
