function ImageViewModel(data) {
  this.Id = data.Id;
  this.Tag = data.Tag;
  this.Repository = data.Repository;
  this.Created = data.Created;
  this.Checked = false;
  this.RepoTags = data.RepoTags;
  this.VirtualSize = data.VirtualSize;
}

function TaskViewModel(data, node_data) {
  this.Id = data.ID;
  this.Created = data.CreatedAt;
  this.Updated = data.UpdatedAt;
  this.Slot = data.Slot;
  this.Status = data.Status.State;
  if (node_data) {
    for (var i = 0; i < node_data.length; ++i) {
      if (data.NodeID === node_data[i].ID) {
        this.Node = node_data[i].Description.Hostname;
      }
    }
  }
}

function ServiceViewModel(data) {
  this.Model = data;
  this.Id = data.ID;
  this.Name = data.Spec.Name;
  this.Image = data.Spec.TaskTemplate.ContainerSpec.Image;
  this.Version = data.Version.Index;
  if (data.Spec.Mode.Replicated) {
    this.Mode = 'replicated' ;
    this.Replicas = data.Spec.Mode.Replicated.Replicas;
  } else {
    this.Mode = 'global';
  }
  this.Labels = data.Spec.Labels;
  if (data.Spec.TaskTemplate.ContainerSpec) {
    this.ContainerLabels = data.Spec.TaskTemplate.ContainerSpec.Labels;
  }
  if (data.Spec.TaskTemplate.ContainerSpec.Env) {
    this.Env = data.Spec.TaskTemplate.ContainerSpec.Env;
  }
  if (data.Endpoint.Ports) {
    this.Ports = data.Endpoint.Ports;
  }
  this.Checked = false;
  this.Scale = false;
  this.EditName = false;
}

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
}

function createEventDetails(event) {
  var eventAttr = event.Actor.Attributes;
  var details = '';
  switch (event.Type) {
    case 'container':
    switch (event.Action) {
      case 'stop':
      details = 'Container ' + eventAttr.name + ' stopped';
      break;
      case 'destroy':
      details = 'Container ' + eventAttr.name + ' deleted';
      break;
      case 'create':
      details = 'Container ' + eventAttr.name + ' created';
      break;
      case 'start':
      details = 'Container ' + eventAttr.name + ' started';
      break;
      case 'kill':
      details = 'Container ' + eventAttr.name + ' killed';
      break;
      case 'die':
      details = 'Container ' + eventAttr.name + ' exited with status code ' + eventAttr.exitCode;
      break;
      case 'commit':
      details = 'Container ' + eventAttr.name + ' committed';
      break;
      case 'restart':
      details = 'Container ' + eventAttr.name + ' restarted';
      break;
      case 'pause':
      details = 'Container ' + eventAttr.name + ' paused';
      break;
      case 'unpause':
      details = 'Container ' + eventAttr.name + ' unpaused';
      break;
      case 'attach':
      details = 'Container ' + eventAttr.name + ' attached';
      break;
      default:
      if (event.Action.indexOf('exec_create') === 0) {
        details = 'Exec instance created';
      } else if (event.Action.indexOf('exec_start') === 0) {
        details = 'Exec instance started';
      } else {
        details = 'Unsupported event';
      }
    }
    break;
    case 'image':
    switch (event.Action) {
      case 'delete':
      details = 'Image deleted';
      break;
      case 'tag':
      details = 'New tag created for ' + eventAttr.name;
      break;
      case 'untag':
      details = 'Image untagged';
      break;
      case 'pull':
      details = 'Image ' + event.Actor.ID + ' pulled';
      break;
      default:
      details = 'Unsupported event';
    }
    break;
    case 'network':
    switch (event.Action) {
      case 'create':
      details = 'Network ' + eventAttr.name + ' created';
      break;
      case 'destroy':
      details = 'Network ' + eventAttr.name + ' deleted';
      break;
      case 'connect':
      details = 'Container connected to ' + eventAttr.name + ' network';
      break;
      case 'disconnect':
      details = 'Container disconnected from ' + eventAttr.name + ' network';
      break;
      default:
      details = 'Unsupported event';
    }
    break;
    case 'volume':
    switch (event.Action) {
      case 'create':
      details = 'Volume ' + event.Actor.ID + ' created';
      break;
      case 'destroy':
      details = 'Volume ' + event.Actor.ID + ' deleted';
      break;
      case 'mount':
      details = 'Volume ' + event.Actor.ID + ' mounted';
      break;
      case 'unmount':
      details = 'Volume ' + event.Actor.ID + ' unmounted';
      break;
      default:
      details = 'Unsupported event';
    }
    break;
    default:
    details = 'Unsupported event';
  }
  return details;
}

function EventViewModel(data) {
  // Type, Action, Actor unavailable in Docker < 1.10
  this.Time = data.time;
  if (data.Type) {
    this.Type = data.Type;
    this.Details = createEventDetails(data);
  } else {
    this.Type = data.status;
    this.Details = data.from;
  }
}
