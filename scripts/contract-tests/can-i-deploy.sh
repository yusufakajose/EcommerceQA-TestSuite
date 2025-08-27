#!/usr/bin/env bash
set -euo pipefail

# Check if the specified pacticipant version can be deployed to the environment
# Requires: PACT_BROKER_BASE_URL and auth (token or user/pass)
# Inputs: PACTICIPANT, APP_VERSION, TO_ENV (environment name)

if ! command -v pact-broker >/dev/null 2>&1; then
  echo "Installing pact-broker CLI via Ruby gem (pact_broker-client)..."
  gem install pact_broker-client --no-document >/dev/null
fi

BROKER_URL=${PACT_BROKER_BASE_URL:-${PACT_BROKER_URL:-}}
TOKEN=${PACT_BROKER_TOKEN:-}
USER=${PACT_BROKER_USERNAME:-}
PASS=${PACT_BROKER_PASSWORD:-}
PACTICIPANT=${PACTICIPANT:-${APPLICATION_NAME:-"EcommerceWebApp"}}
APP_VERSION=${APP_VERSION:-${GIT_COMMIT:-${BUILD_SOURCEVERSION:-"dev-local"}}}
TO_ENV=${TO_ENV:-${DEPLOY_ENVIRONMENT:-"test"}}

if [[ -z "$BROKER_URL" ]]; then
  echo "PACT_BROKER_BASE_URL is required" >&2
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
pact-broker can-i-deploy \
  --pacticipant "$PACTICIPANT" --version "$APP_VERSION" \
  --to-environment "$TO_ENV" \
  --broker-base-url "$BROKER_URL" \
  "${authArgs[@]}"
set +x
