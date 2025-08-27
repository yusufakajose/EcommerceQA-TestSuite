# Security Scanning and SAST

This repo includes dynamic (DAST) scanning via OWASP ZAP Automation Framework and static (SAST) scanning via CodeQL.

## OWASP ZAP AF

- Plan: `config/security/zap.yaml`
- Runner: `scripts/security/run-zap-af.sh` (Docker required)
- Outputs: `reports/zap/zap-report.html` and `reports/zap/zap-report.sarif.json` (also `.sarif` copy)
- Exit thresholds: High=fail, Medium=warn (see `exitStatus` in zap.yaml)

Auth options (set in environment or `.env`):

- `ZAP_AUTH_METHOD` = manual|form|json|script|http|autodetect|browser|client
- Form auth: `ZAP_LOGIN_PAGE_URL`, `ZAP_LOGIN_REQUEST_URL`, `ZAP_LOGIN_REQUEST_BODY` with placeholders `{username} {password} {token}`
- Optional: `ZAP_TOKEN_REGEX` (capture group 1), `ZAP_LOGGED_IN_INDICATOR_REGEX`
- Script auth: `ZAP_AUTH_SCRIPT` (e.g., `scripts/security/zap-auth-scripts/form-auth.js`)

Run locally:

```bash
# Minimal (unauthenticated baseline)
ZAP_TARGET=https://www.saucedemo.com npm run security:zap

# Form-based auth
ZAP_TARGET=https://example.com \
ZAP_AUTH_METHOD=form \
ZAP_USERNAME=user \
ZAP_PASSWORD=pass \
ZAP_LOGIN_PAGE_URL=https://example.com/login \
ZAP_LOGIN_REQUEST_URL=https://example.com/login \
ZAP_LOGIN_REQUEST_BODY='username={username}&password={password}&csrf={token}' \
ZAP_TOKEN_REGEX='name=\"csrf\" value=\"([^\"]+)\"' \
npm run security:zap:auth

# Script-based auth
ZAP_TARGET=https://example.com \
ZAP_AUTH_METHOD=script \
ZAP_AUTH_SCRIPT=scripts/security/zap-auth-scripts/form-auth.js \
ZAP_USERNAME=user ZAP_PASSWORD=pass \
npm run security:zap:script-auth
```

## CodeQL

- Workflow: `.github/workflows/codeql.yml`
- Config: `.github/codeql/codeql-config.yml` (security-and-quality plus extra packs)
- PRs to main are analyzed; findings shown in the Security tab of GitHub.

Notes:

- Azure Pipelines stages ZAP SARIF under `CodeAnalysisLogs` and publishes to Advanced Security (if enabled).
- Adjust `exitStatus` in `zap.yaml` for your gating requirements.
