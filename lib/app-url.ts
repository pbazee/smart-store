/**
 * Get the application URL for the current environment.
 * Critical for: metadata, OAuth callbacks, email links, etc.
 */
export function getAppUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!appUrl) {
    const isDev = process.env.NODE_ENV === "development";
    const fallback = isDev ? "http://localhost:3000" : "https://smart-store-iota.vercel.app";
    
    console.warn(
      `[AppUrl] NEXT_PUBLIC_APP_URL not set. Using fallback: ${fallback}. ` +
      `This is OK in development, but MUST be set in production environments.`
    );
    
    return fallback;
  }

  return appUrl;
}

/**
 * Verify that the app URL is properly configured for production.
 * Call this during server startup to catch configuration issues early.
 */
export function validateAppUrlConfiguration(): void {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const isProd = process.env.NODE_ENV === "production";

  if (isProd && !appUrl) {
    console.error(
      "[AppUrl] CRITICAL: NEXT_PUBLIC_APP_URL is not set in production. " +
      "This will cause broken metadata, OAuth redirects, and email links. " +
      "Please set NEXT_PUBLIC_APP_URL in your Vercel environment variables."
    );
  }

  if (appUrl?.includes("localhost") && isProd) {
    console.error(
      "[AppUrl] CRITICAL: NEXT_PUBLIC_APP_URL contains 'localhost' in production. " +
      "This will break all external links and OAuth. " +
      `Current value: ${appUrl}`
    );
  }
}
