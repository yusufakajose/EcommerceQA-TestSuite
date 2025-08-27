#!/usr/bin/env bash
set -euo pipefail

# Record a deployment in the Pact Broker for an application version
# Requires: PACT_BROKER_BASE_URL and auth
# Inputs: PACTICIPANT, APP_VERSION, ENVIRONMENT

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
ENVIRONMENT=${ENVIRONMENT:-${DEPLOY_ENVIRONMENT:-"test"}}
APP_INSTANCE=${APPLICATION_INSTANCE:-}

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

instanceArgs=()
if [[ -n "$APP_INSTANCE" ]]; then
  instanceArgs+=( --application-instance "$APP_INSTANCE" )
fi

set -x
pact-broker record-deployment \
  --pacticipant "$PACTICIPANT" \
  --version "$APP_VERSION" \
  --environment "$ENVIRONMENT" \
  "${instanceArgs[@]}" \
  --broker-base-url "$BROKER_URL" \
  "${authArgs[@]}"
set +x
