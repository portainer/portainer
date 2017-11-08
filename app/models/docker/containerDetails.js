function ContainerDetailsViewModel(data) {
  this.Model = data;
  this.Id = data.Id;
  this.State = data.State;
  this.Created = data.Created;
  this.Name = data.Name;
  this.NetworkSettings = data.NetworkSettings;
  this.Args = data.Args;
  this.Image = data.Image;
  this.Config = data.Config;
  this.HostConfig = data.HostConfig;
  this.Mounts = data.Mounts;
  if (data.Portainer) {
    if (data.Portainer.ResourceControl) {
      this.ResourceControl = new ResourceControlViewModel(data.Portainer.ResourceControl);
    }
  }
}
