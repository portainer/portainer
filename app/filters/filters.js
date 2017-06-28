angular.module('portainer.filters', [])
.filter('truncate', function () {
  'use strict';
  return function (text, length, end) {
    if (isNaN(length)) {
      length = 10;
    }

    if (end === undefined) {
      end = '...';
    }

    if (text.length <= length || text.length - end.length <= length) {
      return text;
    }
    else {
      return String(text).substring(0, length - end.length) + end;
    }
  };
})
.filter('taskstatusbadge', function () {
  'use strict';
  return function (text) {
    var status = _.toLower(text);
    if (status.indexOf('new') !== -1 || status.indexOf('allocated') !== -1 ||
      status.indexOf('assigned') !== -1 || status.indexOf('accepted') !== -1) {
      return 'info';
    } else if (status.indexOf('pending') !== -1) {
      return 'warning';
    } else if (status.indexOf('shutdown') !== -1 || status.indexOf('failed') !== -1 ||
      status.indexOf('rejected') !== -1) {
      return 'danger';
    } else if (status.indexOf('complete') !== -1) {
      return 'primary';
    }
    return 'success';
  };
})
.filter('stackstatusbadge', function () {
  'use strict';
  return function (text) {
    var status = _.toLower(text);
    if (status.indexOf('down') !== -1) {
      return 'danger';
    }
    return 'success';
  };
})
.filter('containerstatusbadge', function () {
  'use strict';
  return function (text) {
    var status = _.toLower(text);
    if (status.indexOf('paused') !== -1 || status.indexOf('starting') !== -1) {
      return 'warning';
    } else if (status.indexOf('created') !== -1) {
      return 'info';
    } else if (status.indexOf('exited') !== -1 || status.indexOf('unhealthy') !== -1) {
      return 'danger';
    }
    return 'success';
  };
})
.filter('containerstatus', function () {
  'use strict';
  return function (text) {
    var status = _.toLower(text);
    if (status.indexOf('paused') !== -1) {
      return 'paused';
    } else if (status.indexOf('created') !== -1) {
      return 'created';
    } else if (status.indexOf('exited') !== -1) {
      return 'stopped';
    } else if (status.indexOf('(healthy)') !== -1) {
      return 'healthy';
    } else if (status.indexOf('(unhealthy)') !== -1) {
      return 'unhealthy';
    } else if (status.indexOf('(health: starting)') !== -1) {
      return 'starting';
    }
    return 'running';
  };
})
.filter('nodestatusbadge', function () {
  'use strict';
  return function (text) {
    if (text === 'down' || text === 'Unhealthy') {
      return 'danger';
    }
    return 'success';
  };
})
.filter('trimcontainername', function () {
  'use strict';
  return function (name) {
    if (name) {
      return (name.indexOf('/') === 0 ? name.replace('/','') : name);
    }
    return '';
  };
})
.filter('capitalize', function () {
  'use strict';
  return function (text) {
    return _.capitalize(text);
  };
})
.filter('getstatetext', function () {
  'use strict';
  return function (state) {
    if (state === undefined) {
      return '';
    }
    if (state.Ghost && state.Running) {
      return 'Ghost';
    }
    if (state.Running && state.Paused) {
      return 'Running (Paused)';
    }
    if (state.Running) {
      return 'Running';
    }
    if (state.Status === 'created') {
      return 'Created';
    }
    return 'Stopped';
  };
})
.filter('stripprotocol', function() {
  'use strict';
  return function (url) {
    return url.replace(/.*?:\/\//g, '');
  };
})
.filter('getstatelabel', function () {
  'use strict';
  return function (state) {
    if (state === undefined) {
      return 'label-default';
    }
    if (state.Ghost && state.Running) {
      return 'label-important';
    }
    if (state.Running) {
      return 'label-success';
    }
    return 'label-default';
  };
})
.filter('humansize', function () {
  'use strict';
  return function (bytes, round) {
    if (!round) {
      round = 1;
    }
    if (bytes || bytes === 0) {
      return filesize(bytes, {base: 10, round: round});
    }
  };
})
.filter('containername', function () {
  'use strict';
  return function (container) {
    var name = container.Names[0];
    return name.substring(1, name.length);
  };
})
.filter('swarmcontainername', function () {
  'use strict';
  return function (container) {
    return _.split(container.Names[0], '/')[2];
  };
})
.filter('swarmversion', function () {
  'use strict';
  return function (text) {
    return _.split(text, '/')[1];
  };
})
.filter('swarmhostname', function () {
  'use strict';
  return function (container) {
    return _.split(container.Names[0], '/')[1];
  };
})
.filter('repotags', function () {
  'use strict';
  return function (image) {
    if (image.RepoTags && image.RepoTags.length > 0) {
      var tag = image.RepoTags[0];
      if (tag === '<none>:<none>') {
        return [];
      }
      return image.RepoTags;
    }
    return [];
  };
})
.filter('getisodatefromtimestamp', function () {
  'use strict';
  return function (timestamp) {
    return moment.unix(timestamp).format('YYYY-MM-DD HH:mm:ss');
  };
})
.filter('getisodate', function () {
  'use strict';
  return function (date) {
    return moment(date).format('YYYY-MM-DD HH:mm:ss');
  };
})
.filter('command', function () {
  'use strict';
  return function (command) {
    if (command) {
      return command.join(' ');
    }
  };
})
.filter('key', function () {
  'use strict';
  return function (pair, separator) {
    return pair.slice(0, pair.indexOf(separator));
  };
})
.filter('value', function () {
  'use strict';
  return function (pair, separator) {
    return pair.slice(pair.indexOf(separator) + 1);
  };
})
.filter('emptyobject', function () {
  'use strict';
  return function (obj) {
    return _.isEmpty(obj);
  };
})
.filter('ipaddress', function () {
  'use strict';
  return function (ip) {
    return ip.slice(0, ip.indexOf('/'));
  };
})
.filter('arraytostr', function () {
  'use strict';
  return function (arr, separator) {
    if (arr) {
      return _.join(arr, separator);
    }
    return '';
  };
})
.filter('hideshasum', function () {
  'use strict';
  return function (imageName) {
    if (imageName) {
      return imageName.split('@sha')[0];
    }
    return '';
  };
})
.filter('ownershipicon', function () {
  'use strict';
  return function (ownership) {
    switch (ownership) {
      case 'private':
        return 'fa fa-eye-slash';
      case 'administrators':
        return 'fa fa-eye-slash';
      case 'restricted':
        return 'fa fa-users';
      default:
        return 'fa fa-eye';
    }
  };
})
.filter('availablenodecount', function () {
  'use strict';
  return function (nodes) {
    var availableNodes = 0;
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (node.Availability === 'active' && node.Status === 'ready') {
        availableNodes++;
      }
    }
    return availableNodes;
  };
})
.filter('runningtaskscount', function () {
  'use strict';
  return function (tasks) {
    var runningTasks = 0;
    for (var i = 0; i < tasks.length; i++) {
      var task = tasks[i];
      if (task.Status.State === 'running') {
        runningTasks++;
      }
    }
    return runningTasks;
  };
})
.filter('tasknodename', function () {
  'use strict';
  return function (nodeId, nodes) {
    var node = _.find(nodes, { Id: nodeId });
    if (node) {
      return node.Hostname;
    }
    return '';
  };
});
