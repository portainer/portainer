angular.module('registryAccess', [])
.controller('RegistryAccessController', ['$scope', '$state', '$stateParams', 'Pagination', 'Notifications',
function ($scope, $state, $stateParams, Pagination, Notifications) {

  $scope.state = {
    pagination_count_accesses: Pagination.getPaginationCount('registry_access_accesses'),
    pagination_count_authorizedAccesses: Pagination.getPaginationCount('registry_access_authorizedAccesses')
  };

  $scope.sortTypeAccesses = 'Type';
  $scope.sortReverseAccesses = false;

  $scope.orderAccesses = function(sortType) {
    $scope.sortReverseAccesses = ($scope.sortTypeAccesses === sortType) ? !$scope.sortReverseAccesses : false;
    $scope.sortTypeAccesses = sortType;
  };

  $scope.changePaginationCountAccesses = function() {
    Pagination.setPaginationCount('registry_access_accesses', $scope.state.pagination_count_accesses);
  };

  $scope.sortTypeAuthorizedAccesses = 'Type';
  $scope.sortReverseAuthorizedAccesses = false;

  $scope.orderAuthorizedAccesses = function(sortType) {
    $scope.sortReverseAuthorizedAccesses = ($scope.sortTypeAuthorizedAccesses === sortType) ? !$scope.sortReverseAuthorizedAccesses : false;
    $scope.sortTypeAuthorizedAccesses = sortType;
  };

  $scope.changePaginationCountAuthorizedAccesses = function() {
    Pagination.setPaginationCount('registry_access_authorizedAccesses', $scope.state.pagination_count_authorizedAccesses);
  };

  $scope.authorizeAllAccesses = function() {
    var authorizedUsers = [];
    var authorizedTeams = [];
    angular.forEach($scope.authorizedAccesses, function (a) {
      if (a.Type === 'user') {
        authorizedUsers.push(a.Id);
      } else if (a.Type === 'team') {
        authorizedTeams.push(a.Id);
      }
    });
    angular.forEach($scope.accesses, function (a) {
      if (a.Type === 'user') {
        authorizedUsers.push(a.Id);
      } else if (a.Type === 'team') {
        authorizedTeams.push(a.Id);
      }
    });

    RegistryService.updateAccess($stateParams.id, authorizedUsers, authorizedTeams)
    .then(function success(data) {
      $scope.authorizedAccesses = $scope.authorizedAccesses.concat($scope.accesses);
      $scope.accesses = [];
      Notifications.success('Registry accesses successfully updated');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update registry accesses');
    });
  };

  $scope.unauthorizeAllAccesses = function() {
    RegistryService.updateAccess($stateParams.id, [], [])
    .then(function success(data) {
      $scope.accesses = $scope.accesses.concat($scope.authorizedAccesses);
      $scope.authorizedAccesses = [];
      Notifications.success('Registry accesses successfully updated');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update registry accesses');
    });
  };

  $scope.authorizeAccess = function(access) {
    var authorizedUsers = [];
    var authorizedTeams = [];
    angular.forEach($scope.authorizedAccesses, function (a) {
      if (a.Type === 'user') {
        authorizedUsers.push(a.Id);
      } else if (a.Type === 'team') {
        authorizedTeams.push(a.Id);
      }
    });

    if (access.Type === 'user') {
      authorizedUsers.push(access.Id);
    } else if (access.Type === 'team') {
      authorizedTeams.push(access.Id);
    }

    RegistryService.updateAccess($stateParams.id, authorizedUsers, authorizedTeams)
    .then(function success(data) {
      removeAccessFromArray(access, $scope.accesses);
      $scope.authorizedAccesses.push(access);
      Notifications.success('Registry accesses successfully updated', access.Name);
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update registry accesses');
    });
  };

  $scope.unauthorizeAccess = function(access) {
    var authorizedUsers = [];
    var authorizedTeams = [];
    angular.forEach($scope.authorizedAccesses, function (a) {
      if (a.Type === 'user') {
        authorizedUsers.push(a.Id);
      } else if (a.Type === 'team') {
        authorizedTeams.push(a.Id);
      }
    });

    if (access.Type === 'user') {
      _.remove(authorizedUsers, function(n) {
        return n === access.Id;
      });
    } else if (access.Type === 'team') {
      _.remove(authorizedTeams, function(n) {
        return n === access.Id;
      });
    }

    RegistryService.updateAccess($stateParams.id, authorizedUsers, authorizedTeams)
    .then(function success(data) {
      removeAccessFromArray(access, $scope.authorizedAccesses);
      $scope.accesses.push(access);
      Notifications.success('Registry accesses successfully updated', access.Name);
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update registry accesses');
    });
  };

  function initView() {
    $('#loadingViewSpinner').show();
  }

  function removeAccessFromArray(access, accesses) {
    for (var i = 0, l = accesses.length; i < l; i++) {
      if (access.Type === accesses[i].Type && access.Id === accesses[i].Id) {
        accesses.splice(i, 1);
        return;
      }
    }
  }

  initView();
}]);
