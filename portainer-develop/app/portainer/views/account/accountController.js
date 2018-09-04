angular.module('portainer.app')
.controller('AccountController', ['$scope', '$state', '$sanitize', 'Authentication', 'UserService', 'Notifications', 'SettingsService',
function ($scope, $state, $sanitize, Authentication, UserService, Notifications, SettingsService) {
  $scope.formValues = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  $scope.updatePassword = function() {
    $scope.invalidPassword = false;
    var currentPassword = $sanitize($scope.formValues.currentPassword);
    var newPassword = $sanitize($scope.formValues.newPassword);

    UserService.updateUserPassword($scope.userID, currentPassword, newPassword)
    .then(function success() {
      Notifications.success('Success', 'Password successfully updated');
      $state.reload();
    })
    .catch(function error(err) {
      if (err.invalidPassword) {
        $scope.invalidPassword = true;
      } else {
        Notifications.error('Failure', err, err.msg);
      }
    });
  };

  function initView() {
    $scope.userID = Authentication.getUserDetails().ID;
    SettingsService.publicSettings()
    .then(function success(data) {
      $scope.AuthenticationMethod = data.AuthenticationMethod;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve application settings');
    });
  }

  initView();
}]);
