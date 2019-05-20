import _ from 'lodash-es';
import { UserAccessViewModel } from '../../models/access';
import { TeamAccessViewModel } from '../../models/access';

angular.module('portainer.app')
.factory('AccessService', ['$q', 'UserService', 'TeamService', function AccessServiceFactory($q, UserService, TeamService) {
  'use strict';
  var service = {};

  function mapAccessData(accesses, authorizedPolicies, inheritedPolicies, roles) {
    var availableAccesses = [];
    var authorizedAccesses = [];

    for (var i = 0; i < accesses.length; i++) {
      const access = accesses[i];

      const authorized = authorizedPolicies && authorizedPolicies[access.Id];
      const inherited = inheritedPolicies && inheritedPolicies[access.Id];
      if (authorized) {
        let access = _.clone(accesses[i]);
        if (roles.length) {
          const role = _.find(roles, (role) => role.Id === authorizedPolicies[access.Id].RoleId);
          access.Role = role ? role : { Id: 0, Name: "-" };
        }
        authorizedAccesses.push(access);
      }
      if (inherited) {
        let access = _.clone(accesses[i]);
        if (roles.length) {
          const role = _.find(roles, (role) => role.Id === inheritedPolicies[access.Id].RoleId);
          access.Role = role ? role : { Id: 0, Name: "-" };
        }
        access.Inherited = true;
        authorizedAccesses.push(access);
      }
      if (!authorized && !inherited) {
        let access = _.clone(accesses[i]);
        availableAccesses.push(access);
      }
    }

    return {
      available: availableAccesses,
      authorized: authorizedAccesses
    };
  }

  service.accesses = function(authorizedUserPolicies, authorizedTeamPolicies, inheritedUserPolicies, inheritedTeamPolicies, roles) {
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

      var userAccessData = mapAccessData(userAccesses, authorizedUserPolicies, inheritedUserPolicies, roles);
      var teamAccessData = mapAccessData(teamAccesses, authorizedTeamPolicies, inheritedTeamPolicies, roles);

      var accessData = {
        availableUsersAndTeams: userAccessData.available.concat(teamAccessData.available),
        authorizedUsersAndTeams: userAccessData.authorized.concat(teamAccessData.authorized)
      };

      deferred.resolve(accessData);
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve users and teams', err: err });
    });

    return deferred.promise;
  };


  service.generateAccessPolicies = function(userAccessPolicies, teamAccessPolicies, selectedUserAccesses, selectedTeamAccesses, selectedRole) {

    _.forEach(selectedUserAccesses, (access) => userAccessPolicies[access.Id] = {RoleId: selectedRole});
    _.forEach(selectedTeamAccesses, (access) => teamAccessPolicies[access.Id] = {RoleId: selectedRole});

    const accessPolicies = {
      userAccessPolicies: userAccessPolicies,
      teamAccessPolicies: teamAccessPolicies
    };

    return accessPolicies;
  }

  return service;
}]);
