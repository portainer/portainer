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
    var status = text ? _.toLower(text) : '';
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
    var status = text ? _.toLower(text) : '';
    if (status === 'maintenance') {
      return 'orange-icon';
    }
    return 'green-icon';
  };
})
.filter('clusterStatusBadge', function () {
'use strict';
  return function (text) {
    var status = text ? _.toLower(text) : '';
    if (status === 'alert') {
      return 'red-icon';
    }
    return 'green-icon';
  };
}).filter('bytes', function() {
	return function(bytes, precision) {
    bytes = parseFloat(bytes);
		if (isNaN(bytes) || !isFinite(bytes)) return '-';
		if (!precision) precision = 1;
		var units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB'];
    var number = Math.floor(Math.log(bytes) / Math.log(1024));
    if (bytes === 0) {
      return ('0 B');
    }
		return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  ' ' + units[number];
	}
});