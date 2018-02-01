angular.module('portainer.app')
.controller('porAccessManagementController', ['AccessService', 'PaginationService', 'Notifications',
function (AccessService, PaginationService, Notifications) {
  var ctrl = this;

  ctrl.state = {
    pagination_count_accesses: PaginationService.getPaginationLimit('access_management_accesses'),
    pagination_count_authorizedAccesses: PaginationService.getPaginationLimit('access_management_AuthorizedAccesses'),
    sortAccessesBy: 'Type',
    sortAccessesReverse: false,
    sortAuthorizedAccessesBy: 'Type',
    sortAuthorizedAccessesReverse: false
  };

  ctrl.orderAccesses = function(sortBy) {
    ctrl.state.sortAccessesReverse = (ctrl.state.sortAccessesBy === sortBy) ? !ctrl.state.sortAccessesReverse : false;
    ctrl.state.sortAccessesBy = sortBy;
  };

  ctrl.orderAuthorizedAccesses = function(sortBy) {
    ctrl.state.sortAuthorizedAccessesReverse = (ctrl.state.sortAuthorizedAccessesBy === sortBy) ? !ctrl.state.sortAuthorizedAccessesReverse : false;
    ctrl.state.sortAuthorizedAccessesBy = sortBy;
  };

  ctrl.changePaginationCountAuthorizedAccesses = function() {
    PaginationService.setPaginationLimit('access_management_AuthorizedAccesses', ctrl.state.pagination_count_authorizedAccesses);
  };

  ctrl.changePaginationCountAccesses = function() {
    PaginationService.setPaginationLimit('access_management_accesses', ctrl.state.pagination_count_accesses);
  };

  function dispatchUserAndTeamIDs(accesses, users, teams) {
    angular.forEach(accesses, function (access) {
      if (access.Type === 'user') {
        users.push(access.Id);
      } else if (access.Type === 'team') {
        teams.push(access.Id);
      }
    });
  }

  function processAuthorizedIDs(accesses, authorizedAccesses) {
    var authorizedUserIDs = [];
    var authorizedTeamIDs = [];
    if (accesses) {
      dispatchUserAndTeamIDs(accesses, authorizedUserIDs, authorizedTeamIDs);
    }
    if (authorizedAccesses) {
      dispatchUserAndTeamIDs(authorizedAccesses, authorizedUserIDs, authorizedTeamIDs);
    }
    return {
      userIDs: authorizedUserIDs,
      teamIDs: authorizedTeamIDs
    };
  }

  function removeFromAccesses(access, accesses) {
    _.remove(accesses, function(n) {
      return n.Id === access.Id && n.Type === access.Type;
    });
  }

  function removeFromAccessIDs(accessId, accessIDs) {
    _.remove(accessIDs, function(n) {
      return n === accessId;
    });
  }

  ctrl.authorizeAccess = function(access) {
    var accessData = processAuthorizedIDs(null, ctrl.authorizedAccesses);
    var authorizedUserIDs = accessData.userIDs;
    var authorizedTeamIDs = accessData.teamIDs;

    if (access.Type === 'user') {
      authorizedUserIDs.push(access.Id);
    } else if (access.Type === 'team') {
      authorizedTeamIDs.push(access.Id);
    }

    ctrl.updateAccess({ userAccesses: authorizedUserIDs, teamAccesses: authorizedTeamIDs })
    .then(function success(data) {
      removeFromAccesses(access, ctrl.accesses);
      ctrl.authorizedAccesses.push(access);
      Notifications.success('Accesses successfully updated');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update accesses');
    });
  };

  ctrl.unauthorizeAccess = function(access) {
    var accessData = processAuthorizedIDs(null, ctrl.authorizedAccesses);
    var authorizedUserIDs = accessData.userIDs;
    var authorizedTeamIDs = accessData.teamIDs;

    if (access.Type === 'user') {
      removeFromAccessIDs(access.Id, authorizedUserIDs);
    } else if (access.Type === 'team') {
      removeFromAccessIDs(access.Id, authorizedTeamIDs);
    }

    ctrl.updateAccess({ userAccesses: authorizedUserIDs, teamAccesses: authorizedTeamIDs })
    .then(function success(data) {
      removeFromAccesses(access, ctrl.authorizedAccesses);
      ctrl.accesses.push(access);
      Notifications.success('Accesses successfully updated');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update accesses');
    });
  };

  ctrl.unauthorizeAllAccesses = function() {
    ctrl.updateAccess({ userAccesses: [], teamAccesses: [] })
    .then(function success(data) {
      ctrl.accesses = ctrl.accesses.concat(ctrl.authorizedAccesses);
      ctrl.authorizedAccesses = [];
      Notifications.success('Accesses successfully updated');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update accesses');
    });
  };

  ctrl.authorizeAllAccesses = function() {
    var accessData = processAuthorizedIDs(ctrl.accesses, ctrl.authorizedAccesses);
    var authorizedUserIDs = accessData.userIDs;
    var authorizedTeamIDs = accessData.teamIDs;

    ctrl.updateAccess({ userAccesses: authorizedUserIDs, teamAccesses: authorizedTeamIDs })
    .then(function success(data) {
      ctrl.authorizedAccesses = ctrl.authorizedAccesses.concat(ctrl.accesses);
      ctrl.accesses = [];
      Notifications.success('Accesses successfully updated');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update accesses');
    });
  };

  function initComponent() {
    var entity = ctrl.accessControlledEntity;
    AccessService.accesses(entity.AuthorizedUsers, entity.AuthorizedTeams)
    .then(function success(data) {
      ctrl.accesses = data.accesses;
      ctrl.authorizedAccesses = data.authorizedAccesses;
    })
    .catch(function error(err) {
      ctrl.accesses = [];
      ctrl.authorizedAccesses = [];
      Notifications.error('Failure', err, 'Unable to retrieve accesses');
    });
  }

  initComponent();
}]);
