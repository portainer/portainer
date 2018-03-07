function includeString(text, values) {
  return values.some(function(val){
    return text.indexOf(val) !== -1;
  });
}

function strToHash(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

function hashToHexColor(hash) {
  var color = '#';
  for (var i = 0; i < 3;) {
    color += ('00' + ((hash >> i++ * 8) & 0xFF).toString(16)).slice(-2);
  }
  return color;
}

angular.module('portainer.docker')
.filter('visualizerTask', function () {
  'use strict';
  return function (text) {
    var status = _.toLower(text);
    if (includeString(status, ['new', 'allocated', 'assigned', 'accepted', 'complete', 'preparing'])) {
      return 'info';
    } else if (includeString(status, ['pending'])) {
      return 'warning';
    } else if (includeString(status, ['shutdown', 'failed', 'rejected'])) {
      return 'stopped';
    }
    return 'running';
  };
})
.filter('visualizerTaskBorderColor', function () {
  'use strict';
  return function (str) {
    var hash = strToHash(str);
    var color = hashToHexColor(hash);
    return color;
  };
})
.filter('taskstatusbadge', function () {
  'use strict';
  return function (text) {
    var status = _.toLower(text);
    var labelStyle = 'default';
    if (includeString(status, ['new', 'allocated', 'assigned', 'accepted', 'preparing', 'ready', 'starting', 'remove'])) {
      labelStyle = 'info';
    } else if (includeString(status, ['pending'])) {
      labelStyle = 'warning';
    } else if (includeString(status, ['shutdown', 'failed', 'rejected', 'orphaned'])) {
      labelStyle = 'danger';
    } else if (includeString(status, ['complete'])) {
      labelStyle = 'primary';
    } else if (includeString(status, ['running'])) {
      labelStyle = 'success';
    }
    return labelStyle;
  };
})
.filter('containerstatusbadge', function () {
  'use strict';
  return function (text) {
    var status = _.toLower(text);
    if (includeString(status, ['paused', 'starting', 'unhealthy'])) {
      return 'warning';
    } else if (includeString(status, ['created'])) {
      return 'info';
    } else if (includeString(status, ['stopped', 'dead', 'exited'])) {
      return 'danger';
    }
    return 'success';
  };
})
.filter('containerstatus', function () {
  'use strict';
  return function (text) {
    var status = _.toLower(text);
    if (includeString(status, ['paused'])) {
      return 'paused';
    } else if (includeString(status, ['dead'])) {
      return 'dead';
    } else if (includeString(status, ['created'])) {
      return 'created';
    } else if (includeString(status, ['exited'])) {
      return 'stopped';
    } else if (includeString(status, ['(healthy)'])) {
      return 'healthy';
    } else if (includeString(status, ['(unhealthy)'])) {
      return 'unhealthy';
    } else if (includeString(status, ['(health: starting)'])) {
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
.filter('getstatetext', function () {
  'use strict';
  return function (state) {
    if (state === undefined) {
      return '';
    }
    if (state.Dead) {
      return 'Dead';
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
.filter('command', function () {
  'use strict';
  return function (command) {
    if (command) {
      return command.join(' ');
    }
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
})
.filter('imagelayercommand', function () {
  'use strict';
  return function (createdBy) {
	  return createdBy.replace('/bin/sh -c #(nop) ', '').replace('/bin/sh -c ', 'RUN ');
  };
})
.filter('trimshasum', function () {
  'use strict';
  return function (imageName) {
    if (imageName.indexOf('sha256:') === 0) {
      return imageName.substring(7, 19);
    }
    return _.split(imageName, '@sha256')[0];
  };
});
