function TaskViewModel(data) {
  this.Id = data.ID;
  this.Created = data.CreatedAt;
  this.Updated = data.UpdatedAt;
  this.Slot = data.Slot;
  this.Spec = data.Spec;
  this.Status = data.Status;
  this.ServiceId = data.ServiceID;
  this.NodeId = data.NodeID;
}
