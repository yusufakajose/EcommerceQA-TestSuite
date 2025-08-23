#!/usr/bin/env node

/**
 * Comprehensive API Test Scenario Runner
 * Executes comprehensive test scenarios including positive, negative, and security tests
 */

const APITestRunner = require('./api-test-runner');
const fs = require('fs');
const path = require('path');

class ComprehensiveTestRunner extends APITestRunner {
  constructor() {
    super();
    this.testSuites = {
      basic: ['user-management', 'product-catalog', 'order-processing'],
      enhanced: ['enhanced-user-management', 'enhanced-product-catalog', 'enhanced-order-processing'],
      security: ['enhanced-user-management', 'enhanced-product-catalog', 'enhanced-order-processing'],
      performance: ['user-management', 'product-catalog', 'order-processing']
    };
  }

  /**
   * Run comprehensive test suite
   */
  async runComprehensiveTests(environment = 'development', options = {}) {
    console.log('🚀 Starting Comprehensive API Test Suite...');
    console.log(`📍 Environment: ${environment}`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
    
    const results = {
      environment,
      startTime: new Date().toISOString(),
      testSuites: {},
      summary: {
        totalSuites: 0,
        passedSuites: 0,
        failedSuites: 0,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0
      }
    };

    try {
      // Run basic functionality tests
      console.log('\\n📋 Phase 1: Basic Functionality Tests');
      results.testSuites.basic = await this.runTestSuite('basic', environment, {
        ...options,
        description: 'Basic API functionality validation'
      });

      // Run enhanced comprehensive tests
      console.log('\\n🔍 Phase 2: Enhanced Comprehensive Tests');
      results.testSuites.enhanced = await this.runTestSuite('enhanced', environment, {
        ...options,
        description: 'Comprehensive positive and negative test scenarios'
      });

      // Run security tests
      console.log('\\n🔒 Phase 3: Security Tests');
      results.testSuites.security = await this.runSecurityTests(environment, options);

      // Run performance tests if requested
      if (options.includePerformance) {
        console.log('\\n⚡ Phase 4: Performance Tests');
        results.testSuites.performance = await this.runPerformanceTests(environment, options);
      }

      // Generate comprehensive summary
      results.endTime = new Date().toISOString();
      results.duration = new Date(results.endTime) - new Date(results.startTime);
      this.generateComprehensiveSummary(results);

      // Save comprehensive results
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const resultsPath = path.join(this.resultsDir, `comprehensive-results-${environment}-${timestamp}.json`);
      fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

      console.log(`\\n📊 Comprehensive results saved: ${resultsPath}`);
      
      return results;

    } catch (error) {
      console.error('❌ Comprehensive test execution failed:', error.message);
      results.error = error.message;
      results.endTime = new Date().toISOString();
      return results;
    }
  }

  /**
   * Run a specific test suite
   */
  async runTestSuite(suiteName, environment, options = {}) {
    const collections = this.testSuites[suiteName];
    
    if (!collections) {
      throw new Error(`Test suite '${suiteName}' not found`);
    }

    console.log(`  📦 Running ${suiteName} test suite (${collections.length} collections)`);
    
    const suiteResults = await this.runMultipleCollections(collections, environment, {
      ...options,
      collectionDelay: 1000 // 1 second delay between collections
    });

    suiteResults.suiteName = suiteName;
    suiteResults.description = options.description || `${suiteName} test suite`;
    
    return suiteResults;
  }

  /**
   * Run security-focused tests
   */
  async runSecurityTests(environment, options = {}) {
    console.log('  🔐 Running security test scenarios...');
    
    const securityOptions = {
      ...options,
      reporters: ['cli', 'json'],
      timeout: 15000, // Longer timeout for security tests
      description: 'Security vulnerability testing'
    };

    // Run enhanced collections with focus on security test scenarios
    const securityResults = await this.runMultipleCollections(
      this.testSuites.security, 
      environment, 
      securityOptions
    );

    // Add security-specific analysis
    securityResults.securityAnalysis = this.analyzeSecurityResults(securityResults);
    
    return securityResults;
  }

  /**
   * Run performance tests
   */
  async runPerformanceTests(environment, options = {}) {
    console.log('  ⚡ Running performance test scenarios...');
    
    const performanceOptions = {
      ...options,
      reporters: ['cli', 'json'],
      timeout: 30000, // Longer timeout for performance tests
      delayRequest: 50, // Reduced delay for performance testing
      description: 'API performance validation'
    };

    // Run with performance test data
    const performanceResults = await this.runDataDrivenTest(
      'user-management',
      environment,
      'performance-test-data',
      10 // 10 iterations for performance testing
    );

    // Add performance-specific analysis
    performanceResults.performanceAnalysis = this.analyzePerformanceResults(performanceResults);
    
    return performanceResults;
  }

  /**
   * Analyze security test results
   */
  analyzeSecurityResults(results) {
    const analysis = {
      vulnerabilitiesFound: [],
      securityScore: 0,
      recommendations: []
    };

    // Analyze failures for security implications
    if (results.failures) {
      results.failures.forEach(failure => {
        if (failure.name.toLowerCase().includes('sql')) {
          analysis.vulnerabilitiesFound.push({
            type: 'SQL Injection',
            severity: 'High',
            description: failure.message
          });
        }
        
        if (failure.name.toLowerCase().includes('xss')) {
          analysis.vulnerabilitiesFound.push({
            type: 'Cross-Site Scripting (XSS)',
            severity: 'Medium',
            description: failure.message
          });
        }
        
        if (failure.name.toLowerCase().includes('authentication')) {
          analysis.vulnerabilitiesFound.push({
            type: 'Authentication Bypass',
            severity: 'Critical',
            description: failure.message
          });
        }
      });
    }

    // Calculate security score (0-100)
    const totalSecurityTests = results.stats ? results.stats.assertions.total : 0;
    const failedSecurityTests = analysis.vulnerabilitiesFound.length;
    analysis.securityScore = totalSecurityTests > 0 ? 
      Math.max(0, Math.round(((totalSecurityTests - failedSecurityTests) / totalSecurityTests) * 100)) : 0;

    // Generate recommendations
    if (analysis.vulnerabilitiesFound.length > 0) {
      analysis.recommendations.push('Implement input validation and sanitization');
      analysis.recommendations.push('Use parameterized queries to prevent SQL injection');
      analysis.recommendations.push('Implement proper authentication and authorization checks');
      analysis.recommendations.push('Add rate limiting to prevent abuse');
    }

    return analysis;
  }

  /**
   * Analyze performance test results
   */
  analyzePerformanceResults(results) {
    const analysis = {
      averageResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      throughput: 0,
      performanceScore: 0,
      recommendations: []
    };

    if (results.requests && results.requests.length > 0) {
      const responseTimes = results.requests
        .filter(req => req.responseTime)
        .map(req => req.responseTime);

      if (responseTimes.length > 0) {
        analysis.averageResponseTime = Math.round(
          responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        );
        analysis.maxResponseTime = Math.max(...responseTimes);
        analysis.minResponseTime = Math.min(...responseTimes);
        
        // Calculate throughput (requests per second)
        const totalDuration = results.duration || 1000;
        analysis.throughput = Math.round((responseTimes.length / totalDuration) * 1000);
        
        // Calculate performance score based on response times
        if (analysis.averageResponseTime < 500) {
          analysis.performanceScore = 100;
        } else if (analysis.averageResponseTime < 1000) {
          analysis.performanceScore = 80;
        } else if (analysis.averageResponseTime < 2000) {
          analysis.performanceScore = 60;
        } else {
          analysis.performanceScore = 40;
        }
      }
    }

    // Generate performance recommendations
    if (analysis.averageResponseTime > 1000) {
      analysis.recommendations.push('Optimize database queries and add indexing');
      analysis.recommendations.push('Implement caching for frequently accessed data');
      analysis.recommendations.push('Consider API response compression');
    }
    
    if (analysis.averageResponseTime > 2000) {
      analysis.recommendations.push('Review server resources and scaling options');
      analysis.recommendations.push('Implement connection pooling');
    }

    return analysis;
  }

  /**
   * Generate comprehensive summary
   */
  generateComprehensiveSummary(results) {
    console.log('\\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE TEST RESULTS SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`🌍 Environment: ${results.environment}`);
    console.log(`⏰ Duration: ${Math.round(results.duration / 1000)}s`);
    console.log(`📅 Completed: ${results.endTime}`);
    
    // Calculate overall statistics
    let totalCollections = 0;
    let successfulCollections = 0;
    let totalRequests = 0;
    let failedRequests = 0;
    let totalAssertions = 0;
    let failedAssertions = 0;

    Object.values(results.testSuites).forEach(suite => {
      if (suite.summary) {
        totalCollections += suite.summary.totalCollections;
        successfulCollections += suite.summary.successfulCollections;
      }
      if (suite.stats) {
        totalRequests += suite.stats.requests.total;
        failedRequests += suite.stats.requests.failed;
        totalAssertions += suite.stats.assertions.total;
        failedAssertions += suite.stats.assertions.failed;
      }
    });

    console.log('\\n📈 Overall Statistics:');
    console.log(`   Collections: ${successfulCollections}/${totalCollections} passed`);
    console.log(`   Requests: ${totalRequests - failedRequests}/${totalRequests} successful`);
    console.log(`   Assertions: ${totalAssertions - failedAssertions}/${totalAssertions} passed`);
    
    const overallSuccessRate = totalAssertions > 0 ? 
      Math.round(((totalAssertions - failedAssertions) / totalAssertions) * 100) : 0;
    console.log(`   Success Rate: ${overallSuccessRate}%`);

    // Test suite breakdown
    console.log('\\n📋 Test Suite Results:');
    Object.entries(results.testSuites).forEach(([suiteName, suite]) => {
      const status = suite.summary?.overallSuccess ? '✅' : '❌';
      const collections = suite.summary ? 
        `${suite.summary.successfulCollections}/${suite.summary.totalCollections}` : 'N/A';
      console.log(`   ${status} ${suiteName}: ${collections} collections passed`);
    });

    // Security analysis
    if (results.testSuites.security?.securityAnalysis) {
      const secAnalysis = results.testSuites.security.securityAnalysis;
      console.log('\\n🔒 Security Analysis:');
      console.log(`   Security Score: ${secAnalysis.securityScore}/100`);
      console.log(`   Vulnerabilities Found: ${secAnalysis.vulnerabilitiesFound.length}`);
      
      if (secAnalysis.vulnerabilitiesFound.length > 0) {
        console.log('   ⚠️  Security Issues:');
        secAnalysis.vulnerabilitiesFound.forEach(vuln => {
          console.log(`      - ${vuln.type} (${vuln.severity})`);
        });
      }
    }

    // Performance analysis
    if (results.testSuites.performance?.performanceAnalysis) {
      const perfAnalysis = results.testSuites.performance.performanceAnalysis;
      console.log('\\n⚡ Performance Analysis:');
      console.log(`   Performance Score: ${perfAnalysis.performanceScore}/100`);
      console.log(`   Average Response Time: ${perfAnalysis.averageResponseTime}ms`);
      console.log(`   Throughput: ${perfAnalysis.throughput} req/s`);
    }

    console.log('\\n' + '='.repeat(80));
    
    if (overallSuccessRate >= 90) {
      console.log('🎉 EXCELLENT! All tests passed with high success rate');
    } else if (overallSuccessRate >= 75) {
      console.log('✅ GOOD! Most tests passed, minor issues to address');
    } else if (overallSuccessRate >= 50) {
      console.log('⚠️  NEEDS ATTENTION! Several test failures detected');
    } else {
      console.log('❌ CRITICAL! Major issues detected, immediate attention required');
    }
  }

  /**
   * Run negative testing scenarios
   */
  async runNegativeTests(environment = 'development') {
    console.log('🔍 Running negative test scenarios...');
    
    return this.runDataDrivenTest(
      'enhanced-user-management',
      environment,
      'negative-test-data',
      null // Use all rows in CSV
    );
  }

  /**
   * Generate test coverage report
   */
  generateCoverageReport(results) {
    const coverage = {
      endpoints: new Set(),
      httpMethods: new Set(),
      statusCodes: new Set(),
      testTypes: {
        positive: 0,
        negative: 0,
        security: 0,
        performance: 0
      }
    };

    // Analyze test coverage from results
    Object.values(results.testSuites).forEach(suite => {
      if (suite.results) {
        suite.results.forEach(result => {
          if (result.requests) {
            result.requests.forEach(request => {
              coverage.endpoints.add(request.url);
              coverage.httpMethods.add(request.method);
              coverage.statusCodes.add(request.status);
            });
          }
        });
      }
    });

    return {
      endpointsCovered: coverage.endpoints.size,
      httpMethodsCovered: coverage.httpMethods.size,
      statusCodesCovered: coverage.statusCodes.size,
      testTypes: coverage.testTypes
    };
  }
}

module.exports = ComprehensiveTestRunner;

// CLI Interface
if (require.main === module) {
  const runner = new ComprehensiveTestRunner();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Comprehensive API Test Runner

Usage: node scripts/api-tests/comprehensive-test-runner.js [command] [options]

Commands:
  comprehensive [environment]       Run complete comprehensive test suite
  security [environment]           Run security-focused tests only
  performance [environment]        Run performance tests only
  negative [environment]           Run negative test scenarios
  coverage [environment]           Generate test coverage report

Options:
  --include-performance            Include performance tests in comprehensive run
  --timeout <ms>                   Set custom timeout for requests
  --delay <ms>                     Set delay between requests

Examples:
  node scripts/api-tests/comprehensive-test-runner.js comprehensive development
  node scripts/api-tests/comprehensive-test-runner.js security staging --timeout 20000
  node scripts/api-tests/comprehensive-test-runner.js comprehensive production --include-performance
`);
    process.exit(0);
  }

  const command = args[0];
  const environment = args[1] || 'development';
  
  // Parse options
  const options = {};
  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    
    switch (arg) {
      case '--include-performance':
        options.includePerformance = true;
        break;
      case '--timeout':
        if (nextArg) {
          options.timeout = parseInt(nextArg);
          i++;
        }
        break;
      case '--delay':
        if (nextArg) {
          options.delayRequest = parseInt(nextArg);
          i++;
        }
        break;
    }
  }

  (async () => {
    try {
      let result;
      
      switch (command) {
        case 'comprehensive':
          result = await runner.runComprehensiveTests(environment, options);
          process.exit(result.summary?.overallSuccess ? 0 : 1);
          break;

        case 'security':
          result = await runner.runSecurityTests(environment, options);
          process.exit(result.success ? 0 : 1);
          break;

        case 'performance':
          result = await runner.runPerformanceTests(environment, options);
          process.exit(result.success ? 0 : 1);
          break;

        case 'negative':
          result = await runner.runNegativeTests(environment);
          process.exit(result.success ? 0 : 1);
          break;

        case 'coverage': {
          const comprehensiveResult = await runner.runComprehensiveTests(environment, options);
          const coverage = runner.generateCoverageReport(comprehensiveResult);
          console.log('\\n📊 Test Coverage Report:');
          console.log(`   Endpoints Covered: ${coverage.endpointsCovered}`);
          console.log(`   HTTP Methods: ${coverage.httpMethodsCovered}`);
          console.log(`   Status Codes: ${coverage.statusCodesCovered}`);
          process.exit(0);
          break;
        }

        default:
          console.error(`Unknown command: ${command}`);
          process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  })();
}