import _ from 'lodash-es';
import { UserAccessViewModel } from '../../models/access';
import { TeamAccessViewModel } from '../../models/access';

angular.module('portainer.app')
.factory('AccessService', ['$q', 'UserService', 'TeamService', function AccessServiceFactory($q, UserService, TeamService) {
  'use strict';
  var service = {};

  function _getRole(roles, roleId) {
    if (roles.length) {
      const role = _.find(roles, (role) => role.Id === roleId);
      return role ? role : { Id: 0, Name: "-" };
    }
  }

  function _mapAccessData(accesses, authorizedPolicies, inheritedPolicies, roles) {
    var availableAccesses = [];
    var authorizedAccesses = [];

    for (var i = 0; i < accesses.length; i++) {
      const access = accesses[i];

      const authorized = authorizedPolicies && authorizedPolicies[access.Id];
      const inherited = inheritedPolicies && inheritedPolicies[access.Id];

      if (authorized && inherited) {
        access.Role = _getRole(roles, authorizedPolicies[access.Id].RoleId);
        access.Override = true;
        authorizedAccesses.push(access);
      } else if (authorized && !inherited) {
        access.Role = _getRole(roles, authorizedPolicies[access.Id].RoleId);
        authorizedAccesses.push(access);
      } else if (!authorized && inherited) {
        access.Role = _getRole(roles, inheritedPolicies[access.Id].RoleId);
        access.Inherited = true;
        authorizedAccesses.push(access);
        availableAccesses.push(access);
      } else {
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

      var userAccessData = _mapAccessData(userAccesses, authorizedUserPolicies, inheritedUserPolicies, roles);
      var teamAccessData = _mapAccessData(teamAccesses, authorizedTeamPolicies, inheritedTeamPolicies, roles);

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


  service.generateAccessPolicies = function(userAccessPolicies, teamAccessPolicies, selectedUserAccesses, selectedTeamAccesses, selectedRoleId) {

    const newUserPolicies = _.clone(userAccessPolicies);
    const newTeamPolicies = _.clone(teamAccessPolicies);

    _.forEach(selectedUserAccesses, (access) => newUserPolicies[access.Id] = {RoleId: selectedRoleId ? selectedRoleId : access.Role.Id});
    _.forEach(selectedTeamAccesses, (access) => newTeamPolicies[access.Id] = {RoleId: selectedRoleId ? selectedRoleId : access.Role.Id});

    const accessPolicies = {
      userAccessPolicies: newUserPolicies,
      teamAccessPolicies: newTeamPolicies
    };

    return accessPolicies;
  }

  return service;
}]);
