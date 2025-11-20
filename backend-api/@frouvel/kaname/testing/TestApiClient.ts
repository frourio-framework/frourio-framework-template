import type { FastifyInstance } from 'fastify';

export interface ApiResponse<T = any> {
  status: number;
  body: T;
  headers: Record<string, any>;
  raw: any;
}

/**
 * API Client for integration testing
 * Provides a fluent interface for making HTTP requests to the test server
 */
export class TestApiClient {
  private headers: Record<string, string> = {};
  private authToken?: string;

  constructor(private readonly server: FastifyInstance) {}

  /**
   * Set custom headers for the next request
   */
  withHeaders(headers: Record<string, string>): this {
    this.headers = { ...this.headers, ...headers };
    return this;
  }

  /**
   * Set authorization token for the next request
   */
  withAuth(token: string): this {
    this.authToken = token;
    return this;
  }

  /**
   * Set bearer token for the next request
   */
  withBearerToken(token: string): this {
    return this.withAuth(token);
  }

  /**
   * Make a GET request
   */
  async get<T = any>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path);
  }

  /**
   * Make a POST request
   */
  async post<T = any>(path: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, body);
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(path: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, body);
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(path: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, body);
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path);
  }

  /**
   * Make a generic HTTP request
   */
  private async request<T = any>(
    method: string,
    path: string,
    body?: any,
  ): Promise<ApiResponse<T>> {
    const headers = { ...this.headers };

    // Add auth header if token is set
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    // Add content-type for body requests
    if (body && !headers['content-type']) {
      headers['content-type'] = 'application/json';
    }

    const response = await this.server.inject({
      method: method as any,
      url: path,
      payload: body,
      headers,
    });

    // Reset headers and auth for next request
    this.headers = {};
    this.authToken = undefined;

    let parsedBody: T;
    try {
      parsedBody = response.json<T>();
    } catch {
      parsedBody = response.body as T;
    }

    return {
      status: response.statusCode,
      body: parsedBody,
      headers: response.headers,
      raw: response,
    };
  }

  /**
   * Assert response status is as expected
   */
  assertStatus(response: ApiResponse, expected: number): void {
    if (response.status !== expected) {
      throw new Error(
        `Expected status ${expected} but got ${response.status}.\nBody: ${JSON.stringify(response.body, null, 2)}`,
      );
    }
  }

  /**
   * Assert response is successful (2xx)
   */
  assertOk(response: ApiResponse): void {
    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        `Expected successful response but got ${response.status}.\nBody: ${JSON.stringify(response.body, null, 2)}`,
      );
    }
  }

  /**
   * Assert response is created (201)
   */
  assertCreated(response: ApiResponse): void {
    this.assertStatus(response, 201);
  }

  /**
   * Assert response is no content (204)
   */
  assertNoContent(response: ApiResponse): void {
    this.assertStatus(response, 204);
  }

  /**
   * Assert response is bad request (400)
   */
  assertBadRequest(response: ApiResponse): void {
    this.assertStatus(response, 400);
  }

  /**
   * Assert response is unauthorized (401)
   */
  assertUnauthorized(response: ApiResponse): void {
    this.assertStatus(response, 401);
  }

  /**
   * Assert response is forbidden (403)
   */
  assertForbidden(response: ApiResponse): void {
    this.assertStatus(response, 403);
  }

  /**
   * Assert response is not found (404)
   */
  assertNotFound(response: ApiResponse): void {
    this.assertStatus(response, 404);
  }

  /**
   * Assert response is validation error (422)
   */
  assertUnprocessable(response: ApiResponse): void {
    this.assertStatus(response, 422);
  }

  /**
   * Assert response contains expected data
   */
  assertResponseContains(
    response: ApiResponse,
    expected: Record<string, any>,
  ): void {
    const body = response.body;
    for (const [key, value] of Object.entries(expected)) {
      if (body[key] !== value) {
        throw new Error(
          `Expected ${key} to be ${JSON.stringify(value)} but got ${JSON.stringify(body[key])}`,
        );
      }
    }
  }

  /**
   * Assert response body matches expected shape
   */
  assertResponseShape(
    response: ApiResponse,
    shape: Record<string, string>,
  ): void {
    const body = response.body;
    for (const [key, type] of Object.entries(shape)) {
      const actualType = typeof body[key];
      if (actualType !== type) {
        throw new Error(
          `Expected ${key} to be of type ${type} but got ${actualType}`,
        );
      }
    }
  }

  /**
   * Assert array response has expected length
   */
  assertArrayLength(response: ApiResponse, expected: number): void {
    if (!Array.isArray(response.body)) {
      throw new Error(`Expected response body to be an array`);
    }
    if (response.body.length !== expected) {
      throw new Error(
        `Expected array length to be ${expected} but got ${response.body.length}`,
      );
    }
  }

  /**
   * Assert response has pagination metadata
   */
  assertHasPagination(response: ApiResponse): void {
    const body = response.body;
    if (!body.meta || typeof body.meta !== 'object') {
      throw new Error('Expected response to have pagination metadata');
    }

    const requiredFields = [
      'currentPage',
      'totalPages',
      'totalCount',
      'perPage',
    ];
    for (const field of requiredFields) {
      if (!(field in body.meta)) {
        throw new Error(`Expected pagination meta to have ${field}`);
      }
    }
  }

  /**
   * Assert response is RFC9457 Problem Details
   */
  assertProblemDetails(response: ApiResponse): void {
    const body = response.body;
    if (typeof body.type !== 'string') {
      throw new Error('Expected ProblemDetails to have type field');
    }
    if (typeof body.title !== 'string') {
      throw new Error('Expected ProblemDetails to have title field');
    }
    if (typeof body.status !== 'number') {
      throw new Error('Expected ProblemDetails to have status field');
    }
  }
}
