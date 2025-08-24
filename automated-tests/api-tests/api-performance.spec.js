/**
 * API Performance Testing Suite
 * Tests API endpoints with comprehensive performance monitoring
 */

const { test, expect } = require('@playwright/test');
const ApiPerformanceMonitor = require('./utils/api-performance-monitor');

test.describe('API Performance Tests', () => {
  let apiMonitor;

  test.beforeEach(async () => {
    apiMonitor = new ApiPerformanceMonitor();
  });

  test.describe('JSONPlaceholder API Performance', () => {
    test('should perform GET requests within performance thresholds', async ({ request }) => {
      // Test multiple endpoints for comprehensive coverage
      const endpoints = [
        { url: 'https://jsonplaceholder.typicode.com/posts', name: 'posts', threshold: 500 },
        { url: 'https://jsonplaceholder.typicode.com/users', name: 'users', threshold: 500 },
        { url: 'https://jsonplaceholder.typicode.com/comments', name: 'comments', threshold: 800 },
        { url: 'https://jsonplaceholder.typicode.com/albums', name: 'albums', threshold: 500 }
      ];

      for (const endpoint of endpoints) {
        const result = await apiMonitor.measureApiCall(async () => {
          const response = await request.get(endpoint.url);
          expect(response.status()).toBe(200);
          const data = await response.json();
          expect(Array.isArray(data)).toBe(true);
          expect(data.length).toBeGreaterThan(0);
          return response;
        }, endpoint.name, endpoint.threshold);

        console.log(`✅ ${endpoint.name} API: ${result.duration}ms (threshold: ${endpoint.threshold}ms)`);
      }

      console.log('📊 API Performance Summary:', JSON.stringify(apiMonitor.generateSummary(), null, 2));
    });

    test('should perform POST requests with performance monitoring', async ({ request }) => {
      const postData = {
        title: 'Performance Test Post',
        body: 'This is a test post for performance monitoring',
        userId: 1
      };

      const result = await apiMonitor.measureApiCall(async () => {
        const response = await request.post('https://jsonplaceholder.typicode.com/posts', {
          data: postData
        });
        expect(response.status()).toBe(201);
        const responseData = await response.json();
        expect(responseData.title).toBe(postData.title);
        expect(responseData.body).toBe(postData.body);
        return response;
      }, 'createPost', 600);

      console.log(`✅ POST API: ${result.duration}ms (threshold: 600ms)`);
      console.log('📊 POST Performance:', JSON.stringify(result, null, 2));
    });

    test('should perform PUT requests with performance monitoring', async ({ request }) => {
      const updateData = {
        id: 1,
        title: 'Updated Performance Test Post',
        body: 'This is an updated test post for performance monitoring',
        userId: 1
      };

      const result = await apiMonitor.measureApiCall(async () => {
        const response = await request.put('https://jsonplaceholder.typicode.com/posts/1', {
          data: updateData
        });
        expect(response.status()).toBe(200);
        const responseData = await response.json();
        expect(responseData.title).toBe(updateData.title);
        return response;
      }, 'updatePost', 600);

      console.log(`✅ PUT API: ${result.duration}ms (threshold: 600ms)`);
    });

    test('should perform DELETE requests with performance monitoring', async ({ request }) => {
      const result = await apiMonitor.measureApiCall(async () => {
        const response = await request.delete('https://jsonplaceholder.typicode.com/posts/1');
        expect(response.status()).toBe(200);
        return response;
      }, 'deletePost', 500);

      console.log(`✅ DELETE API: ${result.duration}ms (threshold: 500ms)`);
    });
  });

  test.describe('REST API Comprehensive Performance', () => {
    test('should handle concurrent API requests efficiently', async ({ request }) => {
      const concurrentRequests = 5;
      const promises = [];

      // Create multiple concurrent requests
      for (let i = 1; i <= concurrentRequests; i++) {
        promises.push(
          apiMonitor.measureApiCall(async () => {
            const response = await request.get(`https://jsonplaceholder.typicode.com/posts/${i}`);
            expect(response.status()).toBe(200);
            const data = await response.json();
            expect(data.id).toBe(i);
            return response;
          }, `concurrentPost${i}`, 800)
        );
      }

      const results = await Promise.all(promises);
      const avgDuration = results.reduce((sum, result) => sum + result.duration, 0) / results.length;

      console.log(`✅ Concurrent Requests: Average ${Math.round(avgDuration)}ms across ${concurrentRequests} requests`);
      expect(avgDuration).toBeLessThan(1000); // Ensure concurrent performance is acceptable
    });

    test('should monitor API response sizes and performance correlation', async ({ request }) => {
      const endpoints = [
        { url: 'https://jsonplaceholder.typicode.com/posts/1', name: 'singlePost' },
        { url: 'https://jsonplaceholder.typicode.com/posts', name: 'allPosts' },
        { url: 'https://jsonplaceholder.typicode.com/comments', name: 'allComments' }
      ];

      for (const endpoint of endpoints) {
        const result = await apiMonitor.measureApiCallWithSize(async () => {
          const response = await request.get(endpoint.url);
          expect(response.status()).toBe(200);
          return response;
        }, endpoint.name, 1000);

        console.log(`✅ ${endpoint.name}: ${result.duration}ms, Size: ${result.responseSize} bytes`);
      }

      const sizeAnalysis = apiMonitor.analyzeSizePerformanceCorrelation();
      console.log('📊 Size/Performance Analysis:', JSON.stringify(sizeAnalysis, null, 2));
    });
  });

  test.describe('API Error Handling Performance', () => {
    test('should handle 404 errors efficiently', async ({ request }) => {
      const result = await apiMonitor.measureApiCall(async () => {
        const response = await request.get('https://jsonplaceholder.typicode.com/posts/999999');
        expect(response.status()).toBe(404);
        return response;
      }, 'notFoundError', 300);

      console.log(`✅ 404 Error Handling: ${result.duration}ms (threshold: 300ms)`);
    });

    test('should handle network timeouts gracefully', async ({ request }) => {
      // Test with a very short timeout to simulate network issues
      const result = await apiMonitor.measureApiCall(async () => {
        try {
          const response = await request.get('https://jsonplaceholder.typicode.com/posts', {
            timeout: 1 // Very short timeout to trigger timeout error
          });
          return response;
        } catch (error) {
          // Expect timeout error
          expect(error.message).toContain('Timeout');
          return { status: () => 'timeout', error: true };
        }
      }, 'timeoutHandling', 100);

      console.log(`✅ Timeout Handling: ${result.duration}ms`);
    });
  });

  test.describe('API Performance Regression Tests', () => {
    test('should maintain consistent performance across multiple runs', async ({ request }) => {
      const runs = 3;
      const results = [];

      for (let i = 1; i <= runs; i++) {
        const result = await apiMonitor.measureApiCall(async () => {
          const response = await request.get('https://jsonplaceholder.typicode.com/posts/1');
          expect(response.status()).toBe(200);
          return response;
        }, `consistencyRun${i}`, 500);

        results.push(result.duration);
      }

      const avgDuration = results.reduce((sum, duration) => sum + duration, 0) / results.length;
      const maxVariation = Math.max(...results) - Math.min(...results);
      
      console.log(`✅ Consistency Test: Avg ${Math.round(avgDuration)}ms, Max Variation: ${maxVariation}ms`);
      
      // Ensure performance is consistent (variation should be reasonable)
      expect(maxVariation).toBeLessThan(300); // Allow up to 300ms variation for network variability
    });
  });

  test.afterEach(async () => {
    // Generate performance report after each test
    const report = apiMonitor.generateDetailedReport();
    console.log('📊 Detailed API Performance Report:', JSON.stringify(report, null, 2));
  });
});