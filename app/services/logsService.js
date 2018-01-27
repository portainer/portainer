angular.module('portainer.services')
.factory('LogsService', ['$q', 'Container', 'Service', 'Task', function LogsServiceFactory($q, Container, Service, Task) {
  'use strict';

  var service = {
      container: {
          getStdOut: function(id, opts) {
              return getLogs(Container, getStdOutOpts(id, opts));
          },
          getStdErr: function(id, opts) {
              return getLogs(Container, getStdErrOpts(id, opts));
          }
      },
      service: {
          getStdOut: function(id, opts) {
              return getLogs(Service, getStdOutOpts(id, opts));
          },
          getStdErr: function(id, opts) {
              return getLogs(Service, getStdErrOpts(id, opts));
          }
      },
      task: {
          getStdOut: function(id, opts) {
              return getLogs(Task, getStdOutOpts(id, opts));
          },
          getStdErr: function(id, opts) {
              return getLogs(Task, getStdErrOpts(id, opts));
          }
      }
  };

  function getLogs(model, opts) {
    var deferred = $q.defer();

    model.logs(opts).$promise.then(function success(data) {
      deferred.resolve(parseLogResults(data.message || ''));
    }).catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve logs', err: err });
    });
    return deferred.promise;
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
         tail: opts.tail || 2000
     };
  }

  function getStdErrOpts(id, opts) {
     return {
         id: id,
         stdout: 0,
         stderr: 1,
         timestamps: opts.timestamps,
         tail: opts.tail || 2000
     };
  }

  return service;
}]);
