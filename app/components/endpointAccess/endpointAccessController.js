angular.module('endpointAccess', [])
.controller('EndpointAccessController', ['$q', '$scope', '$state', '$stateParams', '$filter', 'EndpointService', 'UserService', 'Pagination', 'Messages',
function ($q, $scope, $state, $stateParams, $filter, EndpointService, UserService, Pagination, Messages) {

  $scope.state = {
    pagination_count_users: Pagination.getPaginationCount('endpoint_access_users'),
    pagination_count_authorizedUsers: Pagination.getPaginationCount('endpoint_access_authorizedUsers')
  };

  $scope.sortTypeUsers = 'Username';
  $scope.sortReverseUsers = true;

  $scope.orderUsers = function(sortType) {
    $scope.sortReverseUsers = ($scope.sortTypeUsers === sortType) ? !$scope.sortReverseUsers : false;
    $scope.sortTypeUsers = sortType;
  };

  $scope.changePaginationCountUsers = function() {
    Pagination.setPaginationCount('endpoint_access_users', $scope.state.pagination_count_users);
  };

  $scope.sortTypeAuthorizedUsers = 'Username';
  $scope.sortReverseAuthorizedUsers = true;

  $scope.orderAuthorizedUsers = function(sortType) {
    $scope.sortReverseAuthorizedUsers = ($scope.sortTypeAuthorizedUsers === sortType) ? !$scope.sortReverseAuthorizedUsers : false;
    $scope.sortTypeAuthorizedUsers = sortType;
  };

  $scope.changePaginationCountAuthorizedUsers = function() {
    Pagination.setPaginationCount('endpoint_access_authorizedUsers', $scope.state.pagination_count_authorizedUsers);
  };

  $scope.authorizeAllUsers = function() {
    var authorizedUserIDs = [];
    angular.forEach($scope.authorizedUsers, function (user) {
      authorizedUserIDs.push(user.Id);
    });
    angular.forEach($scope.users, function (user) {
      authorizedUserIDs.push(user.Id);
    });
    EndpointService.updateAuthorizedUsers($stateParams.id, authorizedUserIDs)
    .then(function success(data) {
      $scope.authorizedUsers = $scope.authorizedUsers.concat($scope.users);
      $scope.users = [];
      Messages.success('Access granted for all users');
    })
    .catch(function error(err) {
      Messages.error("Failure", err, "Unable to update endpoint permissions");
    });
  };

  $scope.unauthorizeAllUsers = function() {
    EndpointService.updateAuthorizedUsers($stateParams.id, [])
    .then(function success(data) {
      $scope.users = $scope.users.concat($scope.authorizedUsers);
      $scope.authorizedUsers = [];
      Messages.success('Access removed for all users');
    })
    .catch(function error(err) {
      Messages.error("Failure", err, "Unable to update endpoint permissions");
    });
  };

  $scope.authorizeUser = function(user) {
    var authorizedUserIDs = [];
    angular.forEach($scope.authorizedUsers, function (u) {
      authorizedUserIDs.push(u.Id);
    });
    authorizedUserIDs.push(user.Id);
    EndpointService.updateAuthorizedUsers($stateParams.id, authorizedUserIDs)
    .then(function success(data) {
      removeUserFromArray(user.Id, $scope.users);
      $scope.authorizedUsers.push(user);
      Messages.success('Access granted for user', user.Username);
    })
    .catch(function error(err) {
      Messages.error("Failure", err, "Unable to update endpoint permissions");
    });
  };

  $scope.unauthorizeUser = function(user) {
    var authorizedUserIDs = $scope.authorizedUsers.filter(function (u) {
      if (u.Id !== user.Id) {
        return u;
      }
    }).map(function (u) {
      return u.Id;
    });
    EndpointService.updateAuthorizedUsers($stateParams.id, authorizedUserIDs)
    .then(function success(data) {
      removeUserFromArray(user.Id, $scope.authorizedUsers);
      $scope.users.push(user);
      Messages.success('Access removed for user', user.Username);
    })
    .catch(function error(err) {
      Messages.error("Failure", err, "Unable to update endpoint permissions");
    });
  };

  function getEndpointAndUsers(endpointID) {
    $('#loadingViewSpinner').show();
    $q.all({
      endpoint: EndpointService.endpoint($stateParams.id),
      users: UserService.users(),
    })
    .then(function success(data) {
      $scope.endpoint = data.endpoint;
      $scope.users = data.users.filter(function (user) {
        if (user.Role !== 1) {
          return user;
        }
      }).map(function (user) {
        return new UserViewModel(user);
      });
      $scope.authorizedUsers = [];
      angular.forEach($scope.endpoint.AuthorizedUsers, function(userID) {
        for (var i = 0, l = $scope.users.length; i < l; i++) {
          if ($scope.users[i].Id === userID) {
            $scope.authorizedUsers.push($scope.users[i]);
            $scope.users.splice(i, 1);
            return;
          }
        }
      });
    })
    .catch(function error(err) {
      $scope.templates = [];
      $scope.users = [];
      $scope.authorizedUsers = [];
      Messages.error("Failure", err, "Unable to retrieve endpoint details");
    })
    .finally(function final(){
      $('#loadingViewSpinner').hide();
    });
  }

  function removeUserFromArray(id, users) {
    for (var i = 0, l = users.length; i < l; i++) {
      if (users[i].Id === id) {
        users.splice(i, 1);
        return;
      }
    }
  }

  getEndpointAndUsers($stateParams.id);
}]);
