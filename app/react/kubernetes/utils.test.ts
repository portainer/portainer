import { parseCPU } from './utils';
import { convertBase2ToMiB } from './namespaces/resourceQuotaUtils';

// test parseCPU with '', '2', '100m', '100u'
describe('parseCPU', () => {
  it('should return 0 for empty string', () => {
    expect(parseCPU('')).toBe(0);
  });
  it('should return 2 for 2', () => {
    expect(parseCPU('2')).toBe(2);
  });
  it('should return 0.1 for 100m', () => {
    expect(parseCPU('100m')).toBe(0.1);
  });
  it('should return 0.0001 for 100u', () => {
    expect(parseCPU('100u')).toBe(0.0001);
  });
});

// test convertBase2ToMiB
describe('convertBase2ToMiB', () => {
  it('should return empty string for empty string', () => {
    expect(convertBase2ToMiB('')).toBe('');
  });
  it('should return 2Mi for 2Mi', () => {
    expect(convertBase2ToMiB('2Mi')).toBe('2Mi');
  });
  it('should return 1024Mi for 1Gi', () => {
    expect(convertBase2ToMiB('1Gi')).toBe('1024Mi');
  });
  it('should return 1024Mi for 1Ti', () => {
    expect(convertBase2ToMiB('1Ti')).toBe('1048576Mi');
  });
});
