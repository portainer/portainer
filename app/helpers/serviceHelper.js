angular.module('portainer.helpers')
.factory('ServiceHelper', [function ServiceHelperFactory() {
  'use strict';
  return {
    serviceToConfig: function(service) {
      return {
        Name: service.Spec.Name,
        Labels: service.Spec.Labels,
        TaskTemplate: service.Spec.TaskTemplate,
        Mode: service.Spec.Mode,
        UpdateConfig: service.Spec.UpdateConfig,
        Networks: service.Spec.Networks,
        EndpointSpec: service.Spec.EndpointSpec
      };
    }
  };
}]);
