angular.module('portainer.app')
.factory('RegistryHelper', [function RegistryHelperFactory() {
  'use strict';

  var helper = {};

  helper.getRegistryByURL = function(registries, url) {
    for (var i = 0; i < registries.length; i++) {
      if (registries[i].URL === url) {
        return registries[i];
      }
    }

    return null;
  };

  return helper;
}]);
