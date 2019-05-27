export function StoridgeInfoModel(data) {
  this.Domain = data.domain;
  this.Nodes = data.nodes;
  this.Condition = data.condition;
  this.ProvisionedBandwidth = data.provisionedBandwidth;
  this.UsedBandwidth = data.usedBandwidth;
  this.FreeBandwidth = data.freeBandwidth;
  this.TotalBandwidth = data.totalBandwidth;
  this.ProvisionedIOPS = data.provisionedIOPS;
  this.UsedIOPS = data.usedIOPS;
  this.FreeIOPS = data.freeIOPS;
  this.TotalIOPS = data.totalIOPS;
  this.ProvisionedCapacity = data.provisionedCapacity;
  this.UsedCapacity = data.usedCapacity;
  this.FreeCapacity = data.freeCapacity;
  this.TotalCapacity = data.totalCapacity;
}
