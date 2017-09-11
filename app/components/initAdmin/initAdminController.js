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
      var endpoints = data;
      if (endpoints.length > 0)  {
        var endpoint = endpoints[0];
        EndpointProvider.setEndpointID(endpoint.Id);
        StateManager.updateEndpointState(true)
        .then(function success(data) {
          $state.go('dashboard');
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to connect to the Docker endpoint');
        });
      } else {
        $state.go('init.endpoint');
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
