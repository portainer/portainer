angular.module('portainer.helpers')
.factory('ResourceControlHelper', [function ResourceControlHelperFactory() {
  'use strict';
  var helper = {};

  helper.retrieveAuthorizedUsers = function(resourceControl, users) {
    var authorizedUserNames = [];
    angular.forEach(resourceControl.Users, function(userId) {
      var user = _.find(users, { Id: userId });
      if (user) {
        authorizedUserNames.push(user);
      }
    });
    return authorizedUserNames;
  };

  helper.retrieveAuthorizedTeams = function(resourceControl, teams) {
    var authorizedTeamNames = [];
    angular.forEach(resourceControl.Teams, function(teamId) {
      var team = _.find(teams, { Id: teamId });
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
      var found = _.includes(resourceControl.Teams, membership.TeamId);
      if (found && membership.Role === 1) {
        isTeamLeader = true;
        break;
      }
    }
    return isTeamLeader;
  };

  return helper;
}]);
