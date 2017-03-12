function TaskViewModel(data, node_data) {
  this.Id = data.ID;
  this.Created = data.CreatedAt;
  this.Updated = data.UpdatedAt;
  this.Slot = data.Slot;
  this.Status = data.Status.State;
  this.Image = data.Spec.ContainerSpec ? data.Spec.ContainerSpec.Image : '';
  if (node_data) {
    for (var i = 0; i < node_data.length; ++i) {
      if (data.NodeID === node_data[i].ID) {
        this.Node = node_data[i].Description.Hostname;
      }
    }
  }
}
