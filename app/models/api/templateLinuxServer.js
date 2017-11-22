function TemplateLSIOViewModel(data) {
  this.Type = data.type;
  this.Title = data.title;
  this.Note = data.description;
  this.Categories = data.category ? data.category : [];
  this.Platform = data.platform ? data.platform : 'linux';
  this.Logo = data.logo;
  this.Image = data.image;
  this.Registry = data.registry ? data.registry : '';
  this.Command = data.command ? data.command : '';
  this.Network = data.network ? data.network : '';
  this.Env = data.env ? data.env : [];
  this.Privileged = data.privileged ? data.privileged : false;
  this.Interactive = data.interactive ? data.interactive : false;
  this.RestartPolicy = data.restart_policy ? data.restart_policy : 'always';
  this.Volumes = [];
  if (data.volumes) {
    this.Volumes = data.volumes.map(function (v) {
      return {
        readOnly: false,
        containerPath: v,
        type: 'auto'
      };
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
}
