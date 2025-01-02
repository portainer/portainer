import { parseCPU } from './resourceQuotaUtils';

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
