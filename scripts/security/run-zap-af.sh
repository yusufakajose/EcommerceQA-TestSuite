#!/usr/bin/env bash
set -euo pipefail

# Run OWASP ZAP Automation Framework with Docker.
# Requires Docker installed on the runner.
# Uses config/security/zap.yaml, outputs reports to reports/zap/

ZAP_IMAGE=${ZAP_IMAGE:-zaproxy/zap-stable}
ZAP_YAML="${ZAP_YAML:-config/security/zap.yaml}"
REPORT_DIR="${REPORT_DIR:-reports/zap}"

mkdir -p "$REPORT_DIR"

# Validate env requirements
: "${ZAP_TARGET:?ZAP_TARGET env var is required, e.g. https://www.saucedemo.com}"

# Optional auth settings with sensible defaults for unauthenticated baseline
: "${ZAP_AUTH_METHOD:=manual}" # values: manual|form|json|script|http|autodetect|browser|client
: "${ZAP_USERNAME:=standard_user}"
: "${ZAP_PASSWORD:=secret_sauce}"
: "${ZAP_LOGIN_PAGE_URL:=}"
: "${ZAP_LOGIN_REQUEST_URL:=}"
: "${ZAP_LOGIN_REQUEST_BODY:=}" # e.g. username=${ZAP_USERNAME}&password=${ZAP_PASSWORD}
: "${ZAP_LOGGED_IN_REGEX:=Logout|Sign out}"
: "${ZAP_LOGGED_OUT_REGEX:=Login|Sign in}"
: "${ZAP_AUTH_SCRIPT:=}"

# Run AF with addon update then autorun plan
CMD="zap.sh -cmd -addonupdate; zap.sh -cmd -autorun /zap/wrk/${ZAP_YAML}"

# Mount CWD to /zap/wrk for plan + reports
# Note: $(pwd) substitution works in bash/zsh/fish>=3.4 and PowerShell

# shellcheck disable=SC2046
docker run --rm -t \
  -v $(pwd):/zap/wrk/:rw \
  -e ZAP_TARGET \
  -e ZAP_AUTH_METHOD \
  -e ZAP_USERNAME \
  -e ZAP_PASSWORD \
  -e ZAP_LOGIN_PAGE_URL \
  -e ZAP_LOGIN_REQUEST_URL \
  -e ZAP_LOGIN_REQUEST_BODY \
  -e ZAP_LOGGED_IN_REGEX \
  -e ZAP_LOGGED_OUT_REGEX \
  -e ZAP_AUTH_SCRIPT \
  "$ZAP_IMAGE" \
  bash -lc "$CMD"

# Copy HTML into standard location (already mounted under reports/zap)
if [ -f "$REPORT_DIR/zap-report.html" ]; then
  echo "ZAP HTML report: $REPORT_DIR/zap-report.html"
else
  echo "Warning: ZAP HTML report not found; check container logs." >&2
fi

if [ -f "$REPORT_DIR/zap-report.sarif.json" ]; then
  echo "ZAP SARIF report: $REPORT_DIR/zap-report.sarif.json"
  # Create a .sarif copy for tools that expect the extension exactly
  cp -f "$REPORT_DIR/zap-report.sarif.json" "$REPORT_DIR/zap-report.sarif" || true
  echo "Also wrote: $REPORT_DIR/zap-report.sarif"
else
  echo "Note: ZAP SARIF report not found; ensure 'sarif-json' template is available." >&2
fi
