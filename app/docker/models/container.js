import _ from 'lodash-es';
import { ResourceControlViewModel } from '@/portainer/access-control/models/ResourceControlViewModel';

export function createStatus(statusText) {
  var status = _.toLower(statusText);

  if (status.indexOf('paused') > -1) {
    return 'paused';
  } else if (status.indexOf('dead') > -1) {
    return 'dead';
  } else if (status.indexOf('created') > -1) {
    return 'created';
  } else if (status.indexOf('exited') > -1) {
    return 'stopped';
  } else if (status.indexOf('(healthy)') > -1) {
    return 'healthy';
  } else if (status.indexOf('(unhealthy)') > -1) {
    return 'unhealthy';
  } else if (status.indexOf('(health: starting)') > -1) {
    return 'starting';
  }
  return 'running';
}

export function ContainerViewModel(data) {
  this.Id = data.Id;
  this.Status = createStatus(data.Status);
  this.State = data.State;
  this.Created = data.Created;
  this.Names = data.Names;
  // Unavailable in Docker < 1.10
  if (data.NetworkSettings && !_.isEmpty(data.NetworkSettings.Networks)) {
    this.IP = data.NetworkSettings.Networks[Object.keys(data.NetworkSettings.Networks)[0]].IPAddress;
  }
  this.NetworkSettings = data.NetworkSettings;
  this.Image = data.Image;
  this.ImageID = data.ImageID;
  this.Command = data.Command;
  this.Checked = false;
  this.Labels = data.Labels;
  if (this.Labels && this.Labels['com.docker.compose.project']) {
    this.StackName = this.Labels['com.docker.compose.project'];
  } else if (this.Labels && this.Labels['com.docker.stack.namespace']) {
    this.StackName = this.Labels['com.docker.stack.namespace'];
  }
  this.Mounts = data.Mounts;

  this.IsPortainer = data.IsPortainer;

  this.Ports = [];
  if (data.Ports) {
    for (var i = 0; i < data.Ports.length; ++i) {
      var p = data.Ports[i];
      if (p.PublicPort) {
        this.Ports.push({ host: p.IP, private: p.PrivatePort, public: p.PublicPort });
      }
    }
  }

  if (data.Portainer) {
    if (data.Portainer.ResourceControl) {
      this.ResourceControl = new ResourceControlViewModel(data.Portainer.ResourceControl);
    }
    if (data.Portainer.Agent && data.Portainer.Agent.NodeName) {
      this.NodeName = data.Portainer.Agent.NodeName;
    }
  }
}

export function ContainerStatsViewModel(data) {
  this.read = data.read;
  this.preread = data.preread;
  if (data.memory_stats.privateworkingset !== undefined) {
    // Windows
    this.MemoryUsage = data.memory_stats.privateworkingset;
    this.MemoryCache = 0;
    this.NumProcs = data.num_procs;
    this.isWindows = true;
  } else {
    // Linux
    if (data.memory_stats.stats === undefined || data.memory_stats.usage === undefined) {
      this.MemoryUsage = this.MemoryCache = 0;
    } else {
      this.MemoryCache = 0;
      if (data.memory_stats.stats.cache !== undefined) {
        // cgroups v1
        this.MemoryCache = data.memory_stats.stats.cache;
      }
      this.MemoryUsage = data.memory_stats.usage - this.MemoryCache;
    }
  }
  this.PreviousCPUTotalUsage = data.precpu_stats.cpu_usage.total_usage;
  this.PreviousCPUSystemUsage = data.precpu_stats.system_cpu_usage;
  this.CurrentCPUTotalUsage = data.cpu_stats.cpu_usage.total_usage;
  this.CurrentCPUSystemUsage = data.cpu_stats.system_cpu_usage;
  this.CPUCores = 1;
  if (data.cpu_stats.cpu_usage.percpu_usage) {
    this.CPUCores = data.cpu_stats.cpu_usage.percpu_usage.length;
  } else {
    if (data.cpu_stats.online_cpus !== undefined) {
      this.CPUCores = data.cpu_stats.online_cpus;
    }
  }
  this.Networks = _.values(data.networks);
  if (data.blkio_stats !== undefined && data.blkio_stats.io_service_bytes_recursive !== null) {
    //TODO: take care of multiple block devices
    var readData = data.blkio_stats.io_service_bytes_recursive.find((d) => d.op === 'Read');
    if (readData === undefined) {
      // try the cgroups v2 version
      readData = data.blkio_stats.io_service_bytes_recursive.find((d) => d.op === 'read');
    }
    if (readData !== undefined) {
      this.BytesRead = readData.value;
    }
    var writeData = data.blkio_stats.io_service_bytes_recursive.find((d) => d.op === 'Write');
    if (writeData === undefined) {
      // try the cgroups v2 version
      writeData = data.blkio_stats.io_service_bytes_recursive.find((d) => d.op === 'write');
    }
    if (writeData !== undefined) {
      this.BytesWrite = writeData.value;
    }
  } else {
    //no IO related data is available
    this.noIOdata = true;
  }
}

export function ContainerDetailsViewModel(data) {
  this.Model = data;
  this.Id = data.Id;
  this.State = data.State;
  this.Created = data.Created;
  this.Name = data.Name;
  this.NetworkSettings = data.NetworkSettings;
  this.Args = data.Args;
  this.Image = data.Image;
  this.Config = data.Config;
  this.HostConfig = data.HostConfig;
  this.Mounts = data.Mounts;
  if (data.Portainer && data.Portainer.ResourceControl) {
    this.ResourceControl = new ResourceControlViewModel(data.Portainer.ResourceControl);
  }
  this.IsPortainer = data.IsPortainer;
}
