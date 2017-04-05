function StackViewModel(data) {
  this.Model = data;
  this.Name = data.Name;
  this.Items = data.Items;
  this.Type = data.Type;
  this.Checked = false;

  if (data.Portainer) {
    this.Metadata = {};
    if (data.Portainer.ResourceControl) {
      this.Metadata.ResourceControl = {
        OwnerId: data.Portainer.ResourceControl.OwnerId
      };
    }
  }
}
