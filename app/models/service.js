function ServiceViewModel(data, runningTasks, nodes) {
  this.Model = data;
  this.Id = data.ID;
  this.Name = data.Spec.Name;
  this.Image = data.Spec.TaskTemplate.ContainerSpec.Image;
  this.Version = data.Version.Index;
  if (data.Spec.Mode.Replicated) {
    this.Mode = 'replicated' ;
    this.Replicas = data.Spec.Mode.Replicated.Replicas;
  } else {
    this.Mode = 'global';
    if (nodes) {
      this.Replicas = nodes.length;
    }
  }
  if (runningTasks) {
    this.Running = runningTasks.length;
  }
  this.Labels = data.Spec.Labels;
  if (data.Spec.TaskTemplate.ContainerSpec) {
    this.ContainerLabels = data.Spec.TaskTemplate.ContainerSpec.Labels;
  }
  if (data.Spec.TaskTemplate.ContainerSpec.Env) {
    this.Env = data.Spec.TaskTemplate.ContainerSpec.Env;
  }
  // Find first manager IP
  if (nodes) {
    for (var n in nodes) {
      if (undefined === nodes[n].ManagerStatus) continue;
      if (nodes[n].ManagerStatus.Reachability !== "reachable") continue;
      var manager_ip = nodes[n].ManagerStatus.Addr.split(":")[0];
      // Get service exposed port
      this.PublishedPorts = [];
      if (undefined === data.Endpoint.Ports) break;
      for (var i = 0; i < data.Endpoint.Ports.length; ++i) {
        var p = data.Endpoint.Ports[i];
        this.PublishedPorts.push({ host: manager_ip, private: p.TargetPort, public: p.PublishedPort });
      }
      break;
    }
  }
  this.Mounts = [];
  if (data.Spec.TaskTemplate.ContainerSpec.Mounts) {
    this.Mounts = data.Spec.TaskTemplate.ContainerSpec.Mounts;
  }
  if (data.Endpoint.Ports) {
    this.Ports = data.Endpoint.Ports;
  }
  if (data.Spec.UpdateConfig) {
    this.UpdateParallelism = (typeof data.Spec.UpdateConfig.Parallelism !== undefined) ? data.Spec.UpdateConfig.Parallelism || 0 : 1;
    this.UpdateDelay = data.Spec.UpdateConfig.Delay || 0;
    this.UpdateFailureAction = data.Spec.UpdateConfig.FailureAction || 'pause';
  } else {
    this.UpdateParallelism = 1;
    this.UpdateDelay = 0;
    this.UpdateFailureAction = 'pause';
  }

  this.Checked = false;
  this.Scale = false;
  this.EditName = false;

  if (data.Portainer) {
    this.Metadata = {};
    if (data.Portainer.ResourceControl) {
      this.Metadata.ResourceControl = {
        OwnerId: data.Portainer.ResourceControl.OwnerId
      };
    }
  }
}
