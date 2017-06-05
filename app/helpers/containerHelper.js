angular.module('portainer.helpers')
.factory('ContainerHelper', [function ContainerHelperFactory() {
  'use strict';
  var helper = {};

  helper.commandStringToArray = function(command) {
    return splitargs(command);
  };

  return helper;
}]);
