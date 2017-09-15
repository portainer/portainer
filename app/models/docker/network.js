function NetworkViewModel(data) {
  this.Id = data.Id;
  this.Name = data.Name;
  this.Scope = data.Scope;
  this.Driver = data.Driver;
  this.Attachable = data.Attachable;
  this.IPAM = data.IPAM;
  this.Containers = data.Containers;
  this.Options = data.Options;

  if (data.Portainer) {
    if (data.Portainer.ResourceControl) {
      this.ResourceControl = new ResourceControlViewModel(data.Portainer.ResourceControl);
    }
  }
}
