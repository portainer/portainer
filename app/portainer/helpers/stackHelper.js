import _ from 'lodash-es';

angular.module('portainer.app')
.factory('StackHelper', [function StackHelperFactory() {
  'use strict';
  var helper = {};

  helper.getExternalStackNamesFromContainers = function(containers) {
    var stackNames = [];

    for (var i = 0; i < containers.length; i++) {
      var container = containers[i];
      if (!container.Labels || !container.Labels['com.docker.compose.project']) continue;
      var stackName = container.Labels['com.docker.compose.project'];
      stackNames.push(stackName);
    }

    return _.uniq(stackNames);
  };

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
