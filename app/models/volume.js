function VolumeViewModel(data) {
  this.Id = data.Id;
  this.Name = data.Name;
  this.Driver = data.Driver;
  this.Mountpoint = data.Mountpoint;
  this.Ownership = 'private';
}
