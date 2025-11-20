import { TestCaseDatabase } from './TestCaseDatabase';
import type { FastifyInstance } from 'fastify';
import app from '$/bootstrap/app';
import type { HttpKernel } from '$/@frouvel/kaname/foundation';
import { config } from '$/@frouvel/kaname/config';

/**
 * TestCaseIntegration provides full integration testing with server and database
 * Automatically starts a test server and manages database lifecycle
 */
export abstract class TestCaseIntegration extends TestCaseDatabase {
  protected declare server: FastifyInstance;
  protected baseURL: string;
  private static testPort: number;

  constructor() {
    super();
    // Use a different port for each test run to avoid conflicts
    const testingConfig = config('testing.server');
    TestCaseIntegration.testPort = testingConfig.port;
    this.baseURL = `http://localhost:${TestCaseIntegration.testPort}`;
  }

  /**
   * Start the test server
   */
  protected async setUpBeforeClass(): Promise<void> {
    await super.setUpBeforeClass();

    const kernel = app.make<HttpKernel>('HttpKernel');
    this.server = await kernel.handle();
    await this.server.listen({
      port: TestCaseIntegration.testPort,
      host: '0.0.0.0',
    });
  }

  /**
   * Close the test server
   */
  protected async tearDownAfterClass(): Promise<void> {
    if (this.server) {
      await this.server.close();
    }
    await super.tearDownAfterClass();
  }

  /**
   * Make a GET request to the test server
   */
  protected async get(
    path: string,
    headers?: Record<string, string>,
  ): Promise<any> {
    const response = await this.server.inject({
      method: 'GET',
      url: path,
      headers,
    });
    
    let body;
    try {
      body = response.json();
    } catch {
      body = response.body;
    }
    
    return {
      status: response.statusCode,
      body,
      headers: response.headers,
    };
  }

  /**
   * Make a POST request to the test server
   */
  protected async post(
    path: string,
    body?: any,
    headers?: Record<string, string>,
  ): Promise<any> {
    const response = await this.server.inject({
      method: 'POST',
      url: path,
      payload: body,
      headers: {
        'content-type': 'application/json',
        ...headers,
      },
    });
    
    let responseBody;
    try {
      responseBody = response.json();
    } catch {
      responseBody = response.body;
    }
    
    return {
      status: response.statusCode,
      body: responseBody,
      headers: response.headers,
    };
  }

  /**
   * Make a PUT request to the test server
   */
  protected async put(
    path: string,
    body?: any,
    headers?: Record<string, string>,
  ): Promise<any> {
    const response = await this.server.inject({
      method: 'PUT',
      url: path,
      payload: body,
      headers: {
        'content-type': 'application/json',
        ...headers,
      },
    });
    
    let responseBody;
    try {
      responseBody = response.json();
    } catch {
      responseBody = response.body;
    }
    
    return {
      status: response.statusCode,
      body: responseBody,
      headers: response.headers,
    };
  }

  /**
   * Make a PATCH request to the test server
   */
  protected async patch(
    path: string,
    body?: any,
    headers?: Record<string, string>,
  ): Promise<any> {
    const response = await this.server.inject({
      method: 'PATCH',
      url: path,
      payload: body,
      headers: {
        'content-type': 'application/json',
        ...headers,
      },
    });
    
    let responseBody;
    try {
      responseBody = response.json();
    } catch {
      responseBody = response.body;
    }
    
    return {
      status: response.statusCode,
      body: responseBody,
      headers: response.headers,
    };
  }

  /**
   * Make a DELETE request to the test server
   */
  protected async delete(
    path: string,
    headers?: Record<string, string>,
  ): Promise<any> {
    const response = await this.server.inject({
      method: 'DELETE',
      url: path,
      headers,
    });
    
    let body;
    try {
      body = response.json();
    } catch {
      body = response.body;
    }
    
    return {
      status: response.statusCode,
      body,
      headers: response.headers,
    };
  }

  /**
   * Create an authorization header with JWT token
   */
  protected authHeader(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Assert response status
   */
  protected assertStatus(response: any, expected: number): void {
    if (response.status !== expected) {
      throw new Error(
        `Expected status ${expected} but got ${response.status}. Body: ${JSON.stringify(response.body, null, 2)}`,
      );
    }
  }

  /**
   * Assert response is successful (2xx)
   */
  protected assertOk(response: any): void {
    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        `Expected successful response but got ${response.status}. Body: ${JSON.stringify(response.body, null, 2)}`,
      );
    }
  }

  /**
   * Assert response contains expected data
   */
  protected assertResponseContains(
    response: any,
    expected: Record<string, any>,
  ): void {
    const body = response.body;
    for (const [key, value] of Object.entries(expected)) {
      if (body[key] !== value) {
        throw new Error(
          `Expected ${key} to be ${value} but got ${body[key]}`,
        );
      }
    }
  }
}
