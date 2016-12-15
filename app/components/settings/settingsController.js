angular.module('settings', [])
.controller('SettingsController', ['$scope', '$state', '$sanitize', 'Users', 'Messages',
function ($scope, $state, $sanitize, Users, Messages) {
  $scope.formValues = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  $scope.updatePassword = function() {
    $scope.invalidPassword = false;
    $scope.error = false;
    var currentPassword = $sanitize($scope.formValues.currentPassword);
    Users.checkPassword({ username: $scope.username, password: currentPassword }, function (d) {
      if (d.valid) {
        var newPassword = $sanitize($scope.formValues.newPassword);
        Users.update({ username: $scope.username, password: newPassword }, function (d) {
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
