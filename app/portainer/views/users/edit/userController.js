angular.module('portainer.app').controller('UserController', [
  '$q',
  '$scope',
  '$state',
  '$transition$',
  'UserService',
  'ModalService',
  'Notifications',
  'SettingsService',
  'Authentication',
  function ($q, $scope, $state, $transition$, UserService, ModalService, Notifications, SettingsService, Authentication) {
    $scope.state = {
      updatePasswordError: '',
    };

    $scope.formValues = {
      username: '',
      newPassword: '',
      confirmPassword: '',
      Administrator: false,
    };

    $scope.deleteUser = function () {
      ModalService.confirmDeletion('Do you want to remove this user? This user will not be able to login into Portainer anymore.', function onConfirm(confirmed) {
        if (!confirmed) {
          return;
        }
        deleteUser();
      });
    };

    $scope.updateUser = async function () {
      const role = $scope.formValues.Administrator ? 1 : 2;
      const oldUsername = $scope.user.Username;
      const username = $scope.formValues.username;
      let promise = Promise.resolve(true);
      if (username != oldUsername) {
        promise = new Promise((resolve) =>
          ModalService.confirm({
            title: 'Are you sure?',
            message: `Are you sure you want to rename the user ${oldUsername} to ${username}?`,
            buttons: {
              confirm: {
                label: 'Update',
                className: 'btn-primary',
              },
            },
            callback: resolve,
          })
        );
      }
      const confirmed = await promise;
      if (!confirmed) {
        return;
      }
      UserService.updateUser($scope.user.Id, { role, username })
        .then(function success() {
          Notifications.success('User successfully updated');
          $state.reload();
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to update user permissions');
        });
    };

    $scope.updatePassword = async function () {
      const isCurrentUser = Authentication.getUserDetails().ID === $scope.user.Id;
      const confirmed = !isCurrentUser || (await ModalService.confirmChangePassword());
      if (!confirmed) {
        return;
      }
      UserService.updateUser($scope.user.Id, { password: $scope.formValues.newPassword })
        .then(function success() {
          Notifications.success('Password successfully updated');

          if (isCurrentUser) {
            $state.go('portainer.logout');
          } else {
            $state.reload();
          }
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

    $scope.isSubmitEnabled = isSubmitEnabled;
    function isSubmitEnabled() {
      const { user, formValues } = $scope;
      return user && (user.Username !== formValues.username || (formValues.Administrator && user.Role !== 1) || (!formValues.Administrator && user.Role === 1));
    }

    $scope.isDeleteDisabled = isDeleteDisabled;
    function isDeleteDisabled() {
      const { user } = $scope;
      return user && user.Id === 1;
    }

    function initView() {
      $scope.isAdmin = Authentication.isAdmin();

      $q.all({
        user: UserService.user($transition$.params().id),
        settings: SettingsService.publicSettings(),
      })
        .then(function success(data) {
          var user = data.user;
          $scope.user = user;
          $scope.formValues.Administrator = user.Role === 1;
          $scope.formValues.username = user.Username;
          $scope.AuthenticationMethod = data.settings.AuthenticationMethod;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve user information');
        });
    }

    initView();
  },
]);
