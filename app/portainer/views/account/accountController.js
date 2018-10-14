import angular from 'angular';

angular.module('portainer.app')
.controller('AccountController', ['$scope', '$state', 'Authentication', 'UserService', 'Notifications', 'SettingsService',
function ($scope, $state, Authentication, UserService, Notifications, SettingsService) {
  $scope.formValues = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  $scope.updatePassword = function() {
    UserService.updateUserPassword($scope.userID, $scope.formValues.currentPassword, $scope.formValues.newPassword)
    .then(function success() {
      Notifications.success('Success', 'Password successfully updated');
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, err.msg);
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
