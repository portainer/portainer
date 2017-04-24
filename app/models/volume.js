function VolumeViewModel(data) {
  this.Id = data.Name;
  this.Driver = data.Driver;
  this.Options = data.Options;
  this.Labels = data.Labels;
  this.Mountpoint = data.Mountpoint;
  if (data.Portainer) {
    this.Ownership = 'Restricted';
    this.Metadata = {};
    if (data.Portainer.ResourceControl) {
      this.Metadata.ResourceControl = {
        Id: data.Portainer.ResourceControl.Id,
        Users:data.Portainer.ResourceControl.Users,
        Teams: data.Portainer.ResourceControl.Teams
      };
    }
  } else {
    this.Ownership = 'Public';
  }
}
