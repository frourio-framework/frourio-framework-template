import { expect } from 'vitest';
import { TestCase } from '$/@frouvel/kaname/testing';
import { fake } from '$/@frouvel/kaname/testing';

/**
 * Example Test demonstrating testing utilities
 *
 * NOTE: This uses TestCase (not TestCaseIntegration) because
 * it doesn't need database or HTTP server functionality.
 */
class TestingUtilitiesTest extends TestCase {
  run() {
    this.suite('Testing Framework Utilities', () => {
      this.test('can use fake data generators', () => {
        // Demonstrate fake data utilities
        const randomString = fake.string(10);
        const randomEmail = fake.email();
        const randomNumber = fake.number(1, 100);
        const randomBoolean = fake.boolean();
        const randomUuid = fake.uuid();
        const randomName = fake.name();
        const randomText = fake.text(5);

        expect(randomString).toHaveLength(10);
        expect(randomEmail).toContain('@');
        expect(randomEmail).toContain('test.com');
        expect(randomNumber).toBeGreaterThanOrEqual(1);
        expect(randomNumber).toBeLessThanOrEqual(100);
        expect(typeof randomBoolean).toBe('boolean');
        expect(randomUuid).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
        );
        expect(typeof randomName).toBe('string');
        expect(randomName.length).toBeGreaterThan(0);
        expect(typeof randomText).toBe('string');
      });

      this.test('fake.pick selects from array', () => {
        const options = ['option1', 'option2', 'option3'];
        const selected = fake.pick(options);

        expect(options).toContain(selected);
      });

      this.test('fake.date generates valid dates', () => {
        const date = fake.date();

        expect(date).toBeInstanceOf(Date);
        expect(date.getTime()).toBeLessThanOrEqual(Date.now());
      });

      this.test('fake.date can generate dates in range', () => {
        const start = new Date('2024-01-01');
        const end = new Date('2024-12-31');
        const date = fake.date(start, end);

        expect(date.getTime()).toBeGreaterThanOrEqual(start.getTime());
        expect(date.getTime()).toBeLessThanOrEqual(end.getTime());
      });
    });
  }
}

// Run the test suite
new TestingUtilitiesTest().run();
