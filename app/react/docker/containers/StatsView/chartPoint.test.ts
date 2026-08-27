import { ContainerStatsViewModel } from '@/docker/models/containerStats';

import { calculateCpuPercent, formatPercent } from './chartPoint';

describe('formatPercent', () => {
  it('rounds to the nearest integer for values >= 1', () => {
    expect(formatPercent(20)).toBe('20%');
    expect(formatPercent(1.6)).toBe('2%');
  });

  it('formats to one decimal place for values between 0.1 and 1', () => {
    expect(formatPercent(0.5)).toBe('0.5%');
    expect(formatPercent(0.1)).toBe('0.1%');
  });

  it('formats to two decimal places for values below 0.1', () => {
    expect(formatPercent(0.028)).toBe('0.03%');
    expect(formatPercent(0)).toBe('0.00%');
  });
});

// Real-world fixture from Docker API: cpu_stats then precpu_stats
const realWorldStats = new ContainerStatsViewModel({
  read: '2024-01-01T00:00:01Z',
  preread: '2024-01-01T00:00:00Z',
  cpu_stats: {
    cpu_usage: { total_usage: 709734856000 },
    system_cpu_usage: 16006861690000000,
    online_cpus: 4,
  },
  precpu_stats: {
    cpu_usage: { total_usage: 709734581000 },
    system_cpu_usage: 16006857740000000,
  },
  memory_stats: { usage: 0 },
});

describe('calculateCpuPercent', () => {
  it('computes the correct percentage from real-world cgroups v2 stats', () => {
    // cpuDelta=275000, systemDelta=3950000000, cores=4 → ~0.028%
    expect(calculateCpuPercent(realWorldStats)).toBeCloseTo(0.0278, 3);
  });

  it('returns 0 when cpu and system deltas are both zero', () => {
    const idleStats = new ContainerStatsViewModel({
      read: '2024-01-01T00:00:01Z',
      preread: '2024-01-01T00:00:00Z',
      cpu_stats: {
        cpu_usage: { total_usage: 1000000 },
        system_cpu_usage: 100000000,
        online_cpus: 2,
      },
      precpu_stats: {
        cpu_usage: { total_usage: 1000000 },
        system_cpu_usage: 100000000,
      },
      memory_stats: { usage: 0 },
    });

    expect(calculateCpuPercent(idleStats)).toBe(0);
  });
});
