import angular from 'angular';

import { ScheduleCreateRequest, ScheduleUpdateRequest } from 'Portainer/models/schedule';

function EdgeJobService($q, EdgeJobs, FileUploadService) {
  var service = {};

  service.edgeJob = async function (edgeJobId) {
    try {
      return await EdgeJobs.get({ id: edgeJobId }).$promise;
    } catch (err) {
      throw { msg: 'Unable to retrieve edgeJob', err: err };
    }
  };

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
