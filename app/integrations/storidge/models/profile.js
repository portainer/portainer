export function StoridgeProfileDefaultModel() {
  this.Directory = '/cio/';
  this.Capacity = 20;
  this.Redundancy = 2;
  this.Provisioning = 'thin';
  this.Type = 'ssd';
  this.MinIOPS = 100;
  this.MaxIOPS = 2000;
  this.MinBandwidth = 1;
  this.MaxBandwidth = 100;
  this.Filesystem = 'btrfs';
  this.SnapshotEnabled = false;
  this.SnapshotInterval = 1440;
  this.SnapshotMax = 1;
  this.EncryptionEnabled = false;
  this.InterfaceType = '';
  this.InterfaceDriver = '';
  this.InterfaceNetwork = '';
  this.InterfaceConf = '';
  this.Labels = [];
}

export function StoridgeProfileListModel(data) {
  this.Name = data;
  this.Checked = false;
}

export function StoridgeProfileModel(name, data) {
  this.Name = name;
  this.Directory = data.directory;
  this.Capacity = data.capacity;
  this.Provisioning = data.provision;
  this.Type = data.type;
  this.Redundancy = data.level;

  if (data.iops) {
    this.MinIOPS = data.iops.min;
    this.MaxIOPS = data.iops.max;
  }

  if (data.bandwidth) {
    this.MinBandwidth = data.bandwidth.min;
    this.MaxBandwidth = data.bandwidth.max;
  }

  if (data.filesystem) {
    this.Filesystem = data.filesystem.type;
  }
  // this.Filesystem = data.filesystem;

  var service = data.service;

  if (service.snapshot) {
    this.SnapshotEnabled = service.snapshot.enabled;
    this.SnapshotInterval = service.snapshot.interval;
    this.SnapshotMax = service.snapshot.max;
  } else {
    this.SnapshotEnabled = false;
  }

  if (service.encryption) {
    this.EncryptionEnabled = service.encryption.enabled;
  } else {
    this.EncryptionEnabled = false;
  }

  if (data.interface) {
    this.InterfaceType = data.interface.type;
    this.InterfaceDriver = data.interface.driver;
    this.InterfaceNetwork = data.interface.network;
    this.InterfaceConf = data.interface.conf;
  }

  if (data.label) {
    this.Labels = data.label;
  } else {
    this.Labels = [];
  }
}

export function StoridgeCreateProfileRequest(model) {
  this.name = model.Name;
  this.capacity = model.Capacity;
  this.directory = model.Directory;
  this.provision = model.Provisioning;
  this.type = model.Type;
  this.level = model.Redundancy;
  if (model.MinIOPS && model.MaxIOPS) {
    this.iops = {
      min: model.MinIOPS,
      max: model.MaxIOPS
    };
  }

  if (model.MinBandwidth && model.MaxBandwidth) {
    this.bandwidth = {
      min: model.MinBandwidth,
      max: model.MaxBandwidth
    };
  }

  this.filesystem = {
    type: model.Filesystem
  };

  var service = {};

  service.snapshot = {
    enabled: model.SnapshotEnabled
  };
  if (model.SnapshotEnabled) {
    service.snapshot.interval = model.SnapshotInterval;
    service.snapshot.max = model.SnapshotMax;
  }

  service.encryption = {
    enabled: model.EncryptionEnabled
  };

  this.service = service;

  this.interface = {
    driver: model.InterfaceDriver,
    network: model.InterfaceNetwork,
    conf: model.InterfaceConf
  };

  if (model.InterfaceType) {
    this.interface.type = model.InterfaceType;
  }

  this.label = model.Labels;
}
