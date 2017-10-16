angular.module('portainer.filters').filter('contains', function() {
  return function (array, needle) {
    return array.indexOf(needle) >= 0;
  };
});
