angular.module('portainer.services')
.factory('LogsService', ['$q', 'Container', 'Service', 'Task', function LogsServiceFactory($q, Container, Service, Task) {
  'use strict';

  var service = {};

  service.containerLogsStdErr = function(id, opts) {
      return service.containerLogs(getStdOutOpts(id, opts));
  };

  service.containerLogsStdOut = function(id, opts) {
      return service.containerLogs(getStdErrOpts(id, opts));
  };

  service.containerLogs = function(opts) {
      var deferred = $q.defer();

      getLogs(Container, opts)
      .then(function success(data) {
          deferred.resolve(data);
      })
      .catch(function error(err) {
        deferred.reject({ msg: 'Unable to retrieve task logs', err: err });
      });
      return deferred.promise;
  };

  service.serviceLogsStdErr = function(id, opts) {
      return service.serviceLogs(getStdOutOpts(id, opts));
  };

  service.serviceLogsStdOut = function(id, opts) {
      return service.serviceLogs(getStdErrOpts(id, opts));
  };

  service.serviceLogs = function(opts) {
      var deferred = $q.defer();

      getLogs(Service, opts)
      .then(function success(data) {
          deferred.resolve(data);
      })
      .catch(function error(err) {
        deferred.reject({ msg: 'Unable to retrieve service logs', err: err });
      });
      return deferred.promise;
  };

  service.taskLogsStdErr = function(id, opts) {
      return service.taskLogs(getStdOutOpts(id, opts));
  };

  service.taskLogsStdOut = function(id, opts) {
      return service.taskLogs(getStdErrOpts(id, opts));
  };

  service.taskLogs = function(opts) {
      var deferred = $q.defer();

      getLogs(Task, opts)
      .then(function success(data) {
          deferred.resolve(data);
      })
      .catch(function error(err) {
        deferred.reject({ msg: 'Unable to retrieve task logs', err: err });
      });
      return deferred.promise;
  };

  function getLogs(model, opts) {
      return model.logs(opts).$promise.then(function success(data) {
          return parseLogResults(data.message || '');
      });
  }

  function parseLogResults(data) {
    // Replace carriage returns with newlines to clean up output
    data = data.replace(/[\r]/g, '\n');
    // Strip 8 byte header from each line of output
    data = data.substring(8);
    data = data.replace(/\n(.{8})/g, '\n');
    return data;
  }

  function getStdOutOpts(id, opts) {
     return {
         id: id,
         stdout: 1,
         stderr: 0,
         timestamps: opts.timestamps,
         tail: opts.tail
     };
  }

  function getStdErrOpts(id, opts) {
     return {
         id: id,
         stdout: 0,
         stderr: 1,
         timestamps: opts.timestamps || false,
         tail: opts.tail || 2000
     };
  }

  return service;
}]);
