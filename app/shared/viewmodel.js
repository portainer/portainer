function ImageViewModel(data) {
  this.Id = data.Id;
  this.Tag = data.Tag;
  this.Repository = data.Repository;
  this.Created = data.Created;
  this.Checked = false;
  this.RepoTags = data.RepoTags;
  this.VirtualSize = data.VirtualSize;
}

function ContainerViewModel(data) {
  this.Id = data.Id;
  this.Status = data.Status;
  this.Names = data.Names;
  // Unavailable in Docker < 1.10
  if (data.NetworkSettings) {
    this.IP = data.NetworkSettings.Networks[Object.keys(data.NetworkSettings.Networks)[0]].IPAddress;
  }
  this.Image = data.Image;
  this.Command = data.Command;
  this.Checked = false;
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
      default:
      details = 'Unsupported event';
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
