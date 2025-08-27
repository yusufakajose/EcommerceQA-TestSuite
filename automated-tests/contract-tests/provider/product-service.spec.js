/* eslint-disable no-redeclare */
const { Verifier } = require('@pact-foundation/pact');
const path = require('path');

// Simple provider app bootstrap (only if needed by local verification)
// The existing project includes a sample provider implementation at
// automated-tests/contract-tests/provider/product-service.js
// Start your provider separately if required.

describe('Pact Verification', () => {
  it('validates the expectations of ProductService', () => {
    const baseUrl = process.env.PROVIDER_BASE_URL || 'http://localhost:8081';
    const brokerUrl = process.env.PACT_BROKER_BASE_URL || process.env.PACT_BROKER_URL;
    const brokerToken = process.env.PACT_BROKER_TOKEN || process.env.PACT_BROKER_PASSWORD;
    const branch =
      process.env.GIT_BRANCH ||
      process.env.BRANCH_NAME ||
      process.env.BUILD_SOURCEBRANCHNAME ||
      'main';
    const providerVersion =
      process.env.GIT_COMMIT || process.env.BUILD_SOURCEVERSION || 'dev-local';

    /**
     * If a Pact Broker is configured via env, verify against the Broker
     * and publish verification results. Otherwise, verify against local pact file.
     */
    const useBroker = Boolean(brokerUrl);

    /** @type {import('@pact-foundation/pact').VerifierOptions} */
    const opts = useBroker
      ? {
          providerBaseUrl: baseUrl,
          // Broker configuration
          brokerUrl,
          // Prefer token auth; basic auth also supported via brokerUsername/brokerPassword
          brokerToken,
          publishVerificationResult: true,
          providerVersion,
          providerVersionBranch: branch,
          enablePending: true,
          includeWipPactsSince: new Date().toISOString().split('T')[0], // today
          // Verify pacts for consumers that are deployed or released
          consumerVersionSelectors: [
            { deployedOrReleased: true },
            { branch: 'main', latest: true },
          ],
        }
      : {
          providerBaseUrl: baseUrl,
          pactUrls: [path.resolve(process.cwd(), 'pacts', 'EcommerceWebApp-ProductService.json')],
        };

    return new Verifier(opts).verifyProvider().then((output) => {
      console.log('Pact Verification Complete!');
      console.log(output);
    });
  });
});
