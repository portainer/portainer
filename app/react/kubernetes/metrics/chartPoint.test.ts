import { formatBytes, formatPercent, toChartPoint } from './chartPoint';

describe('formatBytes', () => {
  it('formats values above 5 bytes using filesize', () => {
    expect(formatBytes(1024)).toBe('1 kB');
  });

  it('formats values of 5 bytes or below with a fixed decimal', () => {
    expect(formatBytes(5)).toBe('5.0B');
    expect(formatBytes(0)).toBe('0.0B');
  });
});

describe('formatPercent', () => {
  it('rounds to the nearest integer for values above 1', () => {
    expect(formatPercent(20)).toBe('20%');
    expect(formatPercent(1.6)).toBe('2%');
  });

  it('formats to one decimal place for values of 1 or below', () => {
    expect(formatPercent(1)).toBe('1.0%');
    expect(formatPercent(0.5)).toBe('0.5%');
  });
});

describe('toChartPoint', () => {
  it('converts cpu, memory and timestamp into a chart point', () => {
    const point = toChartPoint('500m', '128Mi', '2024-01-01T00:00:01Z', 4);

    expect(point.time).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    expect(point.memory).toBeCloseTo(128 * 1024 * 1024, -3);
    expect(point.cpu).toBeCloseTo((0.5 / 4) * 100, 5);
  });
});
