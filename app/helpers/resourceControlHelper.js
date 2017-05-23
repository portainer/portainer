angular.module('portainer.helpers')
.factory('ResourceControlHelper', [function ResourceControlHelperFactory() {
  'use strict';
  var helper = {};

  helper.retrieveAuthorizedUsers = function(resourceControl, users) {
    var authorizedUserNames = [];
    angular.forEach(resourceControl.UserAccesses, function(access) {
      var user = _.find(users, { Id: access.UserId });
      if (user) {
        authorizedUserNames.push(user);
      }
    });
    return authorizedUserNames;
  };

  helper.retrieveAuthorizedTeams = function(resourceControl, teams) {
    var authorizedTeamNames = [];
    angular.forEach(resourceControl.TeamAccesses, function(access) {
      var team = _.find(teams, { Id: access.TeamId });
      if (team) {
        authorizedTeamNames.push(team);
      }
    });
    return authorizedTeamNames;
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
