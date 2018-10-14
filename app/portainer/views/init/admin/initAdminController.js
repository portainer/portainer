import angular from 'angular';

angular.module('portainer.app')
.controller('InitAdminController', ['$scope', '$state', 'Notifications', 'Authentication', 'StateManager', 'UserService', 'EndpointService',
function ($scope, $state, Notifications, Authentication, StateManager, UserService, EndpointService) {

  $scope.logo = StateManager.getState().application.logo;

  $scope.formValues = {
    Username: 'admin',
    Password: '',
    ConfirmPassword: ''
  };

  $scope.state = {
    actionInProgress: false
  };

  $scope.createAdminUser = function() {
    var username = $scope.formValues.Username;
    var password = $scope.formValues.Password;

    $scope.state.actionInProgress = true;
    UserService.initAdministrator(username, password)
    .then(function success() {
      return Authentication.login(username, password);
    })
    .then(function success() {
      return EndpointService.endpoints();
    })
    .then(function success(data) {
      if (data.length === 0) {
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

}]);
