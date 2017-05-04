angular.module('portainer.helpers')
.factory('VolumeHelper', [function VolumeHelperFactory() {
  'use strict';
  var helper = {};

  helper.createDriverOptions = function(optionArray) {
    var options = {};
    optionArray.forEach(function (option) {
      options[option.name] = option.value;
    });
    return options;
  };

  helper.decorateWithAuthorizations = function(volume, users, teams) {
    var resourceControl = volume.Metadata.ResourceControl;

    var authorizedUsers = [];
    for (var i = 0; i < resourceControl.Users.length; i++) {
      var user = _.find(users, {Id: resourceControl.Users[i]});
      if (user) {
        authorizedUsers.push(user.Username);
      }
    }
    volume.Metadata.authorizedUsers = authorizedUsers;

    var authorizedTeams = [];
    for (var j = 0; j < resourceControl.Teams.length; j++) {
      var team = _.find(teams, {Id: resourceControl.Teams[j]});
      if (team) {
        authorizedTeams.push(team.Name);
      }
    }
    volume.Metadata.authorizedTeams = authorizedTeams;
  };

  return helper;
}]);
