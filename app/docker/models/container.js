function ContainerViewModel(data) {
  this.Id = data.Id;
  this.Status = data.Status;
  this.State = data.State;
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
  }
}

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

function ContainerDetailsViewModel(data) {
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
  if (data.Portainer) {
    if (data.Portainer.ResourceControl) {
      this.ResourceControl = new ResourceControlViewModel(data.Portainer.ResourceControl);
    }
  }
}
