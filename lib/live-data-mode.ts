type LiveDataEnv = {
  USE_MOCK_DATA?: string;
  SKIP_LIVE_DATA_DURING_BUILD?: string;
};

export function shouldUseMockData(env: LiveDataEnv = process.env as LiveDataEnv) {
  return env.USE_MOCK_DATA === "true" || env.SKIP_LIVE_DATA_DURING_BUILD === "true";
}

export function shouldSkipLiveDataDuringBuild(env: LiveDataEnv = process.env as LiveDataEnv) {
  return env.SKIP_LIVE_DATA_DURING_BUILD === "true";
}