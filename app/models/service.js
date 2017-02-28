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
}
