function ContainerStatsViewModel(data) {
  this.Date = data.read;
  this.MemoryUsage = data.memory_stats.usage;
  this.PreviousCPUTotalUsage = data.precpu_stats.cpu_usage.total_usage;
  this.PreviousCPUSystemUsage = data.precpu_stats.system_cpu_usage;
  this.CurrentCPUTotalUsage = data.cpu_stats.cpu_usage.total_usage;
  this.CurrentCPUSystemUsage = data.cpu_stats.system_cpu_usage;
  if (data.cpu_stats.cpu_usage.percpu_usage) {
    this.CPUCores = data.cpu_stats.cpu_usage.percpu_usage.length;
  }
  this.Networks = _.values(data.networks);
}
