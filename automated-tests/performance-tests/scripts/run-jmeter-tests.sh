#!/bin/bash

# JMeter Performance Test Execution Script
# This script runs JMeter performance tests for the e-commerce application

set -e

# Configuration
JMETER_HOME=${JMETER_HOME:-"/usr/local/jmeter"}
BASE_URL=${BASE_URL:-"http://localhost:3000"}
RESULTS_DIR="automated-tests/performance-tests/jmeter/results"
TEST_PLANS_DIR="automated-tests/performance-tests/jmeter/test-plans"
REPORTS_DIR="reports/performance-tests"

# Default test parameters
DEFAULT_USERS=50
DEFAULT_RAMP_UP=60
DEFAULT_LOOPS=5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if JMeter is installed
check_jmeter() {
    if ! command -v jmeter &> /dev/null; then
        print_error "JMeter is not installed or not in PATH"
        print_status "Please install JMeter and ensure it's in your PATH"
        print_status "Download from: https://jmeter.apache.org/download_jmeter.cgi"
        exit 1
    fi
    
    print_success "JMeter found: $(jmeter --version | head -n1)"
}

# Function to create directories
setup_directories() {
    print_status "Setting up directories..."
    mkdir -p "$RESULTS_DIR"
    mkdir -p "$REPORTS_DIR"
    
    # Clean previous results
    rm -f "$RESULTS_DIR"/*.jtl
    rm -f "$RESULTS_DIR"/*.log
    rm -rf "$REPORTS_DIR"/*
    
    print_success "Directories prepared"
}

# Function to run a JMeter test plan
run_test_plan() {
    local test_plan=$1
    local test_name=$2
    local users=${3:-$DEFAULT_USERS}
    local ramp_up=${4:-$DEFAULT_RAMP_UP}
    local loops=${5:-$DEFAULT_LOOPS}
    
    print_status "Running $test_name performance test..."
    print_status "Parameters: Users=$users, Ramp-up=$ramp_up seconds, Loops=$loops"
    
    local result_file="$RESULTS_DIR/${test_name}-results.jtl"
    local log_file="$RESULTS_DIR/${test_name}.log"
    local report_dir="$REPORTS_DIR/${test_name}-report"
    
    # Run JMeter test
    jmeter -n \
        -t "$TEST_PLANS_DIR/$test_plan" \
        -l "$result_file" \
        -j "$log_file" \
        -Jbase_url="$BASE_URL" \
        -Jusers="$users" \
        -Jramp_up="$ramp_up" \
        -Jloops="$loops" \
        -e \
        -o "$report_dir"
    
    if [ $? -eq 0 ]; then
        print_success "$test_name test completed successfully"
        print_status "Results: $result_file"
        print_status "Report: $report_dir/index.html"
    else
        print_error "$test_name test failed"
        return 1
    fi
}

# Function to generate consolidated report
generate_consolidated_report() {
    print_status "Generating consolidated performance report..."
    
    local consolidated_report="$REPORTS_DIR/consolidated-performance-report.html"
    
    cat > "$consolidated_report" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>E-commerce Performance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .test-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .metrics { display: flex; gap: 20px; margin: 15px 0; }
        .metric { background: #e8f4fd; padding: 10px; border-radius: 3px; text-align: center; }
        .success { background: #d4edda; }
        .warning { background: #fff3cd; }
        .error { background: #f8d7da; }
        iframe { width: 100%; height: 600px; border: 1px solid #ddd; }
    </style>
</head>
<body>
    <div class="header">
        <h1>E-commerce Performance Test Report</h1>
        <p>Generated: $(date)</p>
        <p>Base URL: $BASE_URL</p>
    </div>
    
    <div class="test-section">
        <h2>Test Summary</h2>
        <div class="metrics">
            <div class="metric">
                <h3>User Authentication</h3>
                <p>Load test for registration and login flows</p>
            </div>
            <div class="metric">
                <h3>Product Catalog</h3>
                <p>Performance test for browsing and search</p>
            </div>
            <div class="metric">
                <h3>Shopping Cart</h3>
                <p>Cart and checkout performance validation</p>
            </div>
        </div>
    </div>
    
    <div class="test-section">
        <h2>Detailed Reports</h2>
        <p>Click on the links below to view detailed test reports:</p>
        <ul>
            <li><a href="user-authentication-report/index.html" target="_blank">User Authentication Performance Report</a></li>
            <li><a href="product-catalog-report/index.html" target="_blank">Product Catalog Performance Report</a></li>
            <li><a href="shopping-cart-checkout-report/index.html" target="_blank">Shopping Cart & Checkout Performance Report</a></li>
        </ul>
    </div>
</body>
</html>
EOF
    
    print_success "Consolidated report generated: $consolidated_report"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS] [TEST_NAME]"
    echo ""
    echo "Options:"
    echo "  -u, --users NUMBER      Number of concurrent users (default: $DEFAULT_USERS)"
    echo "  -r, --ramp-up SECONDS   Ramp-up period in seconds (default: $DEFAULT_RAMP_UP)"
    echo "  -l, --loops NUMBER      Number of loops per user (default: $DEFAULT_LOOPS)"
    echo "  -b, --base-url URL      Base URL for testing (default: $BASE_URL)"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Test Names:"
    echo "  auth                    Run user authentication tests only"
    echo "  catalog                 Run product catalog tests only"
    echo "  cart                    Run shopping cart tests only"
    echo "  all                     Run all performance tests (default)"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run all tests with default parameters"
    echo "  $0 -u 100 -r 120 auth               # Run auth tests with 100 users, 120s ramp-up"
    echo "  $0 --base-url http://staging.com all # Run all tests against staging"
}

# Parse command line arguments
USERS=$DEFAULT_USERS
RAMP_UP=$DEFAULT_RAMP_UP
LOOPS=$DEFAULT_LOOPS
TEST_NAME="all"

while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--users)
            USERS="$2"
            shift 2
            ;;
        -r|--ramp-up)
            RAMP_UP="$2"
            shift 2
            ;;
        -l|--loops)
            LOOPS="$2"
            shift 2
            ;;
        -b|--base-url)
            BASE_URL="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        auth|catalog|cart|all)
            TEST_NAME="$1"
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    print_status "Starting JMeter Performance Tests"
    print_status "Target URL: $BASE_URL"
    print_status "Test Configuration: Users=$USERS, Ramp-up=${RAMP_UP}s, Loops=$LOOPS"
    
    check_jmeter
    setup_directories
    
    case $TEST_NAME in
        auth)
            run_test_plan "user-authentication-load-test.jmx" "user-authentication" "$USERS" "$RAMP_UP" "$LOOPS"
            ;;
        catalog)
            run_test_plan "product-catalog-load-test.jmx" "product-catalog" "$USERS" "$RAMP_UP" "$LOOPS"
            ;;
        cart)
            run_test_plan "shopping-cart-checkout-load-test.jmx" "shopping-cart-checkout" "$USERS" "$RAMP_UP" "$LOOPS"
            ;;
        all)
            print_status "Running all performance tests..."
            run_test_plan "user-authentication-load-test.jmx" "user-authentication" "$USERS" "$RAMP_UP" "$LOOPS"
            run_test_plan "product-catalog-load-test.jmx" "product-catalog" "$USERS" "$RAMP_UP" "$LOOPS"
            run_test_plan "shopping-cart-checkout-load-test.jmx" "shopping-cart-checkout" "$USERS" "$RAMP_UP" "$LOOPS"
            generate_consolidated_report
            ;;
    esac
    
    print_success "Performance testing completed!"
    print_status "Results available in: $RESULTS_DIR"
    print_status "Reports available in: $REPORTS_DIR"
}

# Run main function
main