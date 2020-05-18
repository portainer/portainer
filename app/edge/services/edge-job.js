import angular from 'angular';

import { ScheduleModel, ScheduleCreateRequest, ScheduleUpdateRequest, ScriptExecutionTaskModel } from 'Portainer/models/schedule';

function EdgeJobService($q, EdgeJobs, FileUploadService) {
  var service = {};

  service.schedule = function (scheduleId) {
    var deferred = $q.defer();

    EdgeJobs.get({ id: scheduleId })
      .$promise.then(function success(data) {
        var schedule = new ScheduleModel(data);
        deferred.resolve(schedule);
      })
      .catch(function error(err) {
        deferred.reject({ msg: 'Unable to retrieve schedule', err: err });
      });

    return deferred.promise;
  };

  service.schedules = function () {
    var deferred = $q.defer();

    EdgeJobs.query()
      .$promise.then(function success(data) {
        var schedules = data.map(function (item) {
          return new ScheduleModel(item);
        });
        deferred.resolve(schedules);
      })
      .catch(function error(err) {
        deferred.reject({ msg: 'Unable to retrieve schedules', err: err });
      });

    return deferred.promise;
  };

  service.scriptExecutionTasks = function (scheduleId) {
    var deferred = $q.defer();

    EdgeJobs.tasks({ id: scheduleId })
      .$promise.then(function success(data) {
        var tasks = data.map(function (item) {
          return new ScriptExecutionTaskModel(item);
        });
        deferred.resolve(tasks);
      })
      .catch(function error(err) {
        deferred.reject({ msg: 'Unable to retrieve tasks associated to the schedule', err: err });
      });

    return deferred.promise;
  };

  service.createScheduleFromFileContent = function (model) {
    var payload = new ScheduleCreateRequest(model);
    return EdgeJobs.create({ method: 'string' }, payload).$promise;
  };

  service.createScheduleFromFileUpload = function (model) {
    var payload = new ScheduleCreateRequest(model);
    return FileUploadService.createSchedule(payload);
  };

  service.updateSchedule = function (model) {
    var payload = new ScheduleUpdateRequest(model);
    return EdgeJobs.update(payload).$promise;
  };

  service.deleteSchedule = function (scheduleId) {
    return EdgeJobs.remove({ id: scheduleId }).$promise;
  };

  service.getScriptFile = function (scheduleId) {
    return EdgeJobs.file({ id: scheduleId }).$promise;
  };

  return service;
}

angular.module('portainer.edge').factory('EdgeJobService', EdgeJobService);
