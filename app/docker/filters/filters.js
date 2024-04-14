import _ from 'lodash-es';
import { hideShaSum, joinCommand, nodeStatusBadge, taskStatusBadge, trimContainerName, trimSHA, trimVersionTag } from './utils';

function includeString(text, values) {
  return values.some(function (val) {
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
  for (var i = 0; i < 3; ) {
    color += ('00' + ((hash >> (i++ * 8)) & 0xff).toString(16)).slice(-2);
  }
  return color;
}

angular
  .module('portainer.docker')
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
    return taskStatusBadge;
  })
  .filter('taskhaslogs', function () {
    'use strict';
    return function (state) {
      var validState = ['running', 'complete', 'failed', 'shutdown'];
      if (validState.indexOf(state) > -1) {
        return true;
      }
      return false;
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
  .filter('nodestatusbadge', () => nodeStatusBadge)
  .filter('trimcontainername', () => trimContainerName)
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
      return container.Names[0];
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
      return container.Names[0];
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
    return joinCommand;
  })
  .filter('hideshasum', () => hideShaSum)
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
      if (!createdBy) {
        return '';
      }
      return createdBy.replace('/bin/sh -c #(nop) ', '').replace('/bin/sh -c ', 'RUN ');
    };
  })
  .filter('trimshasum', function () {
    'use strict';
    return trimSHA;
  })
  .filter('trimversiontag', function () {
    'use strict';
    return trimVersionTag;
  })
  .filter('unique', function () {
    return _.uniqBy;
  });
