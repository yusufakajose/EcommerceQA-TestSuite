/**
 * Backend Monitoring Test Suite
 * Comprehensive backend performance and health monitoring
 */

const { test, expect } = require('@playwright/test');
const ApiPerformanceMonitor = require('./utils/api-performance-monitor');

test.describe('Backend Monitoring Tests', () => {
  let apiMonitor;

  test.beforeEach(async () => {
    apiMonitor = new ApiPerformanceMonitor();
  });

  test.describe('API Health Monitoring', () => {
    test('should monitor API endpoint availability and response times', async ({ request }) => {
      const healthEndpoints = [
        { url: 'https://jsonplaceholder.typicode.com/posts/1', name: 'singleResource', threshold: 600 },
        { url: 'https://jsonplaceholder.typicode.com/users', name: 'usersList', threshold: 500 },
        { url: 'https://jsonplaceholder.typicode.com/albums', name: 'albumsList', threshold: 500 }
      ];

      const healthResults = [];

      for (const endpoint of healthEndpoints) {
        const result = await apiMonitor.measureApiCall(async () => {
          const response = await request.get(endpoint.url);
          expect(response.status()).toBe(200);
          
          // Validate response structure
          const data = await response.json();
          if (Array.isArray(data)) {
            expect(data.length).toBeGreaterThan(0);
          } else {
            expect(data).toHaveProperty('id');
          }
          
          return response;
        }, endpoint.name, endpoint.threshold);

        healthResults.push({
          endpoint: endpoint.name,
          status: 'HEALTHY',
          responseTime: result.duration,
          threshold: endpoint.threshold,
          passed: result.passed
        });
      }

      // Generate health report
      const healthReport = {
        timestamp: new Date().toISOString(),
        overallHealth: healthResults.every(r => r.passed) ? 'HEALTHY' : 'DEGRADED',
        endpoints: healthResults,
        averageResponseTime: Math.round(healthResults.reduce((sum, r) => sum + r.responseTime, 0) / healthResults.length)
      };

      console.log('🏥 Backend Health Report:', JSON.stringify(healthReport, null, 2));
      
      // Assert overall health (allow for some performance variance)
      const healthyEndpoints = healthResults.filter(r => r.passed).length;
      const healthPercentage = (healthyEndpoints / healthResults.length) * 100;
      
      console.log(`🏥 Backend Health Percentage: ${healthPercentage.toFixed(1)}%`);
      
      // Expect at least 80% of endpoints to be healthy
      expect(healthPercentage).toBeGreaterThanOrEqual(80);
    });

    test('should monitor database-like operations performance', async ({ request }) => {
      // Simulate database operations through API calls
      const dbOperations = [
        {
          name: 'READ_SINGLE',
          operation: async () => {
            const response = await request.get('https://jsonplaceholder.typicode.com/posts/1');
            expect(response.status()).toBe(200);
            return response;
          },
          threshold: 600
        },
        {
          name: 'READ_MULTIPLE',
          operation: async () => {
            const response = await request.get('https://jsonplaceholder.typicode.com/posts?_limit=10');
            expect(response.status()).toBe(200);
            const data = await response.json();
            expect(data.length).toBe(10);
            return response;
          },
          threshold: 400
        },
        {
          name: 'CREATE',
          operation: async () => {
            const response = await request.post('https://jsonplaceholder.typicode.com/posts', {
              data: {
                title: 'Performance Test',
                body: 'Backend monitoring test',
                userId: 1
              }
            });
            expect(response.status()).toBe(201);
            return response;
          },
          threshold: 600
        },
        {
          name: 'UPDATE',
          operation: async () => {
            const response = await request.put('https://jsonplaceholder.typicode.com/posts/1', {
              data: {
                id: 1,
                title: 'Updated Performance Test',
                body: 'Updated backend monitoring test',
                userId: 1
              }
            });
            expect(response.status()).toBe(200);
            return response;
          },
          threshold: 600
        },
        {
          name: 'DELETE',
          operation: async () => {
            const response = await request.delete('https://jsonplaceholder.typicode.com/posts/1');
            expect(response.status()).toBe(200);
            return response;
          },
          threshold: 400
        }
      ];

      const dbResults = [];

      for (const dbOp of dbOperations) {
        const result = await apiMonitor.measureApiCall(
          dbOp.operation,
          dbOp.name,
          dbOp.threshold
        );

        dbResults.push({
          operation: dbOp.name,
          duration: result.duration,
          threshold: dbOp.threshold,
          status: result.passed ? 'PASS' : 'FAIL'
        });
      }

      console.log('💾 Database Operations Performance:', JSON.stringify(dbResults, null, 2));
      
      // Assert most operations meet thresholds (allow some performance variance)
      const failedOps = dbResults.filter(r => r.status === 'FAIL');
      const successRate = ((dbResults.length - failedOps.length) / dbResults.length) * 100;
      
      console.log(`📊 Database Operations Success Rate: ${successRate.toFixed(1)}%`);
      
      // Expect at least 80% success rate (4 out of 5 operations should pass)
      expect(successRate).toBeGreaterThanOrEqual(80);
    });
  });

  test.describe('Load and Stress Monitoring', () => {
    test('should monitor API performance under concurrent load', async ({ request }) => {
      const concurrentUsers = 10;
      const requestsPerUser = 3;
      const promises = [];

      console.log(`🚀 Starting load test: ${concurrentUsers} concurrent users, ${requestsPerUser} requests each`);

      // Create concurrent load
      for (let user = 1; user <= concurrentUsers; user++) {
        for (let req = 1; req <= requestsPerUser; req++) {
          promises.push(
            apiMonitor.measureApiCall(async () => {
              const response = await request.get(`https://jsonplaceholder.typicode.com/posts/${req}`);
              expect(response.status()).toBe(200);
              return response;
            }, `user${user}_req${req}`, 1000)
          );
        }
      }

      const results = await Promise.all(promises);
      
      // Analyze load test results
      const durations = results.map(r => r.duration);
      const loadAnalysis = {
        totalRequests: results.length,
        successfulRequests: results.filter(r => r.passed).length,
        averageResponseTime: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
        minResponseTime: Math.min(...durations),
        maxResponseTime: Math.max(...durations),
        p95ResponseTime: apiMonitor.calculatePercentile(durations, 95),
        p99ResponseTime: apiMonitor.calculatePercentile(durations, 99),
        throughput: Math.round(results.length / (Math.max(...durations) / 1000)) // requests per second
      };

      console.log('📊 Load Test Analysis:', JSON.stringify(loadAnalysis, null, 2));
      
      // Assert load test performance (allow for some failures under load)
      const successRate = (loadAnalysis.successfulRequests / loadAnalysis.totalRequests) * 100;
      console.log(`📊 Load Test Success Rate: ${successRate.toFixed(1)}%`);
      
      expect(successRate).toBeGreaterThanOrEqual(80); // At least 80% success rate under load
      expect(loadAnalysis.p95ResponseTime).toBeLessThan(1500); // 95% of requests under 1.5s
    });

    test('should monitor memory and resource usage patterns', async ({ request }) => {
      // Simulate resource-intensive operations
      const resourceTests = [
        {
          name: 'LARGE_DATASET',
          operation: async () => {
            const response = await request.get('https://jsonplaceholder.typicode.com/comments');
            expect(response.status()).toBe(200);
            const data = await response.json();
            expect(data.length).toBeGreaterThan(400); // Large dataset
            return response;
          },
          threshold: 1000
        },
        {
          name: 'MULTIPLE_JOINS',
          operation: async () => {
            // Simulate complex query by making multiple related requests
            const postsResponse = await request.get('https://jsonplaceholder.typicode.com/posts/1');
            const commentsResponse = await request.get('https://jsonplaceholder.typicode.com/posts/1/comments');
            const userResponse = await request.get('https://jsonplaceholder.typicode.com/users/1');
            
            expect(postsResponse.status()).toBe(200);
            expect(commentsResponse.status()).toBe(200);
            expect(userResponse.status()).toBe(200);
            
            return postsResponse;
          },
          threshold: 800
        }
      ];

      const resourceResults = [];

      for (const test of resourceTests) {
        const startMemory = process.memoryUsage();
        
        const result = await apiMonitor.measureApiCallWithSize(
          test.operation,
          test.name,
          test.threshold
        );

        const endMemory = process.memoryUsage();
        const memoryDelta = {
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          external: endMemory.external - startMemory.external
        };

        resourceResults.push({
          operation: test.name,
          duration: result.duration,
          responseSize: result.responseSize,
          memoryDelta,
          efficiency: result.responseSize / result.duration // bytes per ms
        });
      }

      console.log('🧠 Resource Usage Analysis:', JSON.stringify(resourceResults, null, 2));
      
      // Assert resource efficiency
      resourceResults.forEach(result => {
        expect(result.efficiency).toBeGreaterThan(0);
        expect(result.memoryDelta.heapUsed).toBeLessThan(50 * 1024 * 1024); // Less than 50MB
      });
    });
  });

  test.describe('Error Handling and Recovery', () => {
    test('should monitor error rates and response patterns', async ({ request }) => {
      const errorScenarios = [
        {
          name: 'NOT_FOUND',
          url: 'https://jsonplaceholder.typicode.com/posts/99999',
          expectedStatus: 404,
          threshold: 300
        },
        {
          name: 'INVALID_ENDPOINT',
          url: 'https://jsonplaceholder.typicode.com/invalid-endpoint',
          expectedStatus: 404,
          threshold: 300
        }
      ];

      const errorResults = [];

      for (const scenario of errorScenarios) {
        const result = await apiMonitor.measureApiCall(async () => {
          const response = await request.get(scenario.url);
          expect(response.status()).toBe(scenario.expectedStatus);
          return response;
        }, scenario.name, scenario.threshold);

        errorResults.push({
          scenario: scenario.name,
          duration: result.duration,
          status: scenario.expectedStatus,
          handledCorrectly: result.status === scenario.expectedStatus
        });
      }

      console.log('❌ Error Handling Analysis:', JSON.stringify(errorResults, null, 2));
      
      // Assert error handling performance
      errorResults.forEach(result => {
        expect(result.handledCorrectly).toBe(true);
        expect(result.duration).toBeLessThan(500); // Errors should be fast
      });
    });

    test('should monitor API rate limiting and throttling', async ({ request }) => {
      // Test rapid successive requests to check rate limiting
      const rapidRequests = 20;
      const promises = [];

      for (let i = 1; i <= rapidRequests; i++) {
        promises.push(
          apiMonitor.measureApiCall(async () => {
            const response = await request.get('https://jsonplaceholder.typicode.com/posts/1');
            // Most APIs will return 200 or 429 (rate limited)
            expect([200, 429].includes(response.status())).toBe(true);
            return response;
          }, `rapidRequest${i}`, 1000)
        );
      }

      const results = await Promise.all(promises);
      
      const rateLimitAnalysis = {
        totalRequests: results.length,
        successfulRequests: results.filter(r => r.status === 200).length,
        rateLimitedRequests: results.filter(r => r.status === 429).length,
        averageResponseTime: Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length)
      };

      console.log('🚦 Rate Limiting Analysis:', JSON.stringify(rateLimitAnalysis, null, 2));
      
      // Assert rate limiting behavior is reasonable
      expect(rateLimitAnalysis.totalRequests).toBe(rapidRequests);
      expect(rateLimitAnalysis.successfulRequests + rateLimitAnalysis.rateLimitedRequests).toBe(rapidRequests);
    });
  });

  test.afterEach(async () => {
    // Generate comprehensive backend monitoring report
    const report = apiMonitor.generateDetailedReport();
    console.log('📊 Backend Monitoring Report:', JSON.stringify(report, null, 2));
  });
});