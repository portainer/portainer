angular.module('secret', [])
.controller('SecretController', ['$scope', '$stateParams', '$state', 'SecretService', 'Notifications',
function ($scope, $stateParams, $state, SecretService, Notifications) {

  $scope.removeSecret = function removeSecret(secretId) {
    $('#loadingViewSpinner').show();
    SecretService.remove(secretId)
    .then(function success(data) {
      Notifications.success('Secret successfully removed');
      $state.go('secrets', {});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to remove secret');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  };

  function initView() {
    $('#loadingViewSpinner').show();
    SecretService.secret($stateParams.id)
    .then(function success(data) {
      $scope.secret = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve secret details');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
