export function TaskViewModel(data) {
  this.Id = data.ID;
  this.Created = data.CreatedAt;
  this.Updated = data.UpdatedAt;
  this.Slot = data.Slot;
  this.Spec = data.Spec;
  this.Status = data.Status;
  this.DesiredState = data.DesiredState;
  this.ServiceId = data.ServiceID;
  this.NodeId = data.NodeID;
  if (data.Status && data.Status.ContainerStatus && data.Status.ContainerStatus.ContainerID) {
    this.ContainerId = data.Status.ContainerStatus.ContainerID;
  }
}
