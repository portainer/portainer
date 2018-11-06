angular.module('portainer.app')
.factory('ScheduleService', ['$q', 'Schedules',
function ScheduleService($q, Schedules) {
  'use strict';
  var service = {};

  service.schedule = function(scheduleId) {
    var deferred = $q.defer();

    Schedules.get({ id: scheduleId }).$promise
    .then(function success(data) {
      var schedule = new ScheduleModel(data);
      deferred.resolve(schedule);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve schedule', err: err });
    });

    return deferred.promise;
  };

  service.schedules = function() {
    var deferred = $q.defer();

    Schedules.query().$promise
    .then(function success(data) {
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

  service.createSchedule = function(model) {
    // var payload = new EndpointScheduleCreateRequest(model, endpoints);
    return Schedules.create({ method: 'string' }, model).$promise;
  };

  service.updateSchedule = function(model) {
    // var payload = new EndpointScheduleUpdateRequest(model, endpoints);
    // return Schedules.update(payload).$promise;
  };


  service.deleteSchedule = function(scheduleId) {
    return Schedules.remove({ id: scheduleId }).$promise;
  };

  return service;
}]);
