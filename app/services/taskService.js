angular.module('portainer.services')
.factory('TaskService', ['$q', 'Task', function TaskServiceFactory($q, Task) {
  'use strict';
  var service = {};

  service.serviceTasks = function(serviceId) {

  };

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

  return service;
}]);
