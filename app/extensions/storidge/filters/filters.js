import _ from 'lodash-es';

function includeString(text, values) {
  return values.some(function(val){
    return text.indexOf(val) !== -1;
  });
}

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
    }
    return 'green-icon';
  };
})
.filter('clusterStatusBadge', function () {
'use strict';
  return function (text) {
    var status = _.toLower(text);
    if (status === 'alert') {
      return 'red-icon';
    }
    return 'green-icon';
  };
});