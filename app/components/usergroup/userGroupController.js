angular.module('usergroup', [])
.controller('UserGroupController', ['$q', '$scope', '$state', '$stateParams', 'UserGroupService', 'UserService', 'ModalService', 'Notifications', 'Pagination',
function ($q, $scope, $state, $stateParams, UserGroupService, UserService, ModalService, Notifications, Pagination) {

  $scope.state = {
    pagination_count_users: Pagination.getPaginationCount('usergroup_available_users'),
    pagination_count_members: Pagination.getPaginationCount('usergroup_members')
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

  $scope.sortTypeGroupMembers = 'Username';
  $scope.sortReverseGroupMembers = true;

  $scope.orderGroupMembers = function(sortType) {
    $scope.sortReverseGroupMembers = ($scope.sortTypeGroupMembers === sortType) ? !$scope.sortReverseGroupMembers : false;
    $scope.sortTypeGroupMembers = sortType;
  };

  $scope.changePaginationCountGroupMembers = function() {
    Pagination.setPaginationCount('endpoint_access_groupMembers', $scope.state.pagination_count_groupMembers);
  };

  $scope.deleteUserGroup = function() {
    ModalService.confirmDeletion(
      'Do you want to delete this team? Users in this team will not be deleted.',
      function onConfirm(confirmed) {
        if(!confirmed) { return; }
      }
    );
  };

  $scope.addAllUsers = function() {
    // var authorizedUserIDs = [];
    // angular.forEach($scope.authorizedUsers, function (user) {
    //   authorizedUserIDs.push(user.Id);
    // });
    // angular.forEach($scope.users, function (user) {
    //   authorizedUserIDs.push(user.Id);
    // });
    // EndpointService.updateAuthorizedUsers($stateParams.id, authorizedUserIDs)
    // .then(function success(data) {
    //   $scope.authorizedUsers = $scope.authorizedUsers.concat($scope.users);
    //   $scope.users = [];
    //   Notifications.success('Access granted for all users');
    // })
    // .catch(function error(err) {
    //   Notifications.error("Failure", err, "Unable to update endpoint permissions");
    // });
    $scope.groupMembers = $scope.groupMembers.concat($scope.users);
    $scope.users = [];
    Notifications.success('All users successfully added');
  };

  $scope.removeAllUsers = function() {
    // EndpointService.updateAuthorizedUsers($stateParams.id, [])
    // .then(function success(data) {
    //   $scope.users = $scope.users.concat($scope.authorizedUsers);
    //   $scope.authorizedUsers = [];
    //   Notifications.success('Access removed for all users');
    // })
    // .catch(function error(err) {
    //   Notifications.error("Failure", err, "Unable to update endpoint permissions");
    // });
    $scope.users = $scope.users.concat($scope.groupMembers);
    $scope.groupMembers = [];
    Notifications.success('All users successfully removed');
  };

  $scope.addUser = function(user) {
    // var authorizedUserIDs = [];
    // angular.forEach($scope.authorizedUsers, function (u) {
    //   authorizedUserIDs.push(u.Id);
    // });
    // authorizedUserIDs.push(user.Id);
    // EndpointService.updateAuthorizedUsers($stateParams.id, authorizedUserIDs)
    // .then(function success(data) {
    //   removeUserFromArray(user.Id, $scope.users);
    //   $scope.authorizedUsers.push(user);
    //   Notifications.success('Access granted for user', user.Username);
    // })
    // .catch(function error(err) {
    //   Notifications.error("Failure", err, "Unable to update endpoint permissions");
    // });
    removeUserFromArray(user.Id, $scope.users);
    $scope.groupMembers.push(user);
    Notifications.success('User added to team', user.Username);
  };

  $scope.removeUser = function(user) {
    // var authorizedUserIDs = $scope.authorizedUsers.filter(function (u) {
    //   if (u.Id !== user.Id) {
    //     return u;
    //   }
    // }).map(function (u) {
    //   return u.Id;
    // });
    // EndpointService.updateAuthorizedUsers($stateParams.id, authorizedUserIDs)
    // .then(function success(data) {
    //   removeUserFromArray(user.Id, $scope.authorizedUsers);
    //   $scope.users.push(user);
    //   Notifications.success('Access removed for user', user.Username);
    // })
    // .catch(function error(err) {
    //   Notifications.error("Failure", err, "Unable to update endpoint permissions");
    // });
    removeUserFromArray(user.Id, $scope.groupMembers);
    $scope.users.push(user);
    Notifications.success('User removed from team', user.Username);
  };

  function initView() {
    $('#loadingViewSpinner').show();
    $q.all({
      usergroup: UserGroupService.userGroup($stateParams.id),
      users: UserService.users(),
    })
    .then(function success(data) {
      $scope.usergroup = data.usergroup;
      $scope.users = data.users.filter(function (user) {
        if (user.Role !== 1) {
          return user;
        }
      }).map(function (user) {
        return new UserViewModel(user);
      });
      $scope.groupMembers = [];
    })
    .catch(function error(err) {
      $scope.usergroup = [];
      $scope.users = [];
      $scope.groupMembers = [];
      Notifications.error("Failure", err, 'Unable to retrieve team details');
    })
    .finally(function final() {
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

  initView();
}]);
