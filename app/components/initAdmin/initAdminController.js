angular.module('initAdmin', [])
.controller('InitAdminController', ['$scope', '$state', '$sanitize', 'Notifications', 'Authentication', 'StateManager', 'UserService',
function ($scope, $state, $sanitize, Notifications, Authentication, StateManager, UserService) {

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
      $state.go('init.endpoint');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create administrator user');
    })
    .finally(function final() {
      $('#createResourceSpinner').hide();
    });
  };

}]);
