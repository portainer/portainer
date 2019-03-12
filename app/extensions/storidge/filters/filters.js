angular.module('extension.storidge')
.filter('drivestatusbadge', function () {
'use strict';
  return function (text) {
    var status = _.toLower(text);
    if (includeString(status, ['normal'])) {
    return 'success';
    } else if (includeString(status, ['available'])) {
    return 'info';
    } else if (includeString(status, ['faulty'])) {
    return 'danger';
    }
    return 'info';
  };
})
.filter('nodeStatusBadge', function () {
'use strict';
  return function (text) {
    var status = _.toLower(text);
    if (status === 'maintenance') {
      return 'orange-icon';
    } else if (status === 'alert') {
      return 'red-icon';
    }
    return 'green-icon';
  };
});