export function StoridgeNodeModel(name, data) {
  this.Name = name;
  this.IP = data.ip;
  this.Role = data.role;
  this.Status = data.status;
}

export function StoridgeNodeDetailedModel(name, properties) {
  this.Name = name;
  this.Condition = properties.condition;
  this.Domain = properties.domain;
  this.DomainID = properties.domainID;
  this.FreeBandwidth = properties.freeBandwidth;
  this.FreeCapacity = properties.freeCapacity;
  this.FreeIOPS = properties.freeIOPS;
  this.Hdds = properties.hdds;
  this.MetadataVersion = properties.metadataVersion;
  this.Nodes = properties.nodes;
  this.ProvisionedBandwidth = properties.provisionedBandwidth;
  this.ProvisionedCapacity = properties.provisionedCapacity;
  this.ProvisionedIOPS = properties.provisionedIOPS;
  this.Ssds = properties.ssds;
  this.Status = properties.status;
  this.TotalBandwidth = properties.totalBandwidth;
  this.TotalCapacity = properties.totalCapacity;
  this.TotalIOPS = properties.totalIOPS;
  this.UsedBandwidth = properties.usedBandwidth;
  this.UsedCapacity = properties.usedCapacity;
  this.UsedIOPS = properties.usedIOPS;
  this.Vdisks = properties.vdisks;
}