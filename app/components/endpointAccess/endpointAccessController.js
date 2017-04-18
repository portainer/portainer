angular.module('endpointAccess', [])
.controller('EndpointAccessController', ['$q', '$scope', '$state', '$stateParams', '$filter', 'EndpointService', 'UserService', 'TeamService', 'Pagination', 'Notifications',
function ($q, $scope, $state, $stateParams, $filter, EndpointService, UserService, TeamService, Pagination, Notifications) {

  $scope.state = {
    pagination_count_accesses: Pagination.getPaginationCount('endpoint_access_accesses'),
    pagination_count_authorizedAccesses: Pagination.getPaginationCount('endpoint_access_authorizedAccesses')
  };

  $scope.sortTypeAccesses = 'Name';
  $scope.sortReverseAccesses = true;

  $scope.orderAccesses = function(sortType) {
    $scope.sortReverseAccesses = ($scope.sortTypeAccesses === sortType) ? !$scope.sortReverseAccesses : false;
    $scope.sortTypeAccesses = sortType;
  };

  $scope.changePaginationCountAccesses = function() {
    Pagination.setPaginationCount('endpoint_access_accesses', $scope.state.pagination_count_accesses);
  };

  $scope.sortTypeAuthorizedAccesses = 'Name';
  $scope.sortReverseAuthorizedAccesses = true;

  $scope.orderAuthorizedAccesses = function(sortType) {
    $scope.sortReverseAuthorizedAccesses = ($scope.sortTypeAuthorizedAccesses === sortType) ? !$scope.sortReverseAuthorizedAccesses : false;
    $scope.sortTypeAuthorizedAccesses = sortType;
  };

  $scope.changePaginationCountAuthorizedAccesses = function() {
    Pagination.setPaginationCount('endpoint_access_authorizedAccesses', $scope.state.pagination_count_authorizedAccesses);
  };

  $scope.authorizeAllAccesses = function() {
    var authorizedAccessIDs = [];
    angular.forEach($scope.authorizedAccesses, function (access) {
      authorizedAccessIDs.push(access.Id);
    });
    angular.forEach($scope.accesses, function (access) {
      authorizedAccessIDs.push(access.Id);
    });
    EndpointService.updateAuthorizedUsers($stateParams.id, authorizedAccessIDs)
    .then(function success(data) {
      $scope.authorizedAccesses = $scope.authorizedAccesses.concat($scope.accesses);
      $scope.accesses = [];
      Notifications.success('Accesses granted successfully');
    })
    .catch(function error(err) {
      Notifications.error("Failure", err, "Unable to update endpoint permissions");
    });
  };

  $scope.unauthorizeAllAccesses = function() {
    EndpointService.updateAuthorizedUsers($stateParams.id, [])
    .then(function success(data) {
      $scope.accesses = $scope.accesses.concat($scope.authorizedAccesses);
      $scope.authorizedAccesses = [];
      Notifications.success('All accesses removed successfully');
      $scope.users = $scope.users.concat($scope.authorizedUsers);
      $scope.authorizedUsers = [];
      Notifications.success('Access removed for all users');
    })
    .catch(function error(err) {
      Notifications.error("Failure", err, "Unable to update endpoint permissions");
    });
  };

  $scope.authorizeAccess = function(access) {
    var authorizedAccessIDs = [];
    angular.forEach($scope.authorizedAccesses, function (a) {
      authorizedAccessIDs.push(a.Id);
    });
    authorizedAccessIDs.push(access.Id);
    EndpointService.updateAuthorizedUsers($stateParams.id, authorizedAccessIDs)
    .then(function success(data) {
      removeAccessFromArray(access.Id, $scope.accesses);
      $scope.authorizedAccesses.push(access);
      Notifications.success('Access granted', access.Name);
    })
    .catch(function error(err) {
      Notifications.error("Failure", err, "Unable to update endpoint permissions");
    });
  };

  $scope.unauthorizeAccess = function(access) {
    var authorizedAccessIDs = $scope.authorizedAccesses.filter(function (a) {
      if (a.Id !== access.Id) {
        return a;
      }
    }).map(function (a) {
      return a.Id;
    });
    EndpointService.updateAuthorizedUsers($stateParams.id, authorizedAccessIDs)
    .then(function success(data) {
      removeAccessFromArray(access.Id, $scope.authorizedAccesses);
      $scope.accesses.push(access);
      Notifications.success('Access removed', access.Name);
    })
    .catch(function error(err) {
      Notifications.error("Failure", err, "Unable to update endpoint permissions");
    });
  };

  function initView() {
    $('#loadingViewSpinner').show();
    $q.all({
      endpoint: EndpointService.endpoint($stateParams.id),
      users: UserService.users(),
      teams: TeamService.teams(),
    })
    .then(function success(data) {
      $scope.endpoint = data.endpoint;
      $scope.accesses = [];
      var users = data.users.filter(function (user) {
        if (user.Role !== 1) {
          return user;
        }
      }).map(function (user) {
        return new EndpointAccessUserViewModel(user);
      });
      var teams = data.teams.map(function (team) {
        return new EndpointAccessTeamViewModel(team);
      });
      $scope.accesses = $scope.accesses.concat(users, teams);

      // $scope.accesses = data.users.filter(function (user) {
      //   if (user.Role !== 1) {
      //     return user;
      //   }
      // }).map(function (user) {
      //   return new UserViewModel(user);
      // });
      $scope.authorizedAccesses = [];
      angular.forEach($scope.endpoint.AuthorizedUsers, function(userID) {
        for (var i = 0, l = $scope.accesses.length; i < l; i++) {
          if ($scope.accesses[i].Id === userID) {
            $scope.authorizedAccesses.push($scope.accesses[i]);
            $scope.accesses.splice(i, 1);
            return;
          }
        }
      });
    })
    .catch(function error(err) {
      $scope.accesses = [];
      $scope.authorizedAccesses = [];
      Notifications.error("Failure", err, "Unable to retrieve endpoint details");
    })
    .finally(function final(){
      $('#loadingViewSpinner').hide();
    });
  }

  function removeAccessFromArray(id, users) {
    for (var i = 0, l = users.length; i < l; i++) {
      if (users[i].Id === id) {
        users.splice(i, 1);
        return;
      }
    }
  }

  initView();
}]);
