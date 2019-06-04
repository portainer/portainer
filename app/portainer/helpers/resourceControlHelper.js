import _ from 'lodash-es';

angular.module('portainer.app')
.factory('ResourceControlHelper', [function ResourceControlHelperFactory() {
  'use strict';
  var helper = {};

  helper.retrieveAuthorizedUsers = function(resourceControl, users) {
    var authorizedUsers = [];
    angular.forEach(resourceControl.UserAccesses, function(access) {
      var user = _.find(users, { Id: access.UserId });
      if (user) {
        authorizedUsers.push(user);
      }
    });
    return authorizedUsers;
  };

  helper.retrieveAuthorizedTeams = function(resourceControl, teams) {
    var authorizedTeams = [];
    angular.forEach(resourceControl.TeamAccesses, function(access) {
      var team = _.find(teams, { Id: access.TeamId });
      if (team) {
        authorizedTeams.push(team);
      }
    });
    return authorizedTeams;
  };

  helper.isLeaderOfAnyRestrictedTeams = function(userMemberships, resourceControl) {
    var isTeamLeader = false;
    for (var i = 0; i < userMemberships.length; i++) {
      var membership = userMemberships[i];
      var found = _.find(resourceControl.TeamAccesses, { TeamId :membership.TeamId });
      if (found && membership.Role === 1) {
        isTeamLeader = true;
        break;
      }
    }
    return isTeamLeader;
  };

  return helper;
}]);
