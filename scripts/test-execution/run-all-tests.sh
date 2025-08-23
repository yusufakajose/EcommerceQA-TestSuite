#!/bin/bash

# Comprehensive Test Execution Script
# Runs all test suites with proper error handling and reporting

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="$PROJECT_ROOT/logs"
RESULTS_DIR="$PROJECT_ROOT/reports/test-execution"

# Default values
ENVIRONMENT="development"
BROWSERS="chromium"
SUITES="ui,api"
PARALLEL="true"
GENERATE_REPORTS="true"
VERBOSE="false"

# Create directories
mkdir -p "$LOG_DIR"
mkdir -p "$RESULTS_DIR"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_DIR/test-execution-$TIMESTAMP.log"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_DIR/test-execution-$TIMESTAMP.log"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_DIR/test-execution-$TIMESTAMP.log"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_DIR/test-execution-$TIMESTAMP.log"
}

# Help function
show_help() {
    cat << EOF
Comprehensive Test Execution Script

Usage: $0 [OPTIONS]

Options:
    -e, --environment ENV       Test environment (development|staging|production|all)
    -s, --suites SUITES        Comma-separated test suites (ui,api,performance,accessibility,security)
    -b, --browsers BROWSERS    Comma-separated browsers (chromium,firefox,webkit)
    -p, --parallel             Enable parallel execution (default: true)
    -np, --no-parallel         Disable parallel execution
    -nr, --no-reports          Skip report generation
    -v, --verbose              Enable verbose output
    -h, --help                 Show this help message

Examples:
    $0                                          # Run default tests
    $0 -e staging -s ui,api                    # Run UI and API tests on staging
    $0 -e production -s ui,api,security -b chromium,firefox
    $0 --environment all --suites ui,api,performance --no-parallel
    $0 --verbose --no-reports

Test Suites:
    ui              User Interface tests (Playwright)
    api             API tests (Newman/Postman)
    performance     Performance tests (JMeter)
    accessibility   Accessibility tests (axe-core)
    security        Security tests (OWASP)

Environments:
    development     Local development environment
    staging         Staging environment
    production      Production environment
    all             Run tests on all environments
EOF
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -s|--suites)
                SUITES="$2"
                shift 2
                ;;
            -b|--browsers)
                BROWSERS="$2"
                shift 2
                ;;
            -p|--parallel)
                PARALLEL="true"
                shift
                ;;
            -np|--no-parallel)
                PARALLEL="false"
                shift
                ;;
            -nr|--no-reports)
                GENERATE_REPORTS="false"
                shift
                ;;
            -v|--verbose)
                VERBOSE="true"
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Validate environment
validate_environment() {
    log_info "Validating test environment..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check if we're in the project root
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log_error "package.json not found. Are you in the project root?"
        exit 1
    fi
    
    # Install dependencies if needed
    if [[ ! -d "$PROJECT_ROOT/node_modules" ]]; then
        log_info "Installing dependencies..."
        cd "$PROJECT_ROOT"
        npm install
    fi
    
    log_success "Environment validation completed"
}

# Setup test environment
setup_test_environment() {
    log_info "Setting up test environment..."
    
    cd "$PROJECT_ROOT"
    
    # Set environment variables
    export NODE_ENV="$ENVIRONMENT"
    export TEST_ENV="$ENVIRONMENT"
    export CI="false"
    
    if [[ "$VERBOSE" == "true" ]]; then
        export DEBUG="*"
        export VERBOSE="true"
    fi
    
    # Install browsers if needed (for Playwright)
    if [[ "$SUITES" == *"ui"* ]] || [[ "$SUITES" == *"accessibility"* ]]; then
        log_info "Installing browsers..."
        npx playwright install --with-deps
    fi
    
    log_success "Test environment setup completed"
}

# Run individual test suite
run_test_suite() {
    local suite=$1
    local start_time=$(date +%s)
    
    log_info "Running $suite tests..."
    
    case $suite in
        "ui")
            run_ui_tests
            ;;
        "api")
            run_api_tests
            ;;
        "performance")
            run_performance_tests
            ;;
        "accessibility")
            run_accessibility_tests
            ;;
        "security")
            run_security_tests
            ;;
        *)
            log_error "Unknown test suite: $suite"
            return 1
            ;;
    esac
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [[ $? -eq 0 ]]; then
        log_success "$suite tests completed in ${duration}s"
        return 0
    else
        log_error "$suite tests failed after ${duration}s"
        return 1
    fi
}

