# Troubleshooting: k6 and JMeter (install, permissions, artifacts)

This page helps you get k6 and Apache JMeter working reliably on Linux (Ubuntu/Debian), fix common permission issues, and find where this repo writes artifacts.

## k6 installation (Ubuntu/Debian)

Preferred (official APT repo with keyring):

```bash
# Verify gpg available
sudo gpg -k || true
# Add key into a dedicated keyring (Ubuntu 24.04/25.04 compatible)
sudo gpg --no-default-keyring \
  --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 \
  --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
# Add the repository
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | \
  sudo tee /etc/apt/sources.list.d/k6.list
# Install
sudo apt-get update
sudo apt-get install -y k6
# Verify
k6 version
```

If you see "Unable to locate package k6":

- Ensure the keyring file path is correct and readable: `/usr/share/keyrings/k6-archive-keyring.gpg`.
- Re-run `sudo apt-get update` after adding the repo.
- For newer Ubuntu, avoid deprecated `apt-key`; use the keyring method above.

Alternatives:

- Docker: `docker run --rm -it grafana/k6:latest k6 version`
- Standalone binary: download from k6 GitHub Releases and place `k6` on your `PATH`.

## JMeter installation (Linux)

JMeter is Java-based. Install a JDK (Java 11+ recommended, 8+ required):

```bash
sudo apt-get update
sudo apt-get install -y default-jdk
java -version
```

Download and unpack JMeter (current stable shown as example):

```bash
cd /opt
sudo curl -fsSLO https://dlcdn.apache.org/jmeter/binaries/apache-jmeter-5.6.3.tgz
sudo tar -xzf apache-jmeter-5.6.3.tgz
sudo ln -sfn apache-jmeter-5.6.3 apache-jmeter
# Add to PATH for current shell
export JMETER_HOME=/opt/apache-jmeter
export PATH="$JMETER_HOME/bin:$PATH"
# Verify
jmeter -v
```

Headless/CLI (non-GUI) usage is required for load tests:

```bash
# Basic: run a plan and write JTL results
jmeter -n -t /path/to/plan.jmx -l /tmp/results.jtl
# Generate HTML report after run
jmeter -n -t /path/to/plan.jmx -l /tmp/results.jtl -e -o /tmp/jmeter-report
```

Increase heap for larger tests (example):

```bash
HEAP="-Xms1g -Xmx2g" jmeter -n -t /path/to/plan.jmx -l /tmp/results.jtl
```

## Permissions and environment

- Mark repo scripts executable if needed:
  - `chmod +x scripts/**/*.sh`
- Shell environment for CI parity:
  - Node 18+, `npm ci` before runs.
  - Playwright browsers installed for UI tests: `npx playwright install --with-deps`.
- Proxies/firewalls:
  - k6: set `HTTP_PROXY/HTTPS_PROXY/NO_PROXY` envs as needed.
  - JMeter: use CLI flags `-H`, `-P`, or system properties (see JMeter docs).
- File limits on heavy load tests:
  - Consider raising ulimit for open files: `ulimit -n 8192` (session scope).

## Where artifacts are written in this repo

- Playwright UI (per TEST_ENV, default `development`):
  - JSON: `reports/test-execution/${TEST_ENV}/test-results.json`
  - HTML report: `reports/test-execution/${TEST_ENV}/playwright-report/`
  - Traces/screenshots/videos: `test-results/${TEST_ENV}/`
  - Flake telemetry: `reports/test-execution/${TEST_ENV}/flakes.json` and `flakes-history.json`
- k6 load tests (wrapper):
  - Consolidated results live under `reports/` (e.g., `reports/load-test-data.json`, `reports/load-test-report.html`).
  - JUnit aggregates where applicable: `reports/junit.xml`.
- JMeter:
  - Raw JTL and per-plan outputs are typically under `automated-tests/load-tests/jmeter/results/`.
  - HTML dashboards may be emitted to `reports/load-tests/jmeter/<plan-name>/` when enabled by the runner.

Refer to package scripts:

- `npm run test:load:comprehensive` (k6 + JMeter aggregate runner)
- `npm run report:performance` and other `report:*` scripts for final HTML/JSON locations under `reports/`.

## Quick sanity checks

- k6: `k6 run - < <(printf 'import http from "k6/http"; export default()=>http.get("https://example.com");')`
- JMeter: `jmeter -n -t $JMETER_HOME/extras/Test.jmx -l /tmp/test.jtl -e -o /tmp/jm-report`

## Common errors

- k6: "Unable to locate package k6"
  - Use the keyring-based repo steps above; re-run `sudo apt-get update`.
- JMeter: "java: command not found"
  - Install JDK and ensure `java -version` prints. Set `JAVA_HOME` if needed.
- Permission denied executing scripts
  - `chmod +x` shell scripts, or run via `bash file.sh`.
- Playwright report not found
  - Ensure `TEST_ENV` matches your run; default is `development`. The JSON lives at `reports/test-execution/${TEST_ENV}/test-results.json`.

---

For deeper issues, check:

- k6 docs: https://grafana.com/docs/k6/latest/set-up/install-k6/
- JMeter user manual (CLI/non-GUI): https://jmeter.apache.org/usermanual/get-started.html#non_gui
