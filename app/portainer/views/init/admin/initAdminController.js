import { getEnvironments } from '@/react/portainer/environments/environment.service';
import { restoreOptions } from '@/react/portainer/init/InitAdminView/restore-options';

const REDIRECT_REASON_TIMEOUT = 'AdminInitTimeout';

angular.module('portainer.app').controller('InitAdminController', [
  '$scope',
  '$state',
  'Notifications',
  'Authentication',
  'StateManager',
  'SettingsService',
  'UserService',
  'BackupService',
  'StatusService',
  function ($scope, $state, Notifications, Authentication, StateManager, SettingsService, UserService, BackupService, StatusService) {
    $scope.restoreOptions = restoreOptions;

    $scope.uploadBackup = uploadBackup;

    $scope.logo = StateManager.getState().application.logo;
    $scope.RESTORE_FORM_TYPES = { S3: 's3', FILE: 'file' };

    $scope.formValues = {
      Username: 'admin',
      Password: '',
      ConfirmPassword: '',
      SetupToken: '',
      restoreFormType: $scope.RESTORE_FORM_TYPES.FILE,
    };

    $scope.state = {
      actionInProgress: false,
      showInitPassword: true,
      showRestorePortainer: false,
    };

    createAdministratorFlow();

    $scope.togglePanel = function () {
      $scope.state.showInitPassword = !$scope.state.showInitPassword;
      $scope.state.showRestorePortainer = !$scope.state.showRestorePortainer;
    };

    $scope.onChangeRestoreType = onChangeRestoreType;
    function onChangeRestoreType(value) {
      $scope.$evalAsync(() => {
        $scope.formValues.restoreFormType = value;
      });
    }

    $scope.createAdminUser = function () {
      var username = $scope.formValues.Username;
      var password = $scope.formValues.Password;

      $scope.state.actionInProgress = true;
      UserService.initAdministrator(username, password, $scope.formValues.SetupToken)
        .then(function success() {
          return Authentication.login(username, password);
        })
        .then(() => {
          return StateManager.initialize();
        })
        .then(function () {
          return getEnvironments({ limit: 100 });
        })
        .then(function success(data) {
          if (data.value.length === 0) {
            $state.go('portainer.wizard');
          } else {
            $state.go('portainer.home');
          }
        })
        .catch(function error(err) {
          if (!handleError(err)) {
            Notifications.error('Failure', err, 'Unable to create administrator user');
          }
        })
        .finally(function final() {
          $scope.state.actionInProgress = false;
        });
    };

    function handleError(err) {
      if (err.status === 303) {
        const headers = err.response?.headers ?? {};
        if (headers['redirect-reason'] === REDIRECT_REASON_TIMEOUT) {
          window.location.href = '/timeout.html';
        }
        return true;
      }
      if (err.status === 403) {
        Notifications.error('Failure', err, 'Setup token is missing or invalid. Find the current token in the Portainer server logs.');
        return true;
      }
      return false;
    }

    function createAdministratorFlow() {
      SettingsService.publicSettings()
        .then(function success(data) {
          $scope.requiredPasswordLength = data.RequiredPasswordLength;
          $scope.requiresSetupToken = data.RequiresSetupToken;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve application settings');
        });

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

      restoreAndRefresh(() => BackupService.uploadBackup(file, password, $scope.formValues.SetupToken));
    }

    async function restoreAndRefresh(restoreAsyncFn) {
      $scope.state.backupInProgress = true;

      try {
        await restoreAsyncFn();
      } catch (err) {
        if (!handleError(err)) {
          Notifications.error('Failure', err, 'Unable to restore the backup');
        }
        $scope.state.backupInProgress = false;

        return;
      }

      try {
        await waitPortainerRestart();
        Notifications.success('Success', 'The backup has successfully been restored');
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
