import moment from 'moment';
import _ from 'lodash-es';

angular.module('portainer.docker').factory('ServiceHelper', [
  function ServiceHelperFactory() {
    'use strict';

    var helper = {
      associateTasksToService,
      serviceToConfig,
      translateKeyValueToPlacementPreferences,
      translateKeyValueToPlacementConstraints,
      translateEnvironmentVariables,
      translateEnvironmentVariablesToEnv,
      translatePreferencesToKeyValue,
      translateConstraintsToKeyValue,
      translateHumanDurationToNanos,
      translateNanosToHumanDuration,
      translateLogDriverOptsToKeyValue,
      translateKeyValueToLogDriverOpts,
      translateHostsEntriesToHostnameIP,
      translateHostnameIPToHostsEntries,
      computeHealthcheckStatus,
    };

    function associateTasksToService(service, tasks) {
      service.Tasks = [];
      var otherServicesTasks = [];
      for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i];
        if (task.ServiceId === service.Id) {
          service.Tasks.push(task);
          task.ServiceName = service.Name;
        } else {
          otherServicesTasks.push(task);
        }
      }
      tasks = otherServicesTasks;
    }

    function serviceToConfig(service) {
      return {
        Name: service.Spec.Name,
        Labels: service.Spec.Labels,
        TaskTemplate: service.Spec.TaskTemplate,
        Mode: service.Spec.Mode,
        UpdateConfig: service.Spec.UpdateConfig,
        Networks: service.Spec.Networks,
        EndpointSpec: service.Spec.EndpointSpec,
      };
    }

    function translateKeyValueToPlacementPreferences(keyValuePreferences) {
      if (keyValuePreferences) {
        var preferences = [];
        keyValuePreferences.forEach(function (preference) {
          if (preference.strategy && preference.strategy !== '' && preference.value && preference.value !== '') {
            switch (preference.strategy.toLowerCase()) {
              case 'spread':
                preferences.push({
                  Spread: {
                    SpreadDescriptor: preference.value,
                  },
                });
                break;
            }
          }
        });
        return preferences;
      }
      return [];
    }

    function translateKeyValueToPlacementConstraints(keyValueConstraints) {
      if (keyValueConstraints) {
        var constraints = [];
        keyValueConstraints.forEach(function (constraint) {
          if (constraint.key && constraint.key !== '' && constraint.value && constraint.value !== '') {
            constraints.push(constraint.key + constraint.operator + constraint.value);
          }
        });
        return constraints;
      }
      return [];
    }

    function translateEnvironmentVariables(env) {
      if (env) {
        var variables = [];
        env.forEach(function (variable) {
          var idx = variable.indexOf('=');
          var keyValue = [variable.slice(0, idx), variable.slice(idx + 1)];
          var originalValue = keyValue.length > 1 ? keyValue[1] : '';
          variables.push({
            key: keyValue[0],
            value: originalValue,
            originalKey: keyValue[0],
            originalValue: originalValue,
            added: true,
          });
        });
        return variables;
      }
      return [];
    }

    function translateEnvironmentVariablesToEnv(env) {
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
    }

    function translatePreferencesToKeyValue(preferences) {
      if (preferences) {
        var keyValuePreferences = [];
        preferences.forEach(function (preference) {
          if (preference.Spread) {
            keyValuePreferences.push({
              strategy: 'Spread',
              value: preference.Spread.SpreadDescriptor,
            });
          }
        });
        return keyValuePreferences;
      }
      return [];
    }

    function translateConstraintsToKeyValue(constraints) {
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
            originalValue: value,
          });
        });
        return keyValueConstraints;
      }
    }

    function translateHumanDurationToNanos(humanDuration) {
      var nanos;
      var regex = /^([0-9]+)(h|m|s|ms|us|ns)$/i;
      var matches = humanDuration.match(regex);

      if (matches !== null && matches.length === 3) {
        var duration = parseInt(matches[1], 10);
        var unit = matches[2];
        // Moment.js cannot use micro or nanoseconds
        switch (unit) {
          case 'ns':
            nanos = duration;
            break;
          case 'us':
            nanos = duration * 1000;
            break;
          default:
            nanos = moment.duration(duration, unit).asMilliseconds() * 1000000;
        }
      }
      return nanos;
    }

    // Convert nanoseconds to the higher unit possible
    // e.g 1840 nanoseconds = 1804ns
    // e.g 300000000000 nanoseconds = 5m
    // e.g 3510000000000 nanoseconds = 3510s
    // e.g 3540000000000 nanoseconds = 59m
    // e.g 3600000000000 nanoseconds = 1h

    function translateNanosToHumanDuration(nanos) {
      var humanDuration = '0s';
      var conversionFromNano = {};
      conversionFromNano['ns'] = 1;
      conversionFromNano['us'] = conversionFromNano['ns'] * 1000;
      conversionFromNano['ms'] = conversionFromNano['us'] * 1000;
      conversionFromNano['s'] = conversionFromNano['ms'] * 1000;
      conversionFromNano['m'] = conversionFromNano['s'] * 60;
      conversionFromNano['h'] = conversionFromNano['m'] * 60;

      Object.keys(conversionFromNano).forEach(function (unit) {
        if (nanos % conversionFromNano[unit] === 0 && nanos / conversionFromNano[unit] > 0) {
          humanDuration = nanos / conversionFromNano[unit] + unit;
        }
      });
      return humanDuration;
    }

    function translateLogDriverOptsToKeyValue(logOptions) {
      var options = [];
      if (logOptions) {
        Object.keys(logOptions).forEach(function (key) {
          options.push({
            key: key,
            value: logOptions[key],
            originalKey: key,
            originalValue: logOptions[key],
            added: true,
          });
        });
      }
      return options;
    }

    function translateKeyValueToLogDriverOpts(keyValueLogDriverOpts) {
      var options = {};
      if (keyValueLogDriverOpts) {
        keyValueLogDriverOpts.forEach(function (option) {
          if (option.key && option.key !== '' && option.value && option.value !== '') {
            options[option.key] = option.value;
          }
        });
      }
      return options;
    }

    function translateHostsEntriesToHostnameIP(entries) {
      var ipHostEntries = [];
      if (entries) {
        entries.forEach(function (entry) {
          if (entry.indexOf(' ') && entry.split(' ').length === 2) {
            var keyValue = entry.split(' ');
            ipHostEntries.push({ hostname: keyValue[1], ip: keyValue[0] });
          }
        });
      }
      return ipHostEntries;
    }

    function translateHostnameIPToHostsEntries(entries) {
      var ipHostEntries = [];
      if (entries) {
        entries.forEach(function (entry) {
          if (entry.ip && entry.hostname) {
            ipHostEntries.push(entry.ip + ' ' + entry.hostname);
          }
        });
      }
      return ipHostEntries;
    }

    function computeHealthcheckStatus(service) {
      var healthyTasks = 0;
      _.forEach(service.Tasks, (task) => {
        if (task.Container) {
          if (task.Container.Status === 'healthy') {
            healthyTasks += 1;
          }
          if (healthyTasks === service.Tasks.length) {
            service.HealthCheckStatus = 'healthy';
          } else {
            service.HealthCheckStatus = 'unhealthy';
          }
        }
      });
    }

    return helper;
  },
]);
