import { getSettings } from '@/react/portainer/settings/queries/useSettings';
import { confirmChangePassword } from '@@/modals/confirm';
import { openDialog } from '@@/modals/Dialog';
import { buildConfirmButton } from '@@/modals/utils';

angular.module('portainer.app').controller('AccountController', [
  '$scope',
  '$state',
  'Authentication',
  'UserService',
  'Notifications',
  '$async',
  'StateManager',
  function ($scope, $state, Authentication, UserService, Notifications, $async, StateManager) {
    $scope.formValues = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };

    $scope.updatePassword = async function () {
      const confirmed = await confirmChangePassword();
      if (confirmed) {
        try {
          await UserService.updateUserPassword($scope.userID, $scope.formValues.currentPassword, $scope.formValues.newPassword);
          Notifications.success('Success', 'Password successfully updated');
          StateManager.resetPasswordChangeSkips($scope.userID.toString());
          $scope.forceChangePassword = false;
          $state.go('portainer.logout');
        } catch (err) {
          Notifications.error('Failure', err, err.msg);
        }
      }
    };

    $scope.skipPasswordChange = async function () {
      try {
        if ($scope.userCanSkip()) {
          StateManager.setPasswordChangeSkipped($scope.userID.toString());
          $scope.forceChangePassword = false;
          $state.go('portainer.home');
        }
      } catch (err) {
        Notifications.error('Failure', err, err.msg);
      }
    };

    $scope.userCanSkip = function () {
      return $scope.timesPasswordChangeSkipped < 2;
    };

    this.uiCanExit = (newTransition) => {
      if (newTransition) {
        if ($scope.userRole === 1 && newTransition.to().name === 'portainer.settings.authentication') {
          return true;
        }
        if (newTransition.to().name === 'portainer.logout') {
          return true;
        }
      }

      if ($scope.forceChangePassword) {
        confirmForceChangePassword();
      }
      return !$scope.forceChangePassword;
    };

    $scope.uiCanExit = () => {
      return this.uiCanExit();
    };

    function initView() {
      const state = StateManager.getState();
      const userDetails = Authentication.getUserDetails();
      $scope.userID = userDetails.ID;
      $scope.userRole = Authentication.getUserDetails().role;
      $scope.forceChangePassword = userDetails.forceChangePassword;
      $scope.isInitialAdmin = userDetails.ID === 1;

      getSettings()
        .then(function success(settings) {
          $scope.AuthenticationMethod = settings.AuthenticationMethod;

          if (state.UI.requiredPasswordLength && state.UI.requiredPasswordLength !== settings.RequiredPasswordLength) {
            StateManager.clearPasswordChangeSkips();
          }

          $scope.timesPasswordChangeSkipped =
            state.UI.timesPasswordChangeSkipped && state.UI.timesPasswordChangeSkipped[$scope.userID.toString()]
              ? state.UI.timesPasswordChangeSkipped[$scope.userID.toString()]
              : 0;

          $scope.requiredPasswordLength = settings.RequiredPasswordLength;
          StateManager.setRequiredPasswordLength(settings.RequiredPasswordLength);
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve application settings');
        });
    }

    initView();
  },
]);

function confirmForceChangePassword() {
  return openDialog({
    message: 'Please update your password to a stronger password to continue using Portainer',
    buttons: [buildConfirmButton('OK')],
  });
}
