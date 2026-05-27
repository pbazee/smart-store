type LiveDataModeEnv = Record<string, string | undefined>;

function isEnabled(value?: string) {
  if (!value) {
    return false;
  }

  return value.trim().toLowerCase() === "true";
}

function isBuildPhase(env: LiveDataModeEnv) {
  return env.NEXT_PHASE === "phase-production-build";
}

export function isProductionRuntime(env: LiveDataModeEnv = process.env) {
  return env.NODE_ENV === "production" && !isBuildPhase(env);
}

export function shouldSkipLiveDataDuringBuild(env: LiveDataModeEnv = process.env) {
  return isBuildPhase(env) && isEnabled(env.SKIP_LIVE_DATA_DURING_BUILD);
}

export function shouldUseMockData(env: LiveDataModeEnv = process.env) {
  if (isProductionRuntime(env)) {
    return false;
  }

  return isEnabled(env.USE_MOCK_DATA) || shouldSkipLiveDataDuringBuild(env);
}
