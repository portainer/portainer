angular.module('portainer.app').controller('InitAdminController', [
  '$async',
  '$scope',
  '$state',
  'Notifications',
  'Authentication',
  'StateManager',
  'SettingsService',
  'UserService',
  'EndpointService',
  function ($async, $scope, $state, Notifications, Authentication, StateManager, SettingsService, UserService, EndpointService) {
    $scope.logo = StateManager.getState().application.logo;

    $scope.formValues = {
      Username: 'admin',
      Password: '',
      ConfirmPassword: '',
      enableTelemetry: true,
    };

    $scope.state = {
      actionInProgress: false,
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
          StateManager.updateEnableTelemetry($scope.formValues.enableTelemetry);
          return SettingsService.update({ enableTelemetry: $scope.formValues.enableTelemetry });
        })
        .then(function () {
          return EndpointService.endpoints(0, 100);
        })
        .then(function success(data) {
          if (data.value.length === 0) {
            $state.go('portainer.init.endpoint');
          } else {
            $state.go('portainer.home');
          }
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to create administrator user');
        })
        .finally(function final() {
          $scope.state.actionInProgress = false;
        });
    };

    function createAdministratorFlow() {
      UserService.administratorExists()
        .then(function success(exists) {
          if (exists) {
            $state.go('portainer.home');
          }
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to verify administrator account existence');
        });
    }
    createAdministratorFlow();
  },
]);
