import { ContainerStatsViewModel } from './containerStats';

describe('ContainerStatsViewModel', () => {
  it('extracts CPU fields correctly from Linux cgroups v2 stats', () => {
    const vm = new ContainerStatsViewModel({
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

    expect(vm.CurrentCPUTotalUsage).toBe(709734856000);
    expect(vm.PreviousCPUTotalUsage).toBe(709734581000);
    expect(vm.CurrentCPUSystemUsage).toBe(16006861690000000);
    expect(vm.PreviousCPUSystemUsage).toBe(16006857740000000);
    expect(vm.CPUCores).toBe(4);
    expect(vm.isWindows).toBe(false);
  });

  it('prefers percpu_usage length over online_cpus for CPUCores', () => {
    const vm = new ContainerStatsViewModel({
      read: '2024-01-01T00:00:01Z',
      preread: '2024-01-01T00:00:00Z',
      cpu_stats: {
        cpu_usage: {
          total_usage: 2000000,
          percpu_usage: [1000000, 1000000],
        },
        system_cpu_usage: 100000000,
        online_cpus: 8,
      },
      precpu_stats: { cpu_usage: { total_usage: 0 }, system_cpu_usage: 0 },
      memory_stats: { usage: 0 },
    });

    expect(vm.CPUCores).toBe(2);
  });

  it('falls back to 1 for CPUCores when percpu_usage and online_cpus are absent', () => {
    const vm = new ContainerStatsViewModel({
      read: '2024-01-01T00:00:01Z',
      preread: '2024-01-01T00:00:00Z',
      cpu_stats: {
        cpu_usage: { total_usage: 1000 },
        system_cpu_usage: 10000,
      },
      precpu_stats: { cpu_usage: { total_usage: 500 }, system_cpu_usage: 9000 },
      memory_stats: { usage: 0 },
    });

    expect(vm.CPUCores).toBe(1);
  });
});
