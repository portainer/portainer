function StoridgeVolumeModel(data) {
  this.Allocated = data['allocate%'];
  this.Capacity = data.capacity;
  this.Directory = data.directory;
  this.IOPSMax = data.iopsmax;
  this.IOPSMin = data.iopsmin;
  this.LocalDriveOnly = data.localdriveonly;
  this.Name = data.name;
  this.Node = data.node;
  this.NodeID = data.nodeid;
  this.Provisioning = data.provisioning;
  this.Redundancy = data.redundancy;
  this.Type = data.type;
  this.Uuid = data.uuid;
  this.Vdisk = data.vdisk;
  this.Labels = data.labels;

  this.IP = data.ipaddr;
  this.Volume = data.volume;
  this.DriveType = data.type;
  this.Compression = data.compression;
  this.Dedup = data.dedup;
  this.Encryption = data.encryption;
  this.Replication = data.replication;
  this.SnapshotEnabled = data.snapshot;
  this.SnapshotInterval = data.snapshotinterval;
  this.SnapshotMax = data.snapshotmax;
  this.Filesystem = data.filesystem;
}

function StoridgeVolumeUpdateModel(data) {
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