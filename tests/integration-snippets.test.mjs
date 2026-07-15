import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { buildIntegrationSnippets } from '../src/components/applications/integrationSnippets.ts';

const snippets = buildIntegrationSnippets({
  appId: 'app_public_123',
  apiBaseUrl: 'https://analytics.example.com/api/v1',
  tagSlug: 'purchase_confirmed',
});

describe('integration snippets', () => {
  it('uses the unified package and the browser endpoint', () => {
    assert.equal(snippets.install, 'npm install @analytics/sdk');
    assert.match(snippets.browserEnv, /NEXT_PUBLIC_ANALYTICS_APP_ID=app_public_123/);
    assert.match(snippets.browserCode, /@analytics\/sdk\/browser/);
    assert.match(snippets.browserCode, /\/collect/);
    assert.match(snippets.browserCode, /purchase_confirmed/);
    assert.doesNotMatch(snippets.browserEnv + snippets.browserCode, /APP_SECRET/);
  });

  it('keeps the secret server-only and shows the complete event contract', () => {
    assert.match(snippets.serverEnv, /^ANALYTICS_APP_SECRET=/m);
    assert.doesNotMatch(snippets.serverEnv, /NEXT_PUBLIC_ANALYTICS_APP_SECRET/);
    assert.match(snippets.serverCode, /@analytics\/sdk\/server/);
    assert.match(snippets.serverCode, /\/server-events/);
    assert.match(snippets.serverCode, /type: "purchase"/);
    assert.match(snippets.serverCode, /tagSlug: "purchase_confirmed"/);
    assert.match(snippets.serverCode, /sessionId/);
  });
});
