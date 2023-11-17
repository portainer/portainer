import { json2formData } from './axios';

describe('json2formData', () => {
  it('should handle undefined and null values', () => {
    const json = { key1: undefined, key2: null };
    const formData = json2formData(json);
    expect(formData.has('key1')).toBe(false);
    expect(formData.has('key2')).toBe(false);
  });

  it('should handle File instances', () => {
    const file = new File([''], 'filename');
    const json = { key: file };
    const formData = json2formData(json);
    expect(formData.get('key')).toBe(file);
  });

  it('should handle arrays', () => {
    const json = { key: [1, 2, 3] };
    const formData = json2formData(json);
    expect(formData.get('key')).toBe('[1,2,3]');
  });

  it('should handle objects', () => {
    const json = { key: { subkey: 'value' } };
    const formData = json2formData(json);
    expect(formData.get('key')).toBe('{"subkey":"value"}');
  });

  it('should handle other types of values', () => {
    const json = { key1: 'value', key2: 123, key3: true };
    const formData = json2formData(json);
    expect(formData.get('key1')).toBe('value');
    expect(formData.get('key2')).toBe('123');
    expect(formData.get('key3')).toBe('true');
  });

  it('should fail when handling circular references', () => {
    const circularReference = { self: undefined };

    // @ts-expect-error test
    circularReference.self = circularReference;
    const json = { key: circularReference };
    expect(() => json2formData(json)).toThrow();
  });
});
