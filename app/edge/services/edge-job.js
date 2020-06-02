import angular from 'angular';

import { ScheduleCreateRequest, ScheduleUpdateRequest } from 'Portainer/models/schedule';

function EdgeJobService(EdgeJobs, EdgeJobTasks, FileUploadService) {
  var service = {};

  service.edgeJob = edgeJob;
  async function edgeJob(edgeJobId) {
    try {
      return await EdgeJobs.get({ id: edgeJobId }).$promise;
    } catch (err) {
      throw { msg: 'Unable to retrieve edgeJob', err: err };
    }
  }

  service.edgeJobs = edgeJobs;
  async function edgeJobs() {
    try {
      return await EdgeJobs.query().$promise;
    } catch (err) {
      throw { msg: 'Unable to retrieve edgeJobs', err: err };
    }
  }

  service.tasks = tasks;
  async function tasks(edgeJobId) {
    try {
      return await EdgeJobs.tasks({ id: edgeJobId }).$promise;
    } catch (err) {
      throw { msg: 'Unable to retrieve tasks associated to the edgeJob', err: err };
    }
  }

  service.logFile = logFile;
  function logFile(id, taskId) {
    return EdgeJobTasks.logFile({ id, taskId }).$promise;
  }

  service.collectLogs = collectLogs;
  function collectLogs(id, taskId) {
    return EdgeJobTasks.collectLogs({ id, taskId }).$promise;
  }

  service.clearLogs = clearLogs;
  function clearLogs(id, taskId) {
    return EdgeJobTasks.clearLogs({ id, taskId }).$promise;
  }

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

  service.remove = function (edgeJobId) {
    return EdgeJobs.remove({ id: edgeJobId }).$promise;
  };

  service.getScriptFile = function (edgeJobId) {
    return EdgeJobs.file({ id: edgeJobId }).$promise;
  };

  return service;
}

angular.module('portainer.edge').factory('EdgeJobService', EdgeJobService);
