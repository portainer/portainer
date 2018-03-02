angular.module('portainer.docker')
.factory('TaskService', ['$q', 'Task', function TaskServiceFactory($q, Task) {
  'use strict';
  var service = {};

  service.task = function(id) {
    var deferred = $q.defer();

    Task.get({ id: id }).$promise
    .then(function success(data) {
      var task = new TaskViewModel(data);
      deferred.resolve(task);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve task details', err: err });
    });

    return deferred.promise;
  };

  service.tasks = function(filters) {
    var deferred = $q.defer();

    Task.query({ filters: filters ? filters : {} }).$promise
    .then(function success(data) {
      var tasks = data.map(function (item) {
        return new TaskViewModel(item);
      });
      deferred.resolve(tasks);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve tasks', err: err });
    });

    return deferred.promise;
  };

  service.logs = function(id, stdout, stderr, timestamps, tail) {
    var parameters = {
      id: id,
      stdout: stdout || 0,
      stderr: stderr || 0,
      timestamps: timestamps || 0,
      tail: tail || 'all'
    };

    return Task.logs(parameters).$promise;
  };

  return service;
}]);
