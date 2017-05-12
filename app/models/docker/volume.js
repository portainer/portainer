function VolumeViewModel(data) {
  this.Id = data.Name;
  this.Driver = data.Driver;
  this.Options = data.Options;
  this.Labels = data.Labels;
  this.Mountpoint = data.Mountpoint;

  if (data.Portainer) {
    if (data.Portainer.ResourceControl) {
      this.ResourceControl = new ResourceControlViewModel(data.Portainer.ResourceControl);
    }
  }
}
