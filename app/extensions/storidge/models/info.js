function StoridgeInfoModel(data) {
  this.Domain = data.domain;
  this.Nodes = data.nodes;
  this.Status = data.status;
  this.FreeBandwidth = data.freeBandwidth;
  this.FreeCapacity = data.freeCapacity;
  this.FreeIOPS = data.freeIOPS;
  this.ProvisionedBandwidth = data.provisionedBandwidth;
  this.ProvisionedCapacity = data.provisionedCapacity;
  this.ProvisionedIOPS = data.provisionedIOPS;
  this.TotalBandwidth = data.totalBandwidth;
  this.TotalCapacity = data.totalCapacity;
  this.TotalIOPS = data.totalIOPS;
  this.UsedBandwidth = data.usedBandwidth;
  this.UsedCapacity = data.usedCapacity;
  this.UsedIOPS = data.usedIOPS;
}
