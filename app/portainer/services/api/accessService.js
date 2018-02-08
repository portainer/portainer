angular.module('portainer.app')
.factory('AccessService', ['$q', 'UserService', 'TeamService', function AccessServiceFactory($q, UserService, TeamService) {
  'use strict';
  var service = {};

  function mapAccessDataFromAuthorizedIDs(userAccesses, teamAccesses, authorizedUserIDs, authorizedTeamIDs) {
    var accesses = [];
    var authorizedAccesses = [];

    angular.forEach(userAccesses, function(access) {
      if (_.includes(authorizedUserIDs, access.Id)) {
        authorizedAccesses.push(access);
      } else {
        accesses.push(access);
      }
    });

    angular.forEach(teamAccesses, function(access) {
      if (_.includes(authorizedTeamIDs, access.Id)) {
        authorizedAccesses.push(access);
      } else {
        accesses.push(access);
      }
    });

    return {
      accesses: accesses,
      authorizedAccesses: authorizedAccesses
    };
  }

  service.accesses = function(authorizedUserIDs, authorizedTeamIDs) {
    var deferred = $q.defer();

    $q.all({
      users: UserService.users(false),
      teams: TeamService.teams()
    })
    .then(function success(data) {
      var userAccesses = data.users.map(function (user) {
        return new UserAccessViewModel(user);
      });
      var teamAccesses = data.teams.map(function (team) {
        return new TeamAccessViewModel(team);
      });

      var accessData = mapAccessDataFromAuthorizedIDs(userAccesses, teamAccesses, authorizedUserIDs, authorizedTeamIDs);
      deferred.resolve(accessData);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve users and teams', err: err });
    });

    return deferred.promise;
  };

  return service;
}]);
