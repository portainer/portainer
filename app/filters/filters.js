function includeString(text, values) {
  return values.some(function(val){
    return text.indexOf(val) !== -1;
  });
}

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
    } else {
      return String(text).substring(0, length - end.length) + end;
    }
  };
})
.filter('truncatelr', function () {
  'use strict';
  return function (text, max, left, right) {
    max = isNaN(max) ? 50 : max;
    left = isNaN(left) ? 25 : left;
    right = isNaN(right) ? 25 : right;

    if (text.length <= max) {
      return text;
    } else {
      return text.substring(0, left) + '[...]' + text.substring(text.length - right, text.length);
    }
  };
})
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
.filter('taskstatusbadge', function () {
  'use strict';
  return function (text) {
    var status = _.toLower(text);
    if (includeString(status, ['new', 'allocated', 'assigned', 'accepted'])) {
      return 'info';
    } else if (includeString(status, ['pending'])) {
      return 'warning';
    } else if (includeString(status, ['shutdown', 'failed', 'rejected'])) {
      return 'danger';
    } else if (includeString(status, ['complete'])) {
      return 'primary';
    }
    return 'success';
  };
})
.filter('servicestatusbadge', function () {
  'use strict';
  return function (text) {
    var status = _.toLower(text);
    if (status.indexOf('partially running') !== -1 || status.indexOf('starting') !== -1) {
      return 'warning';
    } else if (status.indexOf('preparing') !== -1) {
      return 'info';
    } else if (status.indexOf('running') !== -1) {
      return 'success';
    } else if (status.indexOf('down') !== -1) {
      return 'danger';
    }
    return 'primary';
  };
})
.filter('containerstatusbadge', function () {
  'use strict';
  return function (text) {
    var status = _.toLower(text);
    if (includeString(status, ['paused', 'starting'])) {
      return 'warning';
    } else if (includeString(status, ['created'])) {
      return 'info';
    } else if (includeString(status, ['stopped', 'unhealthy', 'dead'])) {
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
});