# Run UI tests
run_ui_tests() {
    log_info "Executing UI tests with Playwright..."
    
    local cmd="npm run test:ui"
    
    if [[ "$ENVIRONMENT" != "development" ]]; then
        cmd="$cmd:$ENVIRONMENT"
    fi
    
    if [[ "$VERBOSE" == "true" ]]; then
        cmd="$cmd -- --reporter=list"
    fi
    
    eval "$cmd"
}

# Run API tests
run_api_tests() {
    log_info "Executing API tests with Newman..."
    
    local cmd="npm run test:api:comprehensive"
    
    if [[ "$ENVIRONMENT" != "development" ]]; then
        cmd="$cmd:$ENVIRONMENT"
    fi
    
    eval "$cmd"
}

# Run performance tests
run_performance_tests() {
    log_info "Executing performance tests with JMeter..."
    
    # Check if JMeter is available
    if ! command -v jmeter &> /dev/null; then
        log_warning "JMeter not found in PATH. Trying npm script..."
    fi
    
    npm run test:performance:advanced
}

# Run accessibility tests
run_accessibility_tests() {
    log_info "Executing accessibility tests..."
    
    npm run test:accessibility
}

# Run security tests
run_security_tests() {
    log_info "Executing security tests..."
    
    npm run test:security
}

# Generate reports
generate_reports() {
    if [[ "$GENERATE_REPORTS" == "true" ]]; then
        log_info "Generating comprehensive reports..."
        
        # Generate consolidated reports
        npm run report:consolidated
        
        if [[ $? -eq 0 ]]; then
            log_success "Reports generated successfully"
            log_info "Dashboard available at: reports/dashboard/index.html"
            log_info "Consolidated reports at: reports/consolidated/index.html"
        else
            log_warning "Report generation failed"
        fi
    else
        log_info "Skipping report generation"
    fi
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    
    # Kill any remaining processes
    pkill -f "node.*test" 2>/dev/null || true
    pkill -f "playwright" 2>/dev/null || true
    pkill -f "jmeter" 2>/dev/null || true
    
    # Clean up temporary files
    find "$PROJECT_ROOT" -name "*.tmp" -delete 2>/dev/null || true
}

# Main execution function
main() {
    local start_time=$(date +%s)
    local failed_suites=()
    local passed_suites=()
    
    log_info "Starting comprehensive test execution"
    log_info "Timestamp: $(date)"
    log_info "Environment: $ENVIRONMENT"
    log_info "Suites: $SUITES"
    log_info "Browsers: $BROWSERS"
    log_info "Parallel: $PARALLEL"
    
    # Setup
    validate_environment
    setup_test_environment
    
    # Convert comma-separated suites to array
    IFS=',' read -ra SUITE_ARRAY <<< "$SUITES"
    
    # Execute test suites
    for suite in "${SUITE_ARRAY[@]}"; do
        suite=$(echo "$suite" | xargs)  # Trim whitespace
        
        if run_test_suite "$suite"; then
            passed_suites+=("$suite")
        else
            failed_suites+=("$suite")
        fi
        
        # Add delay between suites if not parallel
        if [[ "$PARALLEL" == "false" ]] && [[ ${#SUITE_ARRAY[@]} -gt 1 ]]; then
            log_info "Waiting 10 seconds before next suite..."
            sleep 10
        fi
    done
    
    # Generate reports
    generate_reports
    
    # Calculate total duration
    local end_time=$(date +%s)
    local total_duration=$((end_time - start_time))
    
    # Print summary
    echo ""
    echo "========================================"
    echo "TEST EXECUTION SUMMARY"
    echo "========================================"
    echo "Total Duration: ${total_duration}s"
    echo "Environment: $ENVIRONMENT"
    echo "Timestamp: $(date)"
    echo ""
    
    if [[ ${#passed_suites[@]} -gt 0 ]]; then
        echo -e "${GREEN}Passed Suites (${#passed_suites[@]}):${NC}"
        for suite in "${passed_suites[@]}"; do
            echo "  ✅ $suite"
        done
        echo ""
    fi
    
    if [[ ${#failed_suites[@]} -gt 0 ]]; then
        echo -e "${RED}Failed Suites (${#failed_suites[@]}):${NC}"
        for suite in "${failed_suites[@]}"; do
            echo "  ❌ $suite"
        done
        echo ""
    fi
    
    echo "Logs: $LOG_DIR/test-execution-$TIMESTAMP.log"
    echo "Results: $RESULTS_DIR"
    echo "========================================"
    
    # Exit with appropriate code
    if [[ ${#failed_suites[@]} -eq 0 ]]; then
        log_success "All test suites completed successfully!"
        exit 0
    else
        log_error "Some test suites failed. Check the logs for details."
        exit 1
    fi
}

# Trap cleanup on exit
trap cleanup EXIT

# Parse arguments and run
parse_args "$@"
main