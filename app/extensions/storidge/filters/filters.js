import _ from 'lodash-es';

angular.module('extension.storidge')
.filter('drivestatusbadge', function () {
'use strict';
  return function (text) {
    var status = text ? _.toLower(text) : '';
    if (status === 'available') {
      return 'info';
    } else if (status === 'faulty') {
      return 'danger';
    }
    return 'success';
  };
})
.filter('storidgeNodeStatusBadge', function () {
'use strict';
  return function (text) {
    var status = text ? _.toLower(text) : '';
    if (status === 'cordoned') {
      return 'orange-icon';
    } else if (status === 'leaving') {
      return 'red-icon'
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