angular.module('portainer.app')
.factory('StackHelper', [function StackHelperFactory() {
  'use strict';
  var helper = {};

  helper.getExternalStackNamesFromServices = function(services) {
    var stackNames = [];

    for (var i = 0; i < services.length; i++) {
      var service = services[i];
      if (!service.Labels || !service.Labels['com.docker.stack.namespace']) continue;

      var stackName = service.Labels['com.docker.stack.namespace'];
      stackNames.push(stackName);
    }

    return _.uniq(stackNames);
  };
  
  return helper;
}]);
