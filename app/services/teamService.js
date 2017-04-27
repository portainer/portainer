angular.module('portainer.services')
.factory('TeamService', ['$q', 'Teams', function TeamServiceFactory($q, Teams) {
  'use strict';
  var service = {};

  service.teams = function() {
    var deferred = $q.defer();
    Teams.query().$promise
    .then(function success(data) {
      var teams = data.map(function (item) {
        return new TeamViewModel(item);
      });
      deferred.resolve(teams);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve teams', err: err});
    });
    return deferred.promise;
  };

  service.teamsByUserID = function(userID) {
    var deferred = $q.defer();
    service.teams()
    .then(function success(data) {
      var userTeams = [];
      angular.forEach(data, function(team) {
        angular.forEach(team.Users, function(id) {
          if (id === userID) {
            userTeams.push(team);
          }
        });
      });
      deferred.resolve(userTeams);
    })
    .catch(function error(err) {
      deferred.reject({ msg: err.msg, err: err.err });
    });
    return deferred.promise;
  };

  service.team = function(id) {
    var deferred = $q.defer();
    Teams.get({id: id}).$promise
    .then(function success(data) {
      var team = new TeamViewModel(data);
      deferred.resolve(team);
    })
    .catch(function error(err) {
      deferred.reject({msg: 'Unable to retrieve team details', err: err});
    });
    return deferred.promise;
  };

  service.createTeam = function(name, leaders) {
    var payload = {
      Name: name,
      Leaders: leaders
    };
    return Teams.create({}, payload).$promise;
  };

  service.deleteTeam = function(id) {
    return Teams.remove({id: id}).$promise;
  };

  service.updateTeam = function(id, name, users) {
    var payload = {
      Name: name,
      Users: users
    };
    return Teams.update({id: id}, payload).$promise;
  };

  return service;
}]);
