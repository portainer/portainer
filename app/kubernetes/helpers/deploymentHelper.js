import _ from 'lodash-es';

angular.module('portainer.kubernetes')
.factory('KubernetesDeploymentHelper', [function KubernetesDeploymentHelperFactory() {
  'use strict';

  var helper = {};

  helper.associateServicesToDeployments = function(services, deployments) {
    const associated = [];
    _.forEach(services, (s) => {
      if (s.Selector) {
        const idx = _.findIndex(deployments, {Labels: s.Selector});
        if (idx !== -1) {
          deployments[idx].Service = s;
        }
        associated.push(s);
      }
    });
    _.remove(services, (s) => {
      const service = _.find(associated, (a) => s.Name === a.Name);
      return service ? true : false;
    });
  };

  return helper;
}]);
