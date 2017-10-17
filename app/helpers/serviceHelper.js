angular.module('portainer.helpers').factory('ServiceHelper', [function ServiceHelperFactory() {
  'use strict';

  var helper = {};

  helper.associateTasksToService = function(service, tasks) {
    service.Tasks = [];
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

  helper.translateKeyValueToPlacementPreferences = function(keyValuePreferences) {
    if (keyValuePreferences) {
      var preferences = [];
      keyValuePreferences.forEach(function(preference) {
        if (preference.strategy && preference.strategy !== '' && preference.value && preference.value !== '') {
          switch (preference.strategy.toLowerCase()) {
            case 'spread':
              preferences.push({
                'Spread': {
                  'SpreadDescriptor': preference.value
                }
              });
              break;
          }
        }
      });
      return preferences;
    }
    return [];
  };

  helper.translateKeyValueToPlacementConstraints = function(keyValueConstraints) {
    if (keyValueConstraints) {
      var constraints = [];
      keyValueConstraints.forEach(function(constraint) {
        if (constraint.key && constraint.key !== '' && constraint.value && constraint.value !== '') {
          constraints.push(constraint.key + constraint.operator + constraint.value);
        }
      });
      return constraints;
    }
    return [];
  };

  helper.translateEnvironmentVariables = function(env) {
    if (env) {
      var variables = [];
      env.forEach(function(variable) {
        var idx = variable.indexOf('=');
        var keyValue = [variable.slice(0, idx), variable.slice(idx + 1)];
        var originalValue = (keyValue.length > 1) ? keyValue[1] : '';
        variables.push({
          key: keyValue[0],
          value: originalValue,
          originalKey: keyValue[0],
          originalValue: originalValue,
          added: true
        });
      });
      return variables;
    }
    return [];
  };

  helper.translateEnvironmentVariablesToEnv = function(env) {
    if (env) {
      var variables = [];
      env.forEach(function(variable) {
        if (variable.key && variable.key !== '') {
          variables.push(variable.key + '=' + variable.value);
        }
      });
      return variables;
    }
    return [];
  };

  helper.translatePreferencesToKeyValue = function(preferences) {
    if (preferences) {
      var keyValuePreferences = [];
      preferences.forEach(function(preference) {
        if (preference.Spread) {
          keyValuePreferences.push({
            strategy: 'Spread',
            value: preference.Spread.SpreadDescriptor
          });
        }
      });
      return keyValuePreferences;
    }
    return [];
  };

  helper.translateConstraintsToKeyValue = function(constraints) {
    function getOperator(constraint) {
      var indexEquals = constraint.indexOf('==');
      if (indexEquals >= 0) {
        return [indexEquals, '=='];
      }
      return [constraint.indexOf('!='), '!='];
    }
    if (constraints) {
      var keyValueConstraints = [];
      constraints.forEach(function(constraint) {
        var operatorIndices = getOperator(constraint);

        var key = constraint.slice(0, operatorIndices[0]);
        var operator = operatorIndices[1];
        var value = constraint.slice(operatorIndices[0] + 2);

        keyValueConstraints.push({
          key: key,
          value: value,
          operator: operator,
          originalKey: key,
          originalValue: value
        });
      });
      return keyValueConstraints;
    }
  };

  return helper;
}]);
