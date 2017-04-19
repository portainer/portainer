angular.module('team', [])
.controller('TeamController', ['$q', '$scope', '$state', '$stateParams', 'TeamService', 'UserService', 'ModalService', 'Notifications', 'Pagination',
function ($q, $scope, $state, $stateParams, TeamService, UserService, ModalService, Notifications, Pagination) {

  $scope.state = {
    pagination_count_users: Pagination.getPaginationCount('team_available_users'),
    pagination_count_members: Pagination.getPaginationCount('team_members')
  };

  $scope.sortTypeUsers = 'Name';
  $scope.sortReverseUsers = true;

  $scope.orderUsers = function(sortType) {
    $scope.sortReverseUsers = ($scope.sortTypeUsers === sortType) ? !$scope.sortReverseUsers : false;
    $scope.sortTypeUsers = sortType;
  };

  $scope.changePaginationCountUsers = function() {
    Pagination.setPaginationCount('team_available_users', $scope.state.pagination_count_users);
  };

  $scope.sortTypeGroupMembers = 'Name';
  $scope.sortReverseGroupMembers = true;

  $scope.orderGroupMembers = function(sortType) {
    $scope.sortReverseGroupMembers = ($scope.sortTypeGroupMembers === sortType) ? !$scope.sortReverseGroupMembers : false;
    $scope.sortTypeGroupMembers = sortType;
  };

  $scope.changePaginationCountGroupMembers = function() {
    Pagination.setPaginationCount('team_members', $scope.state.pagination_count_members);
  };

  $scope.deleteTeam = function() {
    ModalService.confirmDeletion(
      'Do you want to delete this team? Users in this team will not be deleted.',
      function onConfirm(confirmed) {
        if(!confirmed) { return; }
        deleteTeam();
      }
    );
  };

  $scope.addAllUsers = function() {
    var teamMemberIDs = [];
    angular.forEach($scope.teamMembers, function (user) {
      teamMemberIDs.push(user.Id);
    });
    angular.forEach($scope.users, function (user) {
      teamMemberIDs.push(user.Id);
    });
    TeamService.updateTeam($scope.team.Id, $scope.team.Name, teamMemberIDs)
    .then(function success(data) {
      $scope.teamMembers = $scope.teamMembers.concat($scope.users);
      $scope.users = [];
      Notifications.success('All users successfully added');
    })
    .catch(function error(err) {
      Notifications.error("Failure", err, "Unable to update team members");
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  };

  $scope.removeAllUsers = function() {
    TeamService.updateTeam($scope.team.Id, $scope.team.Name, [])
    .then(function success(data) {
      $scope.users = $scope.users.concat($scope.teamMembers);
      $scope.teamMembers = [];
      Notifications.success('All users successfully removed');
    })
    .catch(function error(err) {
      Notifications.error("Failure", err, "Unable to update team members");
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  };

  $scope.addUser = function(user) {
    $('#loadingViewSpinner').show();
    var teamMemberIDs = [];
    angular.forEach($scope.teamMembers, function (u) {
      teamMemberIDs.push(u.Id);
    });
    teamMemberIDs.push(user.Id);
    TeamService.updateTeam($scope.team.Id, $scope.team.Name, teamMemberIDs)
    .then(function success(data) {
      removeUserFromArray(user.Id, $scope.users);
      $scope.teamMembers.push(user);
      Notifications.success('User added to team', user.Username);
    })
    .catch(function error(err) {
      Notifications.error("Failure", err, "Unable to update team members");
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  };

  $scope.removeUser = function(user) {
    var teamMemberIDs = $scope.teamMembers.filter(function (u) {
      if (u.Id !== user.Id) {
        return u;
      }
    }).map(function (u) {
      return u.Id;
    });
    TeamService.updateTeam($scope.team.Id, $scope.team.Name, teamMemberIDs)
    .then(function success(data) {
      removeUserFromArray(user.Id, $scope.teamMembers);
      $scope.users.push(user);
      Notifications.success('User removed from team', user.Username);
    })
    .catch(function error(err) {
      Notifications.error("Failure", err, "Unable to update team members");
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  };

  function initView() {
    $('#loadingViewSpinner').show();
    $q.all({
      team: TeamService.team($stateParams.id),
      users: UserService.users(),
    })
    .then(function success(data) {
      $scope.team = data.team;
      $scope.users = data.users.filter(function (user) {
        if (user.Role !== 1) {
          return user;
        }
      }).map(function (user) {
        return new UserViewModel(user);
      });
      $scope.teamMembers = [];
      angular.forEach($scope.team.Users, function(userID) {
        for (var i = 0, l = $scope.users.length; i < l; i++) {
          if ($scope.users[i].Id === userID) {
            $scope.teamMembers.push($scope.users[i]);
            $scope.users.splice(i, 1);
            return;
          }
        }
      });
    })
    .catch(function error(err) {
      $scope.users = [];
      $scope.teamMembers = [];
      Notifications.error("Failure", err, 'Unable to retrieve team details');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  function deleteTeam() {
    $('#loadingViewSpinner').show();
    TeamService.deleteTeam($scope.team.Id)
    .then(function success(data) {
      Notifications.success('Team successfully deleted', $scope.team.Name);
      $state.go('teams');
    })
    .catch(function error(err) {
      Notifications.error("Failure", err, 'Unable to remove team');
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
