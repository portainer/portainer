function TemplateDefaultModel() {
  this.Type = 1;
  this.AdministratorOnly = false;
  this.Title = '';
  this.Image = '';
  this.Description = '';
  this.Volumes = [];
  this.Ports = [];
  this.Env = [];
  this.Labels = [];
  this.RestartPolicy = 'always';
  this.Registry = {};
}

function TemplateCreateRequest(model) {
  this.Type = model.Type;
  this.Name = model.Name;
  this.Hostname = model.Hostname;
  this.Title = model.Title;
  this.Description = model.Description;
  this.Note = model.Note;
  this.Categories = model.Categories;
  this.Platform = model.Platform;
  this.Logo = model.Logo;
  this.Image = model.Image;
  this.Registry = model.Registry.URL;
  this.Command = model.Command;
  this.Network = model.Network;
  this.Privileged = model.Privileged;
  this.Interactive = model.Interactive;
  this.RestartPolicy = model.RestartPolicy;
  this.Labels = model.Labels;
  this.Repository = model.Repository;
  this.Env = model.Env;
  this.AdministratorOnly = model.AdministratorOnly;

  this.Ports = [];
  for (var i = 0; i < model.Ports.length; i++) {
    var binding = model.Ports[i];
    if (binding.containerPort && binding.protocol) {
      this.Ports.push(binding.containerPort + '/' + binding.protocol);
    }
  }

  this.Volumes = model.Volumes;
}

function TemplateUpdateRequest(model) {
  TemplateCreateRequest.call(this, model);
  this.id = model.Id;
}

function TemplateViewModel(data) {
  this.Id = data.Id;
  this.Title = data.title;
  this.Type = data.type;
  this.Description = data.description;
  this.AdministratorOnly = data.AdministratorOnly;
  this.Name = data.name;
  this.Env = data.env ? data.env : [];
  this.Note = data.note;
  this.Categories = data.categories ? data.categories : [];
  this.Platform = data.platform ? data.platform : '';
  this.Logo = data.logo;

  this.Repository = data.repository;
  this.Hostname = data.hostname;
  this.Registry = data.registry ? { URL: data.registry } : {};
  this.Image = data.image;
  this.Registry = data.registry ? data.registry : '';
  this.Command = data.command ? data.command : '';
  this.Network = data.network ? data.network : '';
  this.Privileged = data.privileged ? data.privileged : false;
  this.Interactive = data.interactive ? data.interactive : false;
  this.RestartPolicy = data.restart_policy ? data.restart_policy : 'always';
  this.Labels = data.labels ? data.labels : [];
  this.Volumes = [];
  if (data.volumes) {
    this.Volumes = data.volumes.map(function (v) {
      return {
        container: v.container,
        readonly: v.readonly || false,
        type: v.bind ? 'bind' : 'auto',
        bind : v.bind ? v.bind : null
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
  this.Hosts = data.hosts ? data.hosts : [];
}
