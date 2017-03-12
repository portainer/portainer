function VolumeViewModel(data) {
  this.Id = data.Id;
  this.Name = data.Name;
  this.Driver = data.Driver;
  this.Mountpoint = data.Mountpoint;
  if (data.Portainer) {
    this.Metadata = {};
    if (data.Portainer.ResourceControl) {
      this.Metadata.ResourceControl = {
        OwnerId: data.Portainer.ResourceControl.OwnerId
      };
    }
  }
}
