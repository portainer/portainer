angular.module('users', [])
.controller('UsersController', ['$q', '$scope', '$state', '$sanitize', 'UserService', 'TeamService', 'TeamMembershipService', 'ModalService', 'Notifications', 'Authentication', 'SettingsService',
function ($q, $scope, $state, $sanitize, UserService, TeamService, TeamMembershipService, ModalService, Notifications, Authentication, SettingsService) {
  $scope.state = {
    userCreationError: '',
    // selectedItemCount: 0,
    validUsername: false,
    // pagination_count: PaginationService.getPaginationCount('users'),
    deploymentInProgress: false
  };

  $scope.formValues = {
    Username: '',
    Password: '',
    ConfirmPassword: '',
    Administrator: false,
    Teams: []
  };

  $scope.renderFieldRoleName = function(item, value) {
    var icon = '';
    if (item.Role === 1) {
      icon = '<i class="fa fa-user-circle-o" aria-hidden="true" style="margin-right: 5px;"></i>';
    } else if (item.Role !== 1 && item.isTeamLeader) {
      icon = '<i class="fa fa-user-plus" aria-hidden="true" style="margin-right: 5px;"></i>';
    } else {
      icon = '<i class="fa fa-user" aria-hidden="true" style="margin-right: 5px;"></i>';
    }
    return icon + value;
  };

  $scope.renderFieldAuthentication = function(item, value) {
    var authenticationMethod = $scope.AuthenticationMethod;
    if (item.Id !== 1 && authenticationMethod === 2) {
      return 'LDAP';
    }
    return 'Internal';
  };

  $scope.checkUsernameValidity = function() {
    var valid = true;
    for (var i = 0; i < $scope.users.length; i++) {
      if ($scope.formValues.Username === $scope.users[i].Username) {
        valid = false;
        break;
      }
    }
    $scope.state.validUsername = valid;
    $scope.state.userCreationError = valid ? '' : 'Username already taken';
  };

  $scope.addUser = function() {
    $scope.state.deploymentInProgress = true;
    $scope.state.userCreationError = '';
    var username = $sanitize($scope.formValues.Username);
    var password = $sanitize($scope.formValues.Password);
    var role = $scope.formValues.Administrator ? 1 : 2;
    var teamIds = [];
    angular.forEach($scope.formValues.Teams, function(team) {
      teamIds.push(team.Id);
    });
    UserService.createUser(username, password, role, teamIds)
    .then(function success(data) {
      Notifications.success('User successfully created', username);
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create user');
    })
    .finally(function final() {
      $scope.state.deploymentInProgress = false;
    });
  };

  function deleteSelectedUsers() {
    angular.forEach($scope.users, function (user) {
      if (user.Checked) {
        UserService.deleteUser(user.Id)
        .then(function success(data) {
          var index = $scope.users.indexOf(user);
          $scope.users.splice(index, 1);
          Notifications.success('User successfully deleted', user.Username);
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to remove user');
        });
      }
    });
  }

  $scope.removeAction = function (items) {
    ModalService.confirmDeletion(
      'Do you want to remove the selected users? They will not be able to login into Portainer anymore.',
      function onConfirm(confirmed) {
        if(!confirmed) { return; }
        deleteSelectedUsers(items);
      }
    );
  };

  function assignTeamLeaders(users, memberships) {
    for (var i = 0; i < users.length; i++) {
      var user = users[i];
      user.isTeamLeader = false;
      for (var j = 0; j < memberships.length; j++) {
        var membership = memberships[j];
        if (user.Id === membership.UserId && membership.Role === 1) {
          user.isTeamLeader = true;
          user.RoleName = 'team leader';
          break;
        }
      }
    }
  }

  function initView() {
    var userDetails = Authentication.getUserDetails();
    var isAdmin = userDetails.role === 1 ? true: false;
    $scope.isAdmin = isAdmin;
    $q.all({
      users: UserService.users(true),
      teams: isAdmin ? TeamService.teams() : UserService.userLeadingTeams(userDetails.ID),
      memberships: TeamMembershipService.memberships(),
      settings: SettingsService.publicSettings()
    })
    .then(function success(data) {
      var users = data.users;
      assignTeamLeaders(users, data.memberships);
      $scope.users = users;
      $scope.teams = data.teams;
      $scope.AuthenticationMethod = data.settings.AuthenticationMethod;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve users and teams');
      $scope.users = [];
      $scope.teams = [];
    });
  }

  initView();
}]);
