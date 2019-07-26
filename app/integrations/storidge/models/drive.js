export function StoridgeDriveModel(data) {
  this.Id = data.driveid;
  this.Node = data.node;
  this.Use = data.use;
  this.Status = data.drivestatus.toLowerCase();
  this.Size = data.size;
  this.Type = data.type;
  this.Device = data.device;
}
