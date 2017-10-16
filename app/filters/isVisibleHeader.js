angular.module('portainer.filters').filter('isVisibleHeader', function() {
  return function (headers, field) {
    var visible = false;
    for (var i = 0; i < headers.length; i++) {
      var header = headers[i];
      if (header.value === field && (header.excludeFromSelector || header.show)) {
        return true;
      }
    }
    return visible;
  };
});
