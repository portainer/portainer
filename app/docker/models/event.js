function createEventDetails(event) {
  var eventAttr = event.Actor.Attributes;
  var details = '';

  var action = event.Action;
  var extra = '';
  var hasColon = action.indexOf(':');
  if (hasColon != -1) {
    extra = action.substring(hasColon);
    action = action.substring(0, hasColon);
  }

  switch (event.Type) {
    case 'container':
      switch (action) {
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
        case 'detach':
          details = 'Container ' + eventAttr.name + ' detached';
          break;
        case 'copy':
          details = 'Container ' + eventAttr.name + ' copied';
          break;
        case 'export':
          details = 'Container ' + eventAttr.name + ' exported';
          break;
        case 'health_status':
          details = 'Container ' + eventAttr.name + ' executed health status';
          break;
        case 'oom':
          details = 'Container ' + eventAttr.name + ' goes in out of memory';
          break;
        case 'rename':
          details = 'Container ' + eventAttr.name + ' renamed';
          break;
        case 'resize':
          details = 'Container ' + eventAttr.name + ' resized';
          break;
        case 'top':
          details = 'Showed running processes for container ' + eventAttr.name;
          break;
        case 'update':
          details = 'Container ' + eventAttr.name + ' updated';
          break;
        case 'exec_create':
          details = 'Exec instance created';
          break;
        case 'exec_start':
          details = 'Exec instance started';
          break;
        case 'exec_die':
          details = 'Exec instance exited';
          break;
        default:
          details = 'Unsupported event';
      }
      break;
    case 'image':
      switch (action) {
        case 'delete':
          details = 'Image deleted';
          break;
        case 'import':
          details = 'Image ' + event.Actor.ID + ' imported';
          break;
        case 'load':
          details = 'Image ' + event.Actor.ID + ' loaded';
          break;
        case 'tag':
          details = 'New tag created for ' + eventAttr.name;
          break;
        case 'untag':
          details = 'Image untagged';
          break;
        case 'save':
          details = 'Image ' + event.Actor.ID + ' saved';
          break;
        case 'pull':
          details = 'Image ' + event.Actor.ID + ' pulled';
          break;
        case 'push':
          details = 'Image ' + event.Actor.ID + ' pushed';
          break;
        default:
          details = 'Unsupported event';
      }
      break;
    case 'network':
      switch (action) {
        case 'create':
          details = 'Network ' + eventAttr.name + ' created';
          break;
        case 'destroy':
          details = 'Network ' + eventAttr.name + ' deleted';
          break;
        case 'remove':
          details = 'Network ' + eventAttr.name + ' removed';
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
      switch (action) {
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
  return details + extra;
}

export function EventViewModel(data) {
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
