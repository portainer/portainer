angular.module('portainer.helpers')
.factory('ServiceHelper', [function ServiceHelperFactory() {
  'use strict';

  var helper = {};

  helper.associateTasksToService = function(service, tasks) {
    var otherServicesTasks = [];
    for (var i = 0; i < tasks.length; i++) {
      var task = tasks[i];
      if (task.ServiceId === service.Id) {
        service.Tasks.push(task);
      } else {
        otherServicesTasks.push(task);
      }
    }
    tasks = otherServicesTasks;
  };

  helper.serviceToConfig = function(service) {
    return {
      Name: service.Spec.Name,
      Labels: service.Spec.Labels,
      TaskTemplate: service.Spec.TaskTemplate,
      Mode: service.Spec.Mode,
      UpdateConfig: service.Spec.UpdateConfig,
      Networks: service.Spec.Networks,
      EndpointSpec: service.Spec.EndpointSpec
    };
  };

  helper.translateKeyValueToPlacementConstraints =  function(keyValueConstraints) {
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
  };

  return helper;

}]);
