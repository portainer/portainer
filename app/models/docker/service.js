function ServiceViewModel(data, runningTasks, nodes) {
  this.Model = data;
  this.Id = data.ID;
  this.Tasks = [];
  this.Name = data.Spec.Name;
  this.CreatedAt = data.CreatedAt;
  this.UpdatedAt = data.UpdatedAt;
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
  if (data.Spec.TaskTemplate.Resources) {
    if (data.Spec.TaskTemplate.Resources.Limits) {
    this.LimitNanoCPUs = data.Spec.TaskTemplate.Resources.Limits.NanoCPUs;
    this.LimitMemoryBytes = data.Spec.TaskTemplate.Resources.Limits.MemoryBytes;
    }
    if (data.Spec.TaskTemplate.Resources.Reservations) {
    this.ReservationNanoCPUs = data.Spec.TaskTemplate.Resources.Reservations.NanoCPUs;
    this.ReservationMemoryBytes = data.Spec.TaskTemplate.Resources.Reservations.MemoryBytes;
    }
  }

  if (data.Spec.TaskTemplate.RestartPolicy) {
    this.RestartCondition = data.Spec.TaskTemplate.RestartPolicy.Condition;
    this.RestartDelay = data.Spec.TaskTemplate.RestartPolicy.Delay;
    this.RestartMaxAttempts = data.Spec.TaskTemplate.RestartPolicy.MaxAttempts;
    this.RestartWindow = data.Spec.TaskTemplate.RestartPolicy.Window;
  } else {
    this.RestartCondition = 'none';
    this.RestartDelay = 0;
    this.RestartMaxAttempts = 0;
    this.RestartWindow = 0;
  }
  this.Constraints = data.Spec.TaskTemplate.Placement ? data.Spec.TaskTemplate.Placement.Constraints || [] : [];
  this.Labels = data.Spec.Labels;

  var containerSpec = data.Spec.TaskTemplate.ContainerSpec;
  if (containerSpec) {
    this.ContainerLabels = containerSpec.Labels;
    this.Env = containerSpec.Env;
    this.Mounts = containerSpec.Mounts || [];
    this.User = containerSpec.User;
    this.Dir = containerSpec.Dir;
    this.Command = containerSpec.Command;
    this.Arguments = containerSpec.Args;
    this.Secrets = containerSpec.Secrets;
  }
  if (data.Endpoint) {
    this.Ports = data.Endpoint.Ports;
  }

  this.Mounts = [];
  if (data.Spec.TaskTemplate.ContainerSpec.Mounts) {
    this.Mounts = data.Spec.TaskTemplate.ContainerSpec.Mounts;
  }

  this.VirtualIPs = data.Endpoint ? data.Endpoint.VirtualIPs : [];

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
    if (data.Portainer.ResourceControl) {
      this.ResourceControl = new ResourceControlViewModel(data.Portainer.ResourceControl);
    }
  }
}
