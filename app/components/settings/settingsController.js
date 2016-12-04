angular.module('settings', [])
.controller('SettingsController', ['$scope', '$state', 'Users', 'Messages',
function ($scope, $state, Users, Messages) {
  $scope.formValues = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  $scope.updatePassword = function() {
    $scope.invalidPassword = false;
    $scope.error = false;
    Users.checkPassword({ username: $scope.username, password: $scope.formValues.currentPassword }, function (d) {
      if (d.valid) {
        Users.update({ username: $scope.username, password: $scope.formValues.newPassword }, function (d) {
          Messages.send("Success", "Password successfully updated");
          $state.go('settings', {}, {reload: true});
        }, function (e) {
          Messages.error("Failure", e, "Unable to update password");
        });
      } else {
        $scope.invalidPassword = true;
      }
    }, function (e) {
      Messages.error("Failure", e, "Unable to check password validity");
    });
  };
}]);
