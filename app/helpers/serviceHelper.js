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
    },
    translateKeyValueToPlacementPreferences: function(keyValuePreferences) {
        if (keyValuePreferences) {
          var preferences = [];
          keyValuePreferences.forEach(function(preference) {
            if (preference.strategy && preference.strategy !== '' && preference.value && preference.value !== '') {
              constraints.push(preference.strategy + '=' + preference.value);
            }
          });
          return preferences;
        }
        return [];
    },
    translateKeyValueToPlacementConstraints: function(keyValueConstraints) {
      if (keyValueConstraints) {
        var constraints = [];
        keyValueConstraints.forEach(function(keyValueConstraint) {
          if (keyValueConstraint.key && keyValueConstraint.key !== '' && keyValueConstraint.value && keyValueConstraint.value !== '') {
            constraints.push(keyValueConstraint.key + keyValueConstraint.operator + keyValueConstraint.value);
          }
        });
        return constraints;
      }
      return [];
    }
  };
}]);
