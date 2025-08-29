# EcommerceQA-TestSuite — Next Steps Roadmap

## Scope
A prioritized, actionable plan to complete performance engineering features, strengthen CI reliability and governance (single-author policy, workflow hygiene), enhance security and contract flows, improve UI stability, and finalize documentation and developer experience.

## Phases and Tasks

### A) Performance — k6 Enhancements
- [x] Create a dedicated k6 wrapper CLI:
      - Support scenario globbing/matrix, parallel execution, BASE_URL/TEST_TYPE injection
      - Flags: thresholds, vus, duration, tags, custom summary path
      - Exit codes aligned with threshold status; rich console summary
- [x] Extend per-scenario summary content:
      - Add p90, min/max/median latency and consistent request rate fields
      - Include wall-clock duration and guard for partial/missing files
- [x] Documentation:
      - Wrapper usage examples, aggregator steps, per-scenario artifacts in CI
      - Clarify .env.example for per-scenario summaries vs K6_SUMMARY_PATH

### B) Performance — JMeter Enhancements
 - [x] Externalize per-label SLO configuration (JSON/YAML) consumed by runner
 - [x] Implement streaming JTL parser:
      - Robust CSV with quotes, low memory aggregation by label
      - Compute p90/p95/p99, avg, min/max, throughput, bytes/sec
 - [x] Emit per-plan JSON summaries aligned with k6 format; link HTML dashboards
 - [x] Add unit tests for parser/SLO evaluation (happy path + edge cases)

### C) Trends and Reporting
- [x] Persist last N runs for latency/error/throughput trends
- [x] Add trend deltas and badges to executive dashboard and load test report
- [x] CI job summary: include combined k6 JUnit status, scenario highlights, JMeter plan stats
- [x] Top-level report index linking all artifacts (dashboards, JSON summaries, combined JUnit)

### D) CI Hardening and Matrices
- [x] Cache JMeter bundle keyed by version/hash
- [x] Environment matrix (dev/staging/prod) with mapped BASE_URL
- [x] Problem signals: explicit failure messages for SLO breaches via Azure logging commands
- [x] Optional: gates on adverse trend deltas (basic overall error/throughput checks; opt-in)
- [x] Add timeouts/retries to CI steps and a concurrency guard for JMeter downloads

### E) Contracts (Pact Broker)
- [x] Integrate Pact Broker and publish pacts on CI
- [x] Provider verification and can-i-deploy gate on PRs/releases
- [x] Broker URL/credentials in CI secrets; update docs/runbooks

### F) Security
- [x] ZAP Automation Framework wiring:
      - AF plan and runner script with env passthrough for target/regex includes
      - HTML and SARIF outputs; thresholds optional and documented for CI gating
- [x] CodeQL stability:
      - Use built-in "security-and-quality" suite to fix Initialize failures
      - SARIF uploads and PR annotations verified

### G) UI Reliability
- [x] Stabilize PR smoke:
      - Robust role/text selectors; deterministic first() targeting
      - Correct JSON report paths; default non-local baseURL in CI
- [x] Flake telemetry:
      - Capture retries, build a flake table across runs, bubble up top flaky specs; persisted summary and CI surfacing
- [ ] Data seeding and state management:
      - Helpers and fixtures, reset endpoints where available, consistent preconditions

### H) Notifications and DX
- [ ] Email notifications using .env SMTP settings:
      - Summary on failure/critical; include CI links and key metrics
- [ ] Optional Slack webhook notifications with structured blocks
- [ ] Expand npm scripts for common run patterns; pre-commit checks covering runners

### I) Documentation and Quality
 - [x] Update performance-testing-implementation.md:
      - k6 wrapper, aggregator, per-scenario JSON/JUnit, BASE_URL guidance
      - JMeter SLO config and streaming parser behavior
 - [x] Troubleshooting section (k6 install, permissions, JMeter CLI, artifact paths)
 - [x] Unit tests:
      - k6 aggregator and load-test-runner summary mapping
      - JMeter parser and SLO evaluator
- [x] Lint/type-check coverage for scripts; add JSDoc/types where helpful
- [x] Expand scripts-only type coverage to API (Newman) runners with local shims and reporter typings
- [ ] Ensure reports/ and test-results/ structures are consistent across jobs

### J) Governance and CI Hygiene
- [x] Single-author display policy without history rewrite:
      - .mailmap canonicalizes authors/committers to `yusufakajose <yusufakajose@users.noreply.github.com>`
- [x] Prevent future non-canonical commits:
      - Husky pre-push check + CI author-guard workflow
- [x] GitHub Actions allowlist alignment:
      - Replace disallowed actions; install k6 via apt; use official actions with allowed tags
- [x] Dependabot weekly for actions and npm
- [x] Auto-PR workflow fixed to use GITHUB_TOKEN (no undefined secrets)
- [x] README cleanup (remove decorative icons)

## Milestones
- Milestone 1: k6 wrapper + docs + CI wiring
- Milestone 2: JMeter SLO config + streaming parser + tests
- Milestone 3: Trend aggregation + report/index + CI summaries
- Milestone 4: Pact Broker gating + ZAP AF stabilization
- Milestone 5: Flake telemetry + data seeding; notifications and DX polish

## Immediate Next (2 weeks)
- [x] Finalize CI surfacing of flake telemetry (include top flaky specs table in PR/job summary)
- Implement email (SMTP via .env) notifications and optional Slack webhooks for failures, with deep links to artifacts
- Implement UI data seeding/state management helpers and fixtures; wire into PR smoke and comprehensive runs
- Ensure consistent structure for `reports/` and `test-results/` across jobs; add a small schema check script and CI gate
- Expand npm scripts for common run patterns; add pre-commit checks covering runners
