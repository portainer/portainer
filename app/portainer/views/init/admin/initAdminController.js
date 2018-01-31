angular.module('portainer.app')
.controller('InitAdminController', ['$scope', '$state', '$sanitize', 'Notifications', 'Authentication', 'StateManager', 'UserService', 'EndpointService', 'EndpointProvider',
function ($scope, $state, $sanitize, Notifications, Authentication, StateManager, UserService, EndpointService, EndpointProvider) {

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
    var username = $sanitize($scope.formValues.Username);
    var password = $sanitize($scope.formValues.Password);

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
        var endpointID = data[0].Id;
        EndpointProvider.setEndpointID(endpointID);
        StateManager.updateEndpointState(false)
        .then(function success() {
          $state.go('docker.dashboard');
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to connect to Docker environment');
        });
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
