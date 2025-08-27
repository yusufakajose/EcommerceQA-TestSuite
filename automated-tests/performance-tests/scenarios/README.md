# Load Testing Scenarios

This directory contains comprehensive load testing scenarios with realistic user journey simulation for ecommerce performance testing.

## Quick Start

### Prerequisites

- JMeter installed and available in PATH
- Node.js for running scenario scripts
- Target application running (default: http://localhost:3000)

### Running Load Tests

1. **Run a single scenario:**

   ```bash
   node scripts/load-scenario-runner.js baseline
   ```

2. **Run all scenarios:**

   ```bash
   node scripts/load-scenario-runner.js all
   ```

3. **Generate enhanced scenarios:**
   ```bash
   node scenarios/user-journey-simulator.js
   ```

### Available Scenarios

| Scenario         | Users | Duration | Purpose                   |
| ---------------- | ----- | -------- | ------------------------- |
| `baseline`       | 10    | 5 min    | Performance baseline      |
| `normal_load`    | 50    | 10 min   | Normal traffic simulation |
| `peak_load`      | 100   | 15 min   | Peak traffic testing      |
| `stress_test`    | 200   | 20 min   | Stress testing            |
| `spike_test`     | 300   | 10 min   | Spike testing             |
| `endurance_test` | 75    | 60 min   | Endurance testing         |
| `volume_test`    | 150   | 30 min   | Volume testing            |

### User Journey Types

- **Casual Browser** (40%): Browse without purchasing
- **Registered Shopper** (35%): Existing users with purchase intent
- **New User Registration** (15%): First-time visitors
- **Power Shopper** (10%): Experienced, efficient users

### Configuration Files

- `load-test-scenarios.json`: Main scenario configurations
- `load-scenario-runner.js`: Scenario execution engine
- `user-journey-simulator.js`: User behavior simulation

### Results and Reports

Results are saved to:

- `jmeter/results/`: Raw JMeter results (.jtl files)
- `reports/performance-tests/`: HTML reports and analysis

### Command Line Options

```bash
# Custom base URL
node scripts/load-scenario-runner.js --base-url http://staging.com peak_load

# Verbose output
node scripts/load-scenario-runner.js --verbose stress_test

# List available scenarios
node scripts/load-scenario-runner.js --list

# Help
node scripts/load-scenario-runner.js --help
```

For detailed documentation, see `docs/load-testing-scenarios-implementation.md`.
