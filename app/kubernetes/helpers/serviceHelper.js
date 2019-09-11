import _ from 'lodash-es';

angular.module('portainer.kubernetes')
.factory('KubernetesServiceHelper', [function KubernetesServiceHelperFactory() {
  'use strict';

  var helper = {};

  helper.associateServicesAndDeployments = function(services, deployments) {
    _.forEach(deployments, (deployment) => deployment.BoundServices = []);
    _.forEach(services, (service) => {
      if (service.spec.selector) {
        const deps = _.filter(deployments, {spec:{template:{metadata:{labels: service.spec.selector}}}});
        _.forEach(deps, (deployment) => deployment.BoundServices.push(service));
      }
    });
  }

  return helper;
}]);
