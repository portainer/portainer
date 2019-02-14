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
});