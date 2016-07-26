angular.module('dockerui.filters', [])
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
.filter('containerstatusbadge', function () {
  'use strict';
  return function (text) {
    var status = _.toLower(text);
    if (status.indexOf('paused') !== -1) {
      return 'warning';
    } else if (status.indexOf('created') !== -1) {
      return 'info';
    } else if (status.indexOf('exited') !== -1) {
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
    }
    return 'running';
  };
})
.filter('nodestatusbadge', function () {
  'use strict';
  return function (text) {
    if (text === 'Unhealthy') {
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
.filter('humansize', function () {
  'use strict';
  return function (bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) {
      return 'n/a';
    }
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
    var value = bytes / Math.pow(1024, i);
    var decimalPlaces = (i < 1) ? 0 : (i - 1);
    return value.toFixed(decimalPlaces) + ' ' + sizes[[i]];
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
.filter('getdate', function () {
  'use strict';
  return function (data) {
    //Multiply by 1000 for the unix format
    var date = new Date(data * 1000);
    return date.toDateString();
  };
})
.filter('getdatefromtimestamp', function () {
  'use strict';
  return function (timestamp) {
    return moment.unix(timestamp).format('YYYY-MM-DD HH:mm:ss');
  };
})
.filter('errorMsg', function () {
  return function (object) {
    var idx = 0;
    var msg = '';
    while (object[idx] && typeof(object[idx]) === 'string') {
      msg += object[idx];
      idx++;
    }
    return msg;
  };
});
