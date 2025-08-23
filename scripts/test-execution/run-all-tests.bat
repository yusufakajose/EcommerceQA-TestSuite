@echo off
REM Comprehensive Test Execution Script for Windows
REM Runs all test suites with proper error handling and reporting

setlocal enabledelayedexpansion

REM Configuration
set SCRIPT_DIR=%~dp0
set PROJECT_ROOT=%SCRIPT_DIR%..\..
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set LOG_DIR=%PROJECT_ROOT%\logs
set RESULTS_DIR=%PROJECT_ROOT%\reports\test-execution

REM Default values
set ENVIRONMENT=development
set BROWSERS=chromium
set SUITES=ui,api
set PARALLEL=true
set GENERATE_REPORTS=true
set VERBOSE=false

REM Create directories
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
if not exist "%RESULTS_DIR%" mkdir "%RESULTS_DIR%"

REM Colors (limited support in Windows)
set RED=[91m
set GREEN=[92m
set YELLOW=[93m
set BLUE=[94m
set NC=[0m

goto :parse_args

:log_info
echo [INFO] %~1
echo [INFO] %~1 >> "%LOG_DIR%\test-execution-%TIMESTAMP%.log"
goto :eof

:log_success
echo %GREEN%[SUCCESS]%NC% %~1
echo [SUCCESS] %~1 >> "%LOG_DIR%\test-execution-%TIMESTAMP%.log"
goto :eof

:log_warning
echo %YELLOW%[WARNING]%NC% %~1
echo [WARNING] %~1 >> "%LOG_DIR%\test-execution-%TIMESTAMP%.log"
goto :eof

:log_error
echo %RED%[ERROR]%NC% %~1
echo [ERROR] %~1 >> "%LOG_DIR%\test-execution-%TIMESTAMP%.log"
goto :eof

:show_help
echo Comprehensive Test Execution Script for Windows
echo.
echo Usage: %~nx0 [OPTIONS]
echo.
echo Options:
echo     -e, --environment ENV       Test environment (development^|staging^|production^|all)
echo     -s, --suites SUITES        Comma-separated test suites (ui,api,performance,accessibility,security)
echo     -b, --browsers BROWSERS    Comma-separated browsers (chromium,firefox,webkit)
echo     -p, --parallel             Enable parallel execution (default: true)
echo     -np, --no-parallel         Disable parallel execution
echo     -nr, --no-reports          Skip report generation
echo     -v, --verbose              Enable verbose output
echo     -h, --help                 Show this help message
echo.
echo Examples:
echo     %~nx0                                          # Run default tests
echo     %~nx0 -e staging -s ui,api                    # Run UI and API tests on staging
echo     %~nx0 -e production -s ui,api,security -b chromium,firefox
echo     %~nx0 --environment all --suites ui,api,performance --no-parallel
echo     %~nx0 --verbose --no-reports
echo.
echo Test Suites:
echo     ui              User Interface tests (Playwright)
echo     api             API tests (Newman/Postman)
echo     performance     Performance tests (JMeter)
echo     accessibility   Accessibility tests (axe-core)
echo     security        Security tests (OWASP)
echo.
echo Environments:
echo     development     Local development environment
echo     staging         Staging environment
echo     production      Production environment
echo     all             Run tests on all environments
goto :eof

:parse_args
if "%~1"=="" goto :validate_environment
if "%~1"=="-e" (
    set ENVIRONMENT=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--environment" (
    set ENVIRONMENT=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="-s" (
    set SUITES=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--suites" (
    set SUITES=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="-b" (
    set BROWSERS=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--browsers" (
    set BROWSERS=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="-p" (
    set PARALLEL=true
    shift
    goto :parse_args
)
if "%~1"=="--parallel" (
    set PARALLEL=true
    shift
    goto :parse_args
)
if "%~1"=="-np" (
    set PARALLEL=false
    shift
    goto :parse_args
)
if "%~1"=="--no-parallel" (
    set PARALLEL=false
    shift
    goto :parse_args
)
if "%~1"=="-nr" (
    set GENERATE_REPORTS=false
    shift
    goto :parse_args
)
if "%~1"=="--no-reports" (
    set GENERATE_REPORTS=false
    shift
    goto :parse_args
)
if "%~1"=="-v" (
    set VERBOSE=true
    shift
    goto :parse_args
)
if "%~1"=="--verbose" (
    set VERBOSE=true
    shift
    goto :parse_args
)
if "%~1"=="-h" (
    call :show_help
    exit /b 0
)
if "%~1"=="--help" (
    call :show_help
    exit /b 0
)
call :log_error "Unknown option: %~1"
call :show_help
exit /b 1

:validate_environment
call :log_info "Validating test environment..."

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    call :log_error "Node.js is not installed"
    exit /b 1
)

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    call :log_error "npm is not installed"
    exit /b 1
)

REM Check if we're in the project root
if not exist "%PROJECT_ROOT%\package.json" (
    call :log_error "package.json not found. Are you in the project root?"
    exit /b 1
)

REM Install dependencies if needed
if not exist "%PROJECT_ROOT%\node_modules" (
    call :log_info "Installing dependencies..."
    cd /d "%PROJECT_ROOT%"
    npm install
    if errorlevel 1 (
        call :log_error "Failed to install dependencies"
        exit /b 1
    )
)

call :log_success "Environment validation completed"
goto :setup_test_environment

:setup_test_environment
call :log_info "Setting up test environment..."

cd /d "%PROJECT_ROOT%"

REM Set environment variables
set NODE_ENV=%ENVIRONMENT%
set TEST_ENV=%ENVIRONMENT%
set CI=false

if "%VERBOSE%"=="true" (
    set DEBUG=*
    set VERBOSE=true
)

REM Install browsers if needed (for Playwright)
echo %SUITES% | findstr /C:"ui" >nul
if not errorlevel 1 (
    call :log_info "Installing browsers..."
    npx playwright install --with-deps
)

echo %SUITES% | findstr /C:"accessibility" >nul
if not errorlevel 1 (
    call :log_info "Installing browsers for accessibility tests..."
    npx playwright install --with-deps
)

call :log_success "Test environment setup completed"
goto :main

:run_test_suite
set suite=%~1
call :log_info "Running %suite% tests..."

if "%suite%"=="ui" (
    call :run_ui_tests
) else if "%suite%"=="api" (
    call :run_api_tests
) else if "%suite%"=="performance" (
    call :run_performance_tests
) else if "%suite%"=="accessibility" (
    call :run_accessibility_tests
) else if "%suite%"=="security" (
    call :run_security_tests
) else (
    call :log_error "Unknown test suite: %suite%"
    exit /b 1
)

if errorlevel 1 (
    call :log_error "%suite% tests failed"
    exit /b 1
) else (
    call :log_success "%suite% tests completed"
    exit /b 0
)

:run_ui_tests
call :log_info "Executing UI tests with Playwright..."

set cmd=npm run test:ui

if not "%ENVIRONMENT%"=="development" (
    set cmd=!cmd!:%ENVIRONMENT%
)

if "%VERBOSE%"=="true" (
    set cmd=!cmd! -- --reporter=list
)

%cmd%
goto :eof

:run_api_tests
call :log_info "Executing API tests with Newman..."

set cmd=npm run test:api:comprehensive

if not "%ENVIRONMENT%"=="development" (
    set cmd=!cmd!:%ENVIRONMENT%
)

%cmd%
goto :eof

:run_performance_tests
call :log_info "Executing performance tests with JMeter..."

REM Check if JMeter is available
jmeter --version >nul 2>&1
if errorlevel 1 (
    call :log_warning "JMeter not found in PATH. Trying npm script..."
)

npm run test:performance:advanced
goto :eof

:run_accessibility_tests
call :log_info "Executing accessibility tests..."

npm run test:accessibility
goto :eof

:run_security_tests
call :log_info "Executing security tests..."

npm run test:security
goto :eof

:generate_reports
if "%GENERATE_REPORTS%"=="true" (
    call :log_info "Generating comprehensive reports..."
    
    npm run report:consolidated
    
    if errorlevel 1 (
        call :log_warning "Report generation failed"
    ) else (
        call :log_success "Reports generated successfully"
        call :log_info "Dashboard available at: reports\dashboard\index.html"
        call :log_info "Consolidated reports at: reports\consolidated\index.html"
    )
) else (
    call :log_info "Skipping report generation"
)
goto :eof

:main
set start_time=%time%
set failed_suites=
set passed_suites=

call :log_info "Starting comprehensive test execution"
call :log_info "Timestamp: %date% %time%"
call :log_info "Environment: %ENVIRONMENT%"
call :log_info "Suites: %SUITES%"
call :log_info "Browsers: %BROWSERS%"
call :log_info "Parallel: %PARALLEL%"

REM Execute test suites
for %%s in (%SUITES%) do (
    set suite=%%s
    call :run_test_suite !suite!
    
    if errorlevel 1 (
        if "!failed_suites!"=="" (
            set failed_suites=!suite!
        ) else (
            set failed_suites=!failed_suites!,!suite!
        )
    ) else (
        if "!passed_suites!"=="" (
            set passed_suites=!suite!
        ) else (
            set passed_suites=!passed_suites!,!suite!
        )
    )
    
    REM Add delay between suites if not parallel
    if "%PARALLEL%"=="false" (
        call :log_info "Waiting 10 seconds before next suite..."
        timeout /t 10 /nobreak >nul
    )
)

REM Generate reports
call :generate_reports

REM Print summary
echo.
echo ========================================
echo TEST EXECUTION SUMMARY
echo ========================================
echo Environment: %ENVIRONMENT%
echo Timestamp: %date% %time%
echo.

if not "!passed_suites!"=="" (
    echo %GREEN%Passed Suites:%NC%
    for %%s in (!passed_suites!) do (
        echo   ✅ %%s
    )
    echo.
)

if not "!failed_suites!"=="" (
    echo %RED%Failed Suites:%NC%
    for %%s in (!failed_suites!) do (
        echo   ❌ %%s
    )
    echo.
)

echo Logs: %LOG_DIR%\test-execution-%TIMESTAMP%.log
echo Results: %RESULTS_DIR%
echo ========================================

REM Exit with appropriate code
if "!failed_suites!"=="" (
    call :log_success "All test suites completed successfully!"
    exit /b 0
) else (
    call :log_error "Some test suites failed. Check the logs for details."
    exit /b 1
)