angular.module('userSettings', [])
.controller('UserSettingsController', ['$scope', '$state', '$sanitize', 'Authentication', 'UserService', 'Notifications',
function ($scope, $state, $sanitize, Authentication, UserService, Notifications) {
  $scope.formValues = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  $scope.updatePassword = function() {
    $scope.invalidPassword = false;
    var userID = Authentication.getUserDetails().ID;
    var currentPassword = $sanitize($scope.formValues.currentPassword);
    var newPassword = $sanitize($scope.formValues.newPassword);

    UserService.updateUserPassword(userID, currentPassword, newPassword)
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
}]);
