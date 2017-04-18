angular.module('portainer.services')
.factory('TeamService', ['$q', 'Teams', function TeamServiceFactory($q, Teams) {
  'use strict';
  var service = {};

  service.teams = function() {
    var deferred = $q.defer();
    var data = [{Id: 1, Name: 'dev-projectA'}, {Id: 2, Name: 'dev-projectB'}, {Id: 3, Name: 'qa-01'}, {Id: 4, Name: 'qa-02'}];
    var teams = data.map(function (item) {
      return new TeamViewModel(item);
    });
    deferred.resolve(teams);
    return deferred.promise;
  };

  service.team = function(id) {
    var deferred = $q.defer();
    var data = {Id: 1, Name: "groupA"};
    var team = new TeamViewModel(data);
    deferred.resolve(team);
    return deferred.promise;
  };

  service.deleteTeam = function(id) {
    var deferred = $q.defer();
    deferred.resolve();
    return deferred.promise;
  };

  return service;
}]);
