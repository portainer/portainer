angular.module('portainer.app')
.controller('AccountController', ['$scope', '$state', 'Authentication', 'UserService', 'Notifications', 'SettingsService', '$sanitize',
function ($scope, $state, Authentication, UserService, Notifications, SettingsService, $sanitize) {
  $scope.formValues = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    changePassword: false
  };

  $scope.updatePassword = function() {
    $scope.invalidPassword = false;
    var currentPassword = $scope.formValues.currentPassword;
    var newPassword = $scope.formValues.newPassword;
    
    if ($scope.formValues.changePassword) {
      currentPassword = $sanitize(currentPassword);
    }
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
