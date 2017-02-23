angular.module('settings', [])
.controller('SettingsController', ['$scope', '$state', '$sanitize', 'Authentication', 'UserService', 'Messages',
function ($scope, $state, $sanitize, Authentication, UserService, Messages) {
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
      Messages.send("Success", "Password successfully updated");
      $state.reload();
    })
    .catch(function error(err) {
      if (err.invalidPassword) {
        $scope.invalidPassword = true;
      } else {
        Messages.error("Failure", err, err.msg);
      }
    });
  };
}]);
