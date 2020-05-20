import angular from 'angular';

import { ScheduleCreateRequest, ScheduleUpdateRequest, ScriptExecutionTaskModel } from 'Portainer/models/schedule';

function EdgeJobService($q, EdgeJobs, FileUploadService) {
  var service = {};

  service.edgeJob = async function (edgeJobId) {
    try {
      return await EdgeJobs.get({ id: edgeJobId }).$promise;
    } catch (err) {
      throw { msg: 'Unable to retrieve edgeJob', err: err };
    }
  };

  service.edgeJobs = function () {
    var deferred = $q.defer();

    EdgeJobs.query()
      .$promise.then(function success(edgeJobs) {
        deferred.resolve(edgeJobs);
      })
      .catch(function error(err) {
        deferred.reject({ msg: 'Unable to retrieve edgeJobs', err: err });
      });

    return deferred.promise;
  };

  service.scriptExecutionTasks = function (edgeJobId) {
    var deferred = $q.defer();

    EdgeJobs.tasks({ id: edgeJobId })
      .$promise.then(function success(data) {
        var tasks = data.map(function (item) {
          return new ScriptExecutionTaskModel(item);
        });
        deferred.resolve(tasks);
      })
      .catch(function error(err) {
        deferred.reject({ msg: 'Unable to retrieve tasks associated to the edgeJob', err: err });
      });

    return deferred.promise;
  };

  service.createEdgeJobFromFileContent = function (model) {
    var payload = new ScheduleCreateRequest(model);
    return EdgeJobs.create({ method: 'string' }, payload).$promise;
  };

  service.createEdgeJobFromFileUpload = function (model) {
    var payload = new ScheduleCreateRequest(model);
    return FileUploadService.createSchedule(payload);
  };

  service.updateEdgeJob = function (model) {
    var payload = new ScheduleUpdateRequest(model);
    return EdgeJobs.update(payload).$promise;
  };

  service.deleteEdgeJob = function (edgeJobId) {
    return EdgeJobs.remove({ id: edgeJobId }).$promise;
  };

  service.getScriptFile = function (edgeJobId) {
    return EdgeJobs.file({ id: edgeJobId }).$promise;
  };

  return service;
}

angular.module('portainer.edge').factory('EdgeJobService', EdgeJobService);
