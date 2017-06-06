angular.module('portainer.helpers')
.factory('ContainerHelper', [function ContainerHelperFactory() {
  'use strict';
  var helper = {};

  helper.commandStringToArray = function(command) {
    return splitargs(command);
  };

  helper.commandArrayToString = function(array) {
    return array.map(function(elem) {
      return '"' + elem + '"';
    }).join(' ');
  };

  return helper;
}]);
