angular.module('portainer.app')
.controller('UserController', ['$q', '$scope', '$state', '$transition$', 'UserService', 'ModalService', 'Notifications', 'SettingsService', 'Authentication',
function ($q, $scope, $state, $transition$, UserService, ModalService, Notifications, SettingsService, Authentication) {

  $scope.state = {
    updatePasswordError: ''
  };

  $scope.formValues = {
    newPassword: '',
    confirmPassword: '',
    Administrator: false
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
    var role = $scope.formValues.Administrator ? 1 : 2;
    UserService.updateUser($scope.user.Id, undefined, role, 0)
    .then(function success() {
      var newRole = role === 1 ? 'administrator' : 'user';
      Notifications.success('Permissions successfully updated', $scope.user.Username + ' is now ' + newRole);
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update user permissions');
    });
  };

  $scope.updatePassword = function() {
    UserService.updateUser($scope.user.Id, $scope.formValues.newPassword, undefined, -1)
    .then(function success() {
      Notifications.success('Password successfully updated');
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update user password');
    });
  };

  function deleteUser() {
    UserService.deleteUser($scope.user.Id)
    .then(function success() {
      Notifications.success('User successfully deleted', $scope.user.Username);
      $state.go('portainer.users');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to remove user');
    });
  }

  function initView() {
    $scope.isAdmin = Authentication.isAdmin();

    $q.all({
      user: UserService.user($transition$.params().id),
      settings: SettingsService.publicSettings()
    })
    .then(function success(data) {
      var user = data.user;
      $scope.user = user;
      $scope.formValues.Administrator = user.Role === 1;
      $scope.AuthenticationMethod = data.settings.AuthenticationMethod;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve user information');
    });
  }

  initView();
}]);
