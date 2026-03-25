type LiveDataModeEnv = Record<string, string | undefined>;

function isEnabled(value?: string) {
  if (!value) {
    return false;
  }

  return value.trim().toLowerCase() === "true";
}

export function shouldSkipLiveDataDuringBuild(env: LiveDataModeEnv = process.env) {
  return isEnabled(env.SKIP_LIVE_DATA_DURING_BUILD);
}

export function shouldUseMockData(env: LiveDataModeEnv = process.env) {
  return isEnabled(env.USE_MOCK_DATA) || shouldSkipLiveDataDuringBuild(env);
}
