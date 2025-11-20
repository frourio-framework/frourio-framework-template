import { expect } from 'vitest';
import { TestCaseIntegration } from '$/@frouvel/kaname/testing';

/**
 * Example Integration Test for Health Endpoint
 *
 * This test demonstrates the basic usage of TestCaseIntegration
 */
class HealthIntegrationTest extends TestCaseIntegration {
  run() {
    this.suite('Health API', () => {
      this.test('GET /api/health returns OK', async () => {
        const response = await this.get('/api/health');

        expect(response.status).toBe(200);
        expect(response.body).toBe('OK');
      });

      this.test('GET /api/health returns correct status', async () => {
        const response = await this.get('/api/health');

        this.assertOk(response);
        expect(response.body).toBe('OK');
      });
    });
  }
}

// Run the test suite
new HealthIntegrationTest().run();
