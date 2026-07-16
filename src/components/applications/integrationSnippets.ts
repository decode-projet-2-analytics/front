interface IntegrationSnippetOptions {
  appId: string;
  apiBaseUrl: string;
  tagSlug: string;
}

export interface IntegrationSnippets {
  install: string;
  browserEnv: string;
  browserCode: string;
  serverEnv: string;
  serverCode: string;
}

export function buildIntegrationSnippets({
  appId,
  apiBaseUrl,
  tagSlug,
}: IntegrationSnippetOptions): IntegrationSnippets {
  const normalizedApiUrl = apiBaseUrl.replace(/\/$/, "");

  return {
    install: "npm install @decode-analytics/sdk@0.1.0",
    browserEnv: `NEXT_PUBLIC_ANALYTICS_APP_ID=${appId}
NEXT_PUBLIC_ANALYTICS_API_URL=${normalizedApiUrl}`,
    browserCode: `import { init, track, getSessionId } from "@analytics/sdk/browser";

const stopAnalytics = init({
  appId: process.env.NEXT_PUBLIC_ANALYTICS_APP_ID!,
  endpoint: \`${"${process.env.NEXT_PUBLIC_ANALYTICS_API_URL}"}/collect\`,
});

track("${tagSlug}", {
  metadata: { source: "website" },
});

const sessionId = getSessionId();

export { sessionId, stopAnalytics };`,
    serverEnv: `ANALYTICS_APP_ID=${appId}
ANALYTICS_APP_SECRET=replace_with_generated_secret
ANALYTICS_API_URL=${normalizedApiUrl}`,
    serverCode: `import { createAnalyticsClient } from "@analytics/sdk/server";

const analytics = createAnalyticsClient({
  appId: process.env.ANALYTICS_APP_ID!,
  appSecret: process.env.ANALYTICS_APP_SECRET!,
  endpoint: \`${"${process.env.ANALYTICS_API_URL}"}/server-events\`,
});

export async function trackPurchase(sessionId: string) {
  await analytics.track({
    type: "purchase",
    tagSlug: "${tagSlug}",
    sessionId,
    payload: { amount: 49.99, currency: "EUR" },
    metadata: { source: "server" },
  });
}`,
  };
}
