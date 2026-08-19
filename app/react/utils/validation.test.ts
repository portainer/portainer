import { describe, it, expect } from 'vitest';

import { durationValidation } from './validation';

describe('durationValidation', () => {
  describe('empty value handling', () => {
    it('accepts empty when allowEmpty=true (default)', async () => {
      const schema = durationValidation();
      await expect(schema.validate('')).resolves.toBe('');
      await expect(schema.validate(undefined)).resolves.toBeUndefined();
    });

    it('rejects empty when allowEmpty=false', async () => {
      const schema = durationValidation(false);
      await expect(schema.validate('')).rejects.toThrow(
        'Invalid duration format'
      );
    });
  });

  describe('valid durations', () => {
    const schema = durationValidation();

    it('accepts all time units', async () => {
      await expect(schema.validate('100ns')).resolves.toBe('100ns');
      await expect(schema.validate('500us')).resolves.toBe('500us');
      await expect(schema.validate('500µs')).resolves.toBe('500µs');
      await expect(schema.validate('100ms')).resolves.toBe('100ms');
      await expect(schema.validate('30s')).resolves.toBe('30s');
      await expect(schema.validate('5m')).resolves.toBe('5m');
      await expect(schema.validate('1h')).resolves.toBe('1h');
      await expect(schema.validate('7d')).resolves.toBe('7d');
    });

    it('accepts decimal values', async () => {
      await expect(schema.validate('1.5h')).resolves.toBe('1.5h');
      await expect(schema.validate('0.5d')).resolves.toBe('0.5d');
    });

    it('accepts chained units', async () => {
      await expect(schema.validate('1h30m')).resolves.toBe('1h30m');
      await expect(schema.validate('2d12h')).resolves.toBe('2d12h');
      await expect(schema.validate('2h45m30s')).resolves.toBe('2h45m30s');
    });

    it('accepts zero and large values', async () => {
      await expect(schema.validate('0s')).resolves.toBe('0s');
      await expect(schema.validate('365d')).resolves.toBe('365d');
    });
  });

  describe('invalid durations', () => {
    const schema = durationValidation();

    it('rejects numbers without units', async () => {
      await expect(schema.validate('300')).rejects.toThrow(
        'Invalid duration format'
      );
    });

    it('rejects invalid units', async () => {
      await expect(schema.validate('5minutes')).rejects.toThrow(
        'Invalid duration format'
      );
      await expect(schema.validate('7days')).rejects.toThrow(
        'Invalid duration format'
      );
    });

    it('rejects spaces and invalid formats', async () => {
      await expect(schema.validate('5 m')).rejects.toThrow(
        'Invalid duration format'
      );
      await expect(schema.validate('m')).rejects.toThrow(
        'Invalid duration format'
      );
      await expect(schema.validate('-5m')).rejects.toThrow(
        'Invalid duration format'
      );
      await expect(schema.validate('abc')).rejects.toThrow(
        'Invalid duration format'
      );
    });
  });
});
