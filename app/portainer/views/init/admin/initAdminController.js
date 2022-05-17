import { MinPasswordLen, StrengthCheck } from 'Portainer/helpers/password';

angular.module('portainer.app').controller('InitAdminController', [
  '$scope',
  '$state',
  'Notifications',
  'Authentication',
  'StateManager',
  'SettingsService',
  'UserService',
  'EndpointService',
  'BackupService',
  'StatusService',
  function ($scope, $state, Notifications, Authentication, StateManager, SettingsService, UserService, EndpointService, BackupService, StatusService) {
    $scope.uploadBackup = uploadBackup;

    $scope.logo = StateManager.getState().application.logo;

    $scope.formValues = {
      Username: 'admin',
      Password: '',
      ConfirmPassword: '',
      enableTelemetry: process.env.NODE_ENV === 'production',
    };

    $scope.state = {
      actionInProgress: false,
      showInitPassword: true,
      showRestorePortainer: false,
      passwordStrength: false,
    };

    $scope.MinPasswordLen = MinPasswordLen;

    createAdministratorFlow();

    $scope.onPasswordChange = function () {
      $scope.state.passwordStrength = StrengthCheck($scope.formValues.Password);
    };

    $scope.togglePanel = function () {
      $scope.state.showInitPassword = !$scope.state.showInitPassword;
      $scope.state.showRestorePortainer = !$scope.state.showRestorePortainer;
    };

    $scope.createAdminUser = function () {
      var username = $scope.formValues.Username;
      var password = $scope.formValues.Password;

      $scope.state.actionInProgress = true;
      UserService.initAdministrator(username, password)
        .then(function success() {
          return Authentication.login(username, password);
        })
        .then(function success() {
          return SettingsService.update({ enableTelemetry: $scope.formValues.enableTelemetry });
        })
        .then(() => {
          return StateManager.initialize();
        })
        .then(function () {
          return EndpointService.endpoints(0, 100);
        })
        .then(function success(data) {
          if (data.value.length === 0) {
            $state.go('portainer.wizard');
          } else {
            $state.go('portainer.home');
          }
        })
        .catch(function error(err) {
          handleError(err);
          Notifications.error('Failure', err, 'Unable to create administrator user');
        })
        .finally(function final() {
          $scope.state.actionInProgress = false;
        });
    };

    function handleError(err) {
      if (err.status === 303) {
        const headers = err.headers();
        const REDIRECT_REASON_TIMEOUT = 'AdminInitTimeout';
        if (headers && headers['redirect-reason'] === REDIRECT_REASON_TIMEOUT) {
          window.location.href = '/timeout.html';
        }
      }
    }

    function createAdministratorFlow() {
      UserService.administratorExists()
        .then(function success(exists) {
          if (exists) {
            $state.go('portainer.wizard');
          }
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to verify administrator account existence');
        });
    }

    async function uploadBackup() {
      $scope.state.backupInProgress = true;

      const file = $scope.formValues.BackupFile;
      const password = $scope.formValues.Password;

      restoreAndRefresh(() => BackupService.uploadBackup(file, password));
    }

    async function restoreAndRefresh(restoreAsyncFn) {
      $scope.state.backupInProgress = true;

      try {
        await restoreAsyncFn();
      } catch (err) {
        handleError(err);
        Notifications.error('Failure', err, 'Unable to restore the backup');
        $scope.state.backupInProgress = false;

        return;
      }

      try {
        await waitPortainerRestart();
        Notifications.success('The backup has successfully been restored');
        $state.go('portainer.auth');
      } catch (err) {
        handleError(err);
        Notifications.error('Failure', err, 'Unable to check for status');
        await wait(2);
        location.reload();
      }

      $scope.state.backupInProgress = false;
    }

    async function waitPortainerRestart() {
      for (let i = 0; i < 10; i++) {
        await wait(5);
        try {
          const status = await StatusService.status();
          if (status && status.Version) {
            return;
          }
        } catch (e) {
          // pass
        }
      }
      throw new Error('Timeout to wait for Portainer restarting');
    }
  },
]);

function wait(seconds = 0) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}
