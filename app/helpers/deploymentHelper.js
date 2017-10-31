angular.module('portainer.helpers')
.factory('DeploymentHelper', [function DeploymentHelperFactory() {
  'use strict';

  var helper = {};

  helper.extractDeploymentFromOrca = function() {
    var name = 'Test711'

    return {
      name: name
    };
  };

  return helper;
}]);
