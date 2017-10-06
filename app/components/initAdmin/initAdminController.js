angular.module('initAdmin', [])
.controller('InitAdminController', ['$scope', '$state', '$sanitize', 'Notifications', 'Authentication', 'StateManager', 'UserService', 'EndpointService', 'EndpointProvider',
function ($scope, $state, $sanitize, Notifications, Authentication, StateManager, UserService, EndpointService, EndpointProvider) {

  $scope.logo = StateManager.getState().application.logo;

  $scope.formValues = {
    Username: 'admin',
    Password: '',
    ConfirmPassword: ''
  };

  $scope.createAdminUser = function() {
    $('#createResourceSpinner').show();
    var username = $sanitize($scope.formValues.Username);
    var password = $sanitize($scope.formValues.Password);

    UserService.initAdministrator(username, password)
    .then(function success() {
      return Authentication.login(username, password);
    })
    .then(function success() {
      return EndpointService.endpoints();
    })
    .then(function success(data) {
      if (data.length === 0) {
        $state.go('init.endpoint');
      } else {
        var endpointID = data[0].Id;
        EndpointProvider.setEndpointID(endpointID);
        StateManager.updateEndpointState(false)
        .then(function success() {
          $state.go('dashboard');
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
      $('#createResourceSpinner').hide();
    });
  };

}]);
