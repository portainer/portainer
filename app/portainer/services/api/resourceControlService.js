import _ from 'lodash-es';

angular.module('portainer.app')
.factory('ResourceControlService', ['$q', 'ResourceControl', 'UserService', 'TeamService', 'ResourceControlHelper', function ResourceControlServiceFactory($q, ResourceControl, UserService, TeamService, ResourceControlHelper) {
  'use strict';
  var service = {};

  service.createResourceControl = function(publicOnly, userIDs, teamIDs, resourceID, type, subResourceIDs) {
    var payload = {
      Type: type,
      Public: publicOnly,
      ResourceID: resourceID,
      Users: userIDs,
      Teams: teamIDs,
      SubResourceIDs: subResourceIDs
    };
    return ResourceControl.create({}, payload).$promise;
  };

  service.deleteResourceControl = function(rcID) {
    return ResourceControl.remove({id: rcID}).$promise;
  };

  service.updateResourceControl = function(publicOnly, userIDs, teamIDs, resourceControlId) {
    var payload = {
      Public: publicOnly,
      Users: userIDs,
      Teams: teamIDs
    };
    return ResourceControl.update({id: resourceControlId}, payload).$promise;
  };

  service.applyResourceControl = function(resourceControlType, resourceIdentifier, userId, accessControlData, subResources) {
    if (!accessControlData.AccessControlEnabled) {
      accessControlData.Ownership = 'public';
    }

    var authorizedUserIds = [];
    var authorizedTeamIds = [];
    var publicOnly = false;
    switch (accessControlData.Ownership) {
      case 'public':
        publicOnly = true;
        break;
      case 'private':
        authorizedUserIds.push(userId);
        break;
      case 'restricted':
        angular.forEach(accessControlData.AuthorizedUsers, function(user) {
          authorizedUserIds.push(user.Id);
        });
        angular.forEach(accessControlData.AuthorizedTeams, function(team) {
          authorizedTeamIds.push(team.Id);
        });
        break;
      default:
        return;  
      }
    return service.createResourceControl(publicOnly, authorizedUserIds,
      authorizedTeamIds, resourceIdentifier, resourceControlType, subResources);
  };

  service.applyResourceControlChange = function(resourceControlType, resourceId, resourceControl, ownershipParameters) {    
    if (resourceControl) {
      if (ownershipParameters.ownership === 'administrators') {
        return service.deleteResourceControl(resourceControl.Id);
      } else {
        return service.updateResourceControl(ownershipParameters.publicOnly, ownershipParameters.authorizedUserIds,
          ownershipParameters.authorizedTeamIds, resourceControl.Id);
      }
    } else {
        return service.createResourceControl(ownershipParameters.publicOnly, ownershipParameters.authorizedUserIds,
          ownershipParameters.authorizedTeamIds, resourceId, resourceControlType);
    }
  };

  service.retrieveOwnershipDetails = function(resourceControl) {
    var deferred = $q.defer();

    if (!resourceControl) {
      deferred.resolve({ authorizedUsers: [], authorizedTeams: [] });
      return deferred.promise;
    }

    $q.all({
      users: resourceControl.UserAccesses.length > 0 ? UserService.users(false) : [],
      teams: resourceControl.TeamAccesses.length > 0 ? TeamService.teams() : []
    })
    .then(function success(data) {
      var authorizedUsers = ResourceControlHelper.retrieveAuthorizedUsers(resourceControl, data.users);
      var authorizedTeams = ResourceControlHelper.retrieveAuthorizedTeams(resourceControl, data.teams);
      deferred.resolve({ authorizedUsers: authorizedUsers, authorizedTeams: authorizedTeams });
    })
    .catch(function error(err) {
      deferred.reject({ msg: 'Unable to retrieve user and team information', err: err });
    });

    return deferred.promise;
  };

  service.retrieveUserPermissionsOnResource = function(userID, isAdministrator, resourceControl) {
    var deferred = $q.defer();

    if (!resourceControl || isAdministrator) {
      deferred.resolve({ isPartOfRestrictedUsers: false, isLeaderOfAnyRestrictedTeams: false });
      return deferred.promise;
    }

    var found = _.find(resourceControl.UserAccesses, { UserId: userID });
    if (found) {
      deferred.resolve({ isPartOfRestrictedUsers: true, isLeaderOfAnyRestrictedTeams: false });
    } else {
      var isTeamLeader = false;
      UserService.userMemberships(userID)
      .then(function success(data) {
        var memberships = data;
        isTeamLeader = ResourceControlHelper.isLeaderOfAnyRestrictedTeams(memberships, resourceControl);
        deferred.resolve({ isPartOfRestrictedUsers: false, isLeaderOfAnyRestrictedTeams: isTeamLeader });
      })
      .catch(function error(err) {
        deferred.reject({ msg: 'Unable to retrieve user memberships', err: err });
      });
    }

    return deferred.promise;
  };

  return service;
}]);
