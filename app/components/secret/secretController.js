angular.module('secret', [])
.controller('SecretController', ['$scope', '$stateParams', '$state', 'Secret', 'Notifications', 'Settings',
function ($scope, $stateParams, $state, Secret, Notifications, Settings) {

  function fetchSecret() {
    $('#loadingViewSpinner').show();
    Secret.get({id: $stateParams.id}, function (d) {
      $scope.secret = new SecretViewModel(d);
      $('#loadingViewSpinner').hide();
    }, function(e) {
      $('#loadingViewSpinner').hide();
      Notifications.error("Failure", e, "Unable to retrieve secret");
    });
  }

  $scope.removeSecret = function removeSecret(secretId) {
    $('#loadingViewSpinner').show();
    Secret.remove({id: $stateParams.id}, function (d) {
      if (d.message) {
        $('#loadingViewSpinner').hide();
        Notifications.send("Error", {}, d.message);
      } else {
        $('#loadingViewSpinner').hide();
        Notifications.send("Secret removed", $stateParams.id);
        $state.go('secrets', {});
      }
    }, function (e) {
      $('#loadingViewSpinner').hide();
      Notifications.error("Failure", e, "Unable to remove secret");
    });
  };

  fetchSecret();

}]);
