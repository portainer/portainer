import _ from 'lodash';
import { UserAccessViewModel } from '../../models/access';
import { TeamAccessViewModel } from '../../models/access';

angular.module('portainer.app')
.factory('AccessService', ['$q', 'UserService', 'TeamService', function AccessServiceFactory($q, UserService, TeamService) {
  'use strict';
  var service = {};

  function mapAccessData(accesses, authorizedIDs, inheritedIDs) {
    var availableAccesses = [];
    var authorizedAccesses = [];

    for (var i = 0; i < accesses.length; i++) {

      var access = accesses[i];
      if (_.includes(inheritedIDs, access.Id)) {
        access.Inherited = true;
        authorizedAccesses.push(access);
      } else if (_.includes(authorizedIDs, access.Id)) {
        authorizedAccesses.push(access);
      } else {
        availableAccesses.push(access);
      }
    }

    return {
      accesses: availableAccesses,
      authorizedAccesses: authorizedAccesses
    };
  }

  service.accesses = function(authorizedUserIDs, authorizedTeamIDs, inheritedUserIDs, inheritedTeamIDs) {
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

      var userAccessData = mapAccessData(userAccesses, authorizedUserIDs, inheritedUserIDs);
      var teamAccessData = mapAccessData(teamAccesses, authorizedTeamIDs, inheritedTeamIDs);

      var accessData = {
        accesses: userAccessData.accesses.concat(teamAccessData.accesses),
        authorizedAccesses: userAccessData.authorizedAccesses.concat(teamAccessData.authorizedAccesses)
      };

      deferred.resolve(accessData);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve users and teams', err: err });
    });

    return deferred.promise;
  };

  return service;
}]);
