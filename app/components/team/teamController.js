angular.module('team', [])
.controller('TeamController', ['$q', '$scope', '$state', '$stateParams', 'TeamService', 'UserService', 'TeamMembershipService', 'ModalService', 'Notifications', 'Pagination', 'Authentication',
function ($q, $scope, $state, $stateParams, TeamService, UserService, TeamMembershipService, ModalService, Notifications, Pagination, Authentication) {

  $scope.state = {
    pagination_count_users: Pagination.getPaginationCount('team_available_users'),
    pagination_count_members: Pagination.getPaginationCount('team_members')
  };
  $scope.sortTypeUsers = 'Username';
  $scope.sortReverseUsers = true;
  $scope.users = [];
  $scope.teamMembers = [];
  $scope.leaderCount = 0;

  $scope.orderUsers = function(sortType) {
    $scope.sortReverseUsers = ($scope.sortTypeUsers === sortType) ? !$scope.sortReverseUsers : false;
    $scope.sortTypeUsers = sortType;
  };

  $scope.changePaginationCountUsers = function() {
    Pagination.setPaginationCount('team_available_users', $scope.state.pagination_count_users);
  };

  $scope.sortTypeGroupMembers = 'TeamRole';
  $scope.sortReverseGroupMembers = false;

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

  $scope.promoteToLeader = function(user) {
    $('#loadingViewSpinner').show();
    TeamMembershipService.updateMembership(user.MembershipId, user.Id, $scope.team.Id, 1)
    .then(function success(data) {
      $scope.leaderCount++;
      user.TeamRole = 'Leader';
      Notifications.success('User is now team leader', user.Username);
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update user role');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  };

  $scope.demoteToMember = function(user) {
    $('#loadingViewSpinner').show();
    TeamMembershipService.updateMembership(user.MembershipId, user.Id, $scope.team.Id, 2)
    .then(function success(data) {
      user.TeamRole = 'Member';
      $scope.leaderCount--;
      Notifications.success('User is now team member', user.Username);
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update user role');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  };

  $scope.addAllUsers = function() {
    $('#loadingViewSpinner').show();
    var teamMembershipQueries = [];
    angular.forEach($scope.users, function (user) {
      teamMembershipQueries.push(TeamMembershipService.createMembership(user.Id, $scope.team.Id, 2));
    });
    $q.all(teamMembershipQueries)
    .then(function success(data) {
      var users = $scope.users;
      for (var i = 0; i < users.length; i++) {
        var user = users[i];
        user.MembershipId = data[i].Id;
        user.TeamRole = 'Member';
      }
      $scope.teamMembers = $scope.teamMembers.concat(users);
      $scope.users = [];
      Notifications.success('All users successfully added');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update team members');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  };

  $scope.addUser = function(user) {
    $('#loadingViewSpinner').show();
    TeamMembershipService.createMembership(user.Id, $scope.team.Id, 2)
    .then(function success(data) {
      removeUserFromArray(user.Id, $scope.users);
      user.TeamRole = 'Member';
      user.MembershipId = data.Id;
      $scope.teamMembers.push(user);
      Notifications.success('User added to team', user.Username);
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update team members');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  };

  $scope.removeAllUsers = function() {
    $('#loadingViewSpinner').show();
    var teamMembershipQueries = [];
    angular.forEach($scope.teamMembers, function (user) {
      teamMembershipQueries.push(TeamMembershipService.deleteMembership(user.MembershipId));
    });
    $q.all(teamMembershipQueries)
    .then(function success(data) {
      $scope.users = $scope.users.concat($scope.teamMembers);
      $scope.teamMembers = [];
      Notifications.success('All users successfully removed');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update team members');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  };

  $scope.removeUser = function(user) {
    $('#loadingViewSpinner').show();
    TeamMembershipService.deleteMembership(user.MembershipId)
    .then(function success() {
      removeUserFromArray(user.Id, $scope.teamMembers);
      $scope.users.push(user);
      Notifications.success('User removed from team', user.Username);
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update team members');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  };

  function deleteTeam() {
    $('#loadingViewSpinner').show();
    TeamService.deleteTeam($scope.team.Id)
    .then(function success(data) {
      Notifications.success('Team successfully deleted', $scope.team.Name);
      $state.go('teams');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to remove team');
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

  function assignUsersAndMembers(users, memberships) {
    for (var i = 0; i < users.length; i++) {
      var user = users[i];
      var member = false;
      for (var j = 0; j < memberships.length; j++) {
        var membership = memberships[j];
        if (user.Id === membership.UserId) {
          member = true;
          if (membership.Role === 1) {
            user.TeamRole = 'Leader';
            $scope.leaderCount++;
          } else {
            user.TeamRole = 'Member';
          }
          user.MembershipId = membership.Id;
          $scope.teamMembers.push(user);
          break;
        }
      }
      if (!member) {
        $scope.users.push(user);
      }
    }
  }

  function initView() {
    $('#loadingViewSpinner').show();
    $scope.isAdmin = Authentication.getUserDetails().role === 1 ? true: false;
    $q.all({
      team: TeamService.team($stateParams.id),
      users: UserService.users(false),
      memberships: TeamService.userMemberships($stateParams.id)
    })
    .then(function success(data) {
      var users = data.users;
      $scope.team = data.team;
      assignUsersAndMembers(users, data.memberships);
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve team details');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
