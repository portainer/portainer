angular.module('endpoint', [])
.controller('EndpointAccessController', ['$scope', '$state', '$stateParams', '$filter', 'EndpointService', 'Pagination', 'Messages',
function ($scope, $state, $stateParams, $filter, EndpointService, Pagination, Messages) {

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

  function getEndpoint(endpointID) {
    $('#loadingViewSpinner').show();
    EndpointService.endpoint($stateParams.id)
    .then(function success(data) {
      $scope.endpoint = data;
    })
    .catch(function error(err) {
      Messages.error("Failure", err, "Unable to retrieve endpoint details");
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  $scope.users = [
    {Id: 1, Username: "okenobi", Role: "administrator", Checked: false},
    {Id: 2, Username: "yabon", Role: "user", Checked: false},
  ];

  $scope.authorizedUsers = [
    {Id: 3, Username: "rbelmont", Role: "administrator", Checked: false},
  ];

  function removeUserFromArray(id, users) {
    for (var i = 0, l = users.length; i < l; i++) {
      if (users[i].Id === id) {
        users.splice(i, 1);
        return;
      }
    }
  }

  $scope.authorizeAllUsers = function() {
    angular.forEach($scope.users, function (user) {
      $scope.authorizedUsers.push(user);
    });
    $scope.users = [];
    Messages.send('Access granted for all users');
  };

  $scope.unauthorizeAllUsers = function() {
    angular.forEach($scope.authorizedUsers, function (user) {
      $scope.users.push(user);
    });
    $scope.authorizedUsers = [];
    Messages.send('Access removed for all users');
  };

  $scope.authorizeUser = function(user) {
    removeUserFromArray(user.Id, $scope.users);
    $scope.authorizedUsers.push(user);
    Messages.send('Access granted for user', user.Username);
  };

  $scope.unauthorizeUser = function(user) {
    removeUserFromArray(user.Id, $scope.authorizedUsers);
    $scope.users.push(user);
    Messages.send('Access removed for user', user.Username);
  };

  getEndpoint($stateParams.id);
}]);
