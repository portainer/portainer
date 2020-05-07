import { TaskViewModel } from '../models/task';

angular.module('portainer.docker').factory('TaskService', [
  '$q',
  'Task',
  'LogHelper',
  function TaskServiceFactory($q, Task, LogHelper) {
    'use strict';
    var service = {};

    service.task = function (id) {
      var deferred = $q.defer();

      Task.get({ id: id })
        .$promise.then(function success(data) {
          var task = new TaskViewModel(data);
          deferred.resolve(task);
        })
        .catch(function error(err) {
          deferred.reject({ msg: 'Unable to retrieve task details', err: err });
        });

      return deferred.promise;
    };

    service.tasks = function (filters) {
      var deferred = $q.defer();

      Task.query({ filters: filters ? filters : {} })
        .$promise.then(function success(data) {
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

    service.logs = function (id, stdout, stderr, timestamps, since, tail) {
      var deferred = $q.defer();

      var parameters = {
        id: id,
        stdout: stdout || 0,
        stderr: stderr || 0,
        timestamps: timestamps || 0,
        since: since || 0,
        tail: tail || 'all',
      };

      Task.logs(parameters)
        .$promise.then(function success(data) {
          var logs = LogHelper.formatLogs(data.logs, true);
          deferred.resolve(logs);
        })
        .catch(function error(err) {
          deferred.reject(err);
        });

      return deferred.promise;
    };

    return service;
  },
]);
