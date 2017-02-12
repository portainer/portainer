function TemplateViewModel(data) {
  this.Title = data.title;
  this.Description = data.description;
  this.Logo = data.logo;
  this.Image = data.image;
  this.Registry = data.registry ? data.registry : '';
  this.Command = data.command ? data.command : '';
  this.Network = data.network ? data.network : '';
  this.Env = data.env ? data.env : [];
  this.Volumes = [];
  if (data.volumes) {
    this.Volumes = data.volumes.map(function (v) {
      return {
        readOnly: false,
        containerPath: v,
        type: 'managed'
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
