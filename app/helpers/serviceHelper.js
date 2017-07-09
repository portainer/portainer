angular.module('portainer.helpers').factory('ServiceHelper', [function ServiceHelperFactory() {
  'use strict';
    return {
        serviceToConfig: function (service) {
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
        translateKeyValueToPlacementConstraints: function (keyValueConstraints) {
            if (keyValueConstraints) {
                var constraints = [];
                keyValueConstraints.forEach(function (keyValueConstraint) {
                    if (keyValueConstraint.key && keyValueConstraint.key !== '' && keyValueConstraint.value && keyValueConstraint.value !== '') {
                        constraints.push(keyValueConstraint.key + keyValueConstraint.operator + keyValueConstraint.value);
                    }
                });
                return constraints;
            }
            return [];
        },
        translateEnvironmentVariables: function (env) {
            if (env) {
                var variables = [];
                env.forEach(function (variable) {
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
        },
        translateEnvironmentVariablesToEnv: function (env) {
            if (env) {
                var variables = [];
                env.forEach(function (variable) {
                    if (variable.key && variable.key !== '') {
                        variables.push(variable.key + '=' + variable.value);
                    }
                });
                return variables;
            }
            return [];
        },
        translateConstraintsToKeyValue: function (constraints) {
            function getOperator(constraint) {
                var indexEquals = constraint.indexOf('==');
                if (indexEquals >= 0) {
                    return [indexEquals, '=='];
                }
                return [constraint.indexOf('!='), '!='];
            }
            if (constraints) {
                var keyValueConstraints = [];
                constraints.forEach(function (constraint) {
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
            return [];
        }

    };
}]);
