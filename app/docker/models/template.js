function TemplateViewModel(data) {
  this.Type = data.type;
  this.Name = data.name;
  this.Hostname = data.hostname;
  this.Title = data.title;
  this.Description = data.description;
  this.Note = data.note;
  this.Categories = data.categories ? data.categories : [];
  this.Platform = data.platform ? data.platform : 'undefined';
  this.Logo = data.logo;
  this.Image = data.image;
  this.Registry = data.registry ? data.registry : '';
  this.Command = data.command ? data.command : '';
  this.Network = data.network ? data.network : '';
  this.Env = data.env ? data.env : [];
  this.Privileged = data.privileged ? data.privileged : false;
  this.Interactive = data.interactive ? data.interactive : false;
  this.RestartPolicy = data.restart_policy ? data.restart_policy : 'always';
  this.Labels = data.labels ? data.labels : [];
  this.Volumes = [];
  if (data.resources) {
    this.MemoryReservation = data.resources.memory_reservation > 0 ? data.resources.memory_reservation : 0;
    this.MemoryLimit = data.resources.memory_limit > 0 ? data.resources.memory_limit : 0;
    this.CpuLimit = data.resources.cpu_limit > 0 ? data.resources.cpu_limit : 0;
  } else {
    this.MemoryReservation = 0;
    this.MemoryLimit = 0;
    this.CpuLimit = 0;
  }

  if (data.volumes) {
    this.Volumes = data.volumes.map(function (v) {
      // @DEPRECATED: New volume definition introduced
      // via https://github.com/portainer/portainer/pull/1154
      var volume = {
        readOnly: v.readonly || false,
        containerPath: v.container || v,
        type: 'auto'
      };

      if (v.bind) {
        volume.name = v.bind;
        volume.type = 'bind';
      }

      return volume;
    });
  }
  this.Ports = [];
  if (data.ports) {
    this.Ports = data.ports.map(function (p) {
      var portAndProtocol = _.split(p, '/');
      return {
        containerPort: portAndProtocol[0],
        protocol: portAndProtocol[1]
      };
    });
  }
  this.Hosts = data.hosts ? data.hosts : [];
}
