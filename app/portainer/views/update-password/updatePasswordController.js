angular.module('portainer.app')
.controller('UpdatePasswordController', ['$scope', '$state', '$transition$', 'UserService', 'Authentication', 'Notifications',
function UpdatePasswordController($scope, $state, $transition$, UserService, Authentication, Notifications) {

  $scope.formValues = {
    Password: '',
    ConfirmPassword: ''
  };

  $scope.state = {
    actionInProgress: false,
    currentPassword: ''
  };

  $scope.updatePassword = function() {
    var userId = Authentication.getUserDetails().ID;

    $scope.state.actionInProgress = true;
    UserService.updateUserPassword(userId, $scope.state.currentPassword, $scope.formValues.Password)
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
    if (!Authentication.isAuthenticated()) {
      $state.go('portainer.auth');
    }

    $scope.state.currentPassword = $transition$.params().password;
  }

  initView();
}]);
