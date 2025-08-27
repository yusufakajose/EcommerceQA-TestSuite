#!/usr/bin/env bash
set -euo pipefail

# Publish generated pacts in ./pacts to a Pact Broker
# Requires: PACT_BROKER_BASE_URL and auth (PACT_BROKER_TOKEN or PACT_BROKER_USERNAME+PACT_BROKER_PASSWORD)
# Also requires: CONSUMER_VERSION (recommended: commit SHA), and optionally BRANCH

if ! command -v pact-broker >/dev/null 2>&1; then
  echo "Installing pact-broker CLI via Ruby gem (pact_broker-client)..."
  gem install pact_broker-client --no-document >/dev/null
fi

PACT_DIR=${PACT_DIR:-"pacts"}
BROKER_URL=${PACT_BROKER_BASE_URL:-${PACT_BROKER_URL:-}}
TOKEN=${PACT_BROKER_TOKEN:-}
USER=${PACT_BROKER_USERNAME:-}
PASS=${PACT_BROKER_PASSWORD:-}
CONSUMER_VERSION=${CONSUMER_VERSION:-${GIT_COMMIT:-${BUILD_SOURCEVERSION:-"dev-local"}}}
BRANCH=${BRANCH:-${GIT_BRANCH:-${BUILD_SOURCEBRANCHNAME:-"main"}}}

if [[ -z "$BROKER_URL" ]]; then
  echo "PACT_BROKER_BASE_URL is required" >&2
  exit 1
fi

if [[ ! -d "$PACT_DIR" ]]; then
  echo "Pact directory '$PACT_DIR' not found; ensure consumer tests have generated pacts." >&2
  exit 1
fi

authArgs=()
if [[ -n "$TOKEN" ]]; then
  authArgs+=( --broker-token "$TOKEN" )
elif [[ -n "$USER" && -n "$PASS" ]]; then
  authArgs+=( --broker-username "$USER" --broker-password "$PASS" )
else
  echo "Either PACT_BROKER_TOKEN or PACT_BROKER_USERNAME/PASSWORD must be set" >&2
  exit 1
fi

set -x
pact-broker publish "$PACT_DIR" \
  --consumer-app-version "$CONSUMER_VERSION" \
  --branch "$BRANCH" \
  --broker-base-url "$BROKER_URL" \
  "${authArgs[@]}"
set +x

echo "Published pacts from $PACT_DIR to $BROKER_URL as $CONSUMER_VERSION (branch=$BRANCH)."
