angular.module('registry', [])
.controller('RegistryController', ['$scope', '$state', '$stateParams', '$filter', 'RegistryService', 'Notifications',
function ($scope, $state, $stateParams, $filter, RegistryService, Notifications) {

  $scope.updateRegistry = function() {
  };

  function initView() {
    $('#loadingViewSpinner').show();
    var registryID = $stateParams.id;
    RegistryService.registry(registryID)
    .then(function success(data) {
      $scope.registry = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve registry details');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
