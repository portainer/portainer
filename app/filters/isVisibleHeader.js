angular.module('portainer.filters').filter('isVisibleHeader', function() {
  return function (headers, property) {
    var visible = false;
    for (var i = 0; i < headers.length; i++) {
      var header = headers[i];
      if (header.property === property && (header.excludeFromSelector || header.show)) {
        return true;
      }
    }
    return visible;
  };
});
