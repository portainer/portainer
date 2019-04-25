export function StoridgeVolumeModel(data) {
  this.Allocated = data.allocated;
  this.Capacity = data.capacity;
  this.Directory = data.directory;
  this.IOPSMax = data.maximumIOPS;
  this.IOPSMin = data.minimumIOPS;
  this.BandwidthMin = data.minimumBandwidth;
  this.BandwidthMax = data.maximumBandwidth;
  this.LocalDriveOnly = data.localDriveOnly;
  this.Name = data.name;
  this.Node = data.node;
  this.NodeID = data.nodeid;
  this.Provisioning = data.provisioning;
  this.Redundancy = data.redundancy;
  this.Uuid = data.uuid;
  this.Vdisk = data.vdisk;
  this.Labels = data.labels;

  this.IP = data.ipaddr;
  this.DriveType = data.driveType;
  this.Encryption = data.encryption;
  this.SnapshotEnabled = data.snapshot;
  this.SnapshotInterval = data.snapInterval;
  this.SnapshotMax = data.maximumSnapshots;
  this.Filesystem = data.filesystem;
}

export function StoridgeVolumeUpdateModel(data) {
  this.name = data.Name;
  this.opts = {
    node: data.Node,
    nodeid: data.NodeID,
    capacity: data.Capacity,
    iopsmin: data.IOPSMin,
    iopsmax: data.IOPSMax,
    bandwidthmin: data.BandwidthMin,
    bandwidthmax: data.BandwidthMax
  };
  this.labels = data.Labels;
}