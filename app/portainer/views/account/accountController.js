angular.module('portainer.app').controller('AccountController', [
  '$scope',
  '$state',
  'Authentication',
  'UserService',
  'Notifications',
  'SettingsService',
  'StateManager',
  'ThemeManager',
  'ModalService',
  function ($scope, $state, Authentication, UserService, Notifications, SettingsService, StateManager, ThemeManager, ModalService) {
    $scope.formValues = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      userTheme: '',
    };

    $scope.updatePassword = function () {
      UserService.updateUserPassword($scope.userID, $scope.formValues.currentPassword, $scope.formValues.newPassword)
        .then(function success() {
          Notifications.success('Success', 'Password successfully updated');
          $state.reload();
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, err.msg);
        });
    };

    $scope.removeAction = (selectedItems) => {
      const msg = 'Do you want to remove the selected access token(s)? Any script or application using these tokens will no longer be able to invoke the Portainer API.';

      ModalService.confirmDeletion(msg, function onConfirm(confirmed) {
        if (!confirmed) {
          return;
        }
        var actionCount = selectedItems.length;
        angular.forEach(selectedItems, function (token) {
          UserService.deleteToken($scope.userID, token.id)
            .then(function success() {
              Notifications.success('Token successfully removed');
              var index = $scope.tokens.indexOf(token);
              $scope.tokens.splice(index, 1);
            })
            .catch(function error(err) {
              Notifications.error('Failure', err, 'Unable to remove token');
            })
            .finally(function final() {
              --actionCount;
              if (actionCount === 0) {
                $state.reload();
              }
            });
        });
      });
    };

    // Update DOM for theme attribute & LocalStorage
    $scope.setTheme = function (theme) {
      ThemeManager.setTheme(theme);
      StateManager.updateTheme(theme);
    };

    // Rest API Call to update theme with userID in DB
    $scope.updateTheme = function () {
      UserService.updateUserTheme($scope.userID, $scope.formValues.userTheme)
        .then(function success() {
          Notifications.success('Success', 'User theme successfully updated');
          $state.reload();
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, err.msg);
        });
    };

    async function initView() {
      $scope.userID = Authentication.getUserDetails().ID;

      const data = await UserService.user($scope.userID);

      $scope.formValues.userTheme = data.Usertheme;
      SettingsService.publicSettings()
        .then(function success(data) {
          $scope.AuthenticationMethod = data.AuthenticationMethod;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve application settings');
        });

      UserService.getUserTokens($scope.userID)
        .then(function success(data) {
          $scope.tokens = data;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve user tokens');
        });
    }

    initView();
  },
]);
