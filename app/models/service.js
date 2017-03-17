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
    // Find service status
    var globalStatus = {};
    for (var t in runningTasks) {
      if (globalStatus[runningTasks[t].Status.State]) {
        globalStatus[runningTasks[t].Status.State]++;
      } else {
        globalStatus[runningTasks[t].Status.State] = 1;
      }
    }
    // If runningTasks.length === 0, service is down
    // If runningTasks.length != Replicas, we are preparing or in a loop of start/fail
    // If all running => running
    // If some running but not all => Partially running
    // If some starting and no running => starting
    // If no running, no starting, but some preparing => preparing
    // Else unknown
    this.Status = "unknown";
    if (runningTasks.length === 0) {
      this.Status = "down";
    } else if (runningTasks.length !== this.Replicas) {
      this.Status = "preparing";
    } else if (globalStatus["running"] && globalStatus["running"] === runningTasks.length) {
      this.Status = "running";
    } else if (globalStatus["running"]) {
      this.Status = "partially running";
    } else if (!globalStatus["running"] && globalStatus["starting"]) {
      this.Status = "starting";
    } else if (!globalStatus["running"] && !globalStatus["starting"] && globalStatus["preparing"]) {
      this.Status = "preparing";
    }
  }
  this.Labels = data.Spec.Labels;
  if (data.Spec.TaskTemplate.ContainerSpec) {
    this.ContainerLabels = data.Spec.TaskTemplate.ContainerSpec.Labels;
  }
  if (data.Spec.TaskTemplate.ContainerSpec.Env) {
    this.Env = data.Spec.TaskTemplate.ContainerSpec.Env;
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
