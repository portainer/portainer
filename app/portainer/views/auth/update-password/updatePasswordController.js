angular.module('portainer.app')
.controller('UpdatePasswordController', ['$scope', '$state', 'UserService', 'Authentication', 'Notifications',
function UpdatePasswordController($scope, $state, UserService, Authentication, Notifications) {

  $scope.formValues = {
    Password: '',
    ConfirmPassword: ''
  };

  $scope.state = {
    actionInProgress: false
  };

  $scope.updatePassword = function() {
    var userId = Authentication.getUserDetails().ID;
    console.log(userId);

    $scope.state.actionInProgress = true;
    UserService.updateUser(userId, $scope.formValues.Password)
    .then(function success() {
      $state.go('portainer.home');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to update password');
    })
    .finally(function final() {
      $scope.state.actionInProgress = false;
    });
  };

  function initView() {
    
  }

  initView();

}]);
