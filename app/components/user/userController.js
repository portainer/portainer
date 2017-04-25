angular.module('user', [])
.controller('UserController', ['$q', '$scope', '$state', '$stateParams', 'UserService', 'TeamService', 'ModalService', 'Notifications',
function ($q, $scope, $state, $stateParams, UserService, TeamService, ModalService, Notifications) {

  $scope.state = {
    updatePasswordError: '',
  };

  $scope.formValues = {
    newPassword: '',
    confirmPassword: '',
    Administrator: false,
    Teams: [],
  };

  $scope.deleteUser = function() {
    ModalService.confirmDeletion(
      'Do you want to remove this user? This user will not be able to login into Portainer anymore.',
      function onConfirm(confirmed) {
        if(!confirmed) { return; }
        deleteUser();
      }
    );
  };

  $scope.updatePermissions = function() {
    $('#loadingViewSpinner').show();
    var role = $scope.formValues.Administrator ? 1 : 2;
    UserService.updateUser($scope.user.Id, undefined, role)
    .then(function success(data) {
      var newRole = role === 1 ? 'administrator' : 'user';
      Notifications.success('Permissions successfully updated', $scope.user.Username + ' is now ' + newRole);
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error("Failure", err, 'Unable to update user permissions');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  };

  $scope.updatePassword = function() {
    $('#loadingViewSpinner').show();
    UserService.updateUser($scope.user.Id, $scope.formValues.newPassword, undefined)
    .then(function success(data) {
      Notifications.success('Password successfully updated');
      $state.reload();
    })
    .catch(function error(err) {
      $scope.state.updatePasswordError = 'Unable to update password';
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  };

  $scope.onTeamClick = function(team) {
    $('#loadingViewSpinner').show();
    var teamMemberIDs = team.Users;

    if (team.ticked) {
      teamMemberIDs.push($scope.user.Id);
    } else {
      _.remove(teamMemberIDs, function(n) {
        return n === $scope.user.Id;
      });
    }

    TeamService.updateTeam(team.Id, team.Name, teamMemberIDs)
    .then(function success(data) {
      Notifications.success('User team membership successfully updated', team.Name);
    })
    .catch(function error(err) {
      Notifications.error("Failure", err, "Unable to update user team membership");
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  };

  function deleteUser() {
    $('#loadingViewSpinner').show();
    UserService.deleteUser($scope.user.Id)
    .then(function success(data) {
      Notifications.success('User successfully deleted', $scope.user.Username);
      $state.go('users');
    })
    .catch(function error(err) {
      Notifications.error("Failure", err, 'Unable to remove user');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  function initView() {
    $('#loadingViewSpinner').show();
    $q.all({
      user: UserService.user($stateParams.id),
      teams: TeamService.teams()
    })
    .then(function success(data) {
      var user = new UserViewModel(data.user);
      $scope.user = user;
      $scope.teams = data.teams;
      $scope.formValues.Administrator = user.RoleId === 1 ? true : false;
      angular.forEach(data.teams, function (team) {
        if (_.includes(team.Users, user.Id)) {
          team.ticked = true;
          $scope.formValues.Teams.push(team);
        }
      });
    })
    .catch(function error(err) {
      Notifications.error("Failure", err, 'Unable to retrieve user information');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
