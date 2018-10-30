angular.module('portainer.app')
.factory('ScheduleService', ['$q',
function ScheduleService($q) {
  'use strict';
  var service = {};

  service.schedule = function(scheduleId) {
    return $q.when(new ScheduleDefaultMock());
  };

  service.schedules = function() {
    return $q.when([new ScheduleDefaultMock()]);
  };

  return service;
}]);
