function TemplateViewModel(data) {
  this.Title = data.title;
  this.Description = data.description;
  this.Logo = data.logo;
  this.Image = data.image;
  this.Registry = data.registry ? data.registry : '';
  this.Network = data.network ? data.network : '';
  this.Env = data.env ? data.env : [];
  this.Volumes = data.volumes ? data.volumes : [];
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
