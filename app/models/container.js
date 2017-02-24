function ContainerViewModel(data) {
  this.Id = data.Id;
  this.Status = data.Status;
  this.State = data.State;
  this.Names = data.Names;
  // Unavailable in Docker < 1.10
  if (data.NetworkSettings && !_.isEmpty(data.NetworkSettings.Networks)) {
    this.IP = data.NetworkSettings.Networks[Object.keys(data.NetworkSettings.Networks)[0]].IPAddress;
  }
  this.Image = data.Image;
  this.Command = data.Command;
  this.Checked = false;
  this.Ports = [];
  for (var i = 0; i < data.Ports.length; ++i) {
    var p = data.Ports[i];
    if (p.PublicPort) {
      this.Ports.push({ host: p.IP, private: p.PrivatePort, public: p.PublicPort });
    }
  }
  if (data.Status.includes('(healthy)')) {
    this.Health = 'healthy';
  } else if (data.Status.includes('(unhealthy)')) {
    this.Health = 'unhealthy';
  } else if (data.Status.includes('(health: starting)')) {
    this.Health = 'starting';
  } else {
    this.Health = 'unknown';
  }
}
