import _ from 'lodash-es';

export function TemplateDefaultModel() {
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

export function TemplateCreateRequest(model) {
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
  this.Network = model.Network && model.Network.Name;
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
      var port = binding.hostPort ? binding.hostPort + ':' + binding.containerPort + '/' + binding.protocol: binding.containerPort + '/' + binding.protocol;
      this.Ports.push(port);
    }
  }

  this.Volumes = model.Volumes;
}

export function TemplateUpdateRequest(model) {
  TemplateCreateRequest.call(this, model);
  this.id = model.Id;
}

export function TemplateViewModel(data) {
  this.Id = data.Id;
  this.Title = data.title;
  this.Type = data.type;
  this.Description = data.description;
  this.AdministratorOnly = data.AdministratorOnly;
  this.Name = data.name;
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
  this.Hosts = data.hosts ? data.hosts : [];
  this.Env = templateEnv(data);
  this.Volumes = templateVolumes(data);
  this.Ports = templatePorts(data);
}

function templatePorts(data) {
  var ports = [];

  if (data.ports) {
    ports = data.ports.map(function (p) {
      var portAndProtocol = _.split(p, '/');
      var hostAndContainerPort = _.split(portAndProtocol[0], ':');

      return {
        hostPort: hostAndContainerPort.length > 1 ? hostAndContainerPort[0] : undefined,
        containerPort: hostAndContainerPort.length > 1 ? hostAndContainerPort[1] : hostAndContainerPort[0],
        protocol: portAndProtocol[1]
      };
    });
  }

  return ports;
}

function templateVolumes(data) {
  var volumes = [];

  if (data.volumes) {
    volumes = data.volumes.map(function (v) {
      return {
        container: v.container,
        readonly: v.readonly || false,
        type: v.bind ? 'bind' : 'auto',
        bind : v.bind ? v.bind : null
      };
    });
  }

  return volumes;
}

function templateEnv(data) {
  var env = [];

  if (data.env) {
    env = data.env.map(function(envvar) {
      envvar.type = 2;
      envvar.value = envvar.default ? envvar.default : '';

      if (envvar.preset) {
        envvar.type = 1;
      }

      if (envvar.select) {
        envvar.type = 3;
        for (var i = 0; i < envvar.select.length; i++) {
          var allowedValue = envvar.select[i];
          if (allowedValue.default) {
            envvar.value = allowedValue.value;
            break;
          }
        }
      }
      return envvar;
    });
  }

  return env;
}
