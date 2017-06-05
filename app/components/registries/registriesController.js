angular.module('registries', [])
.controller('RegistriesController', ['$scope', '$state', 'RegistryService', 'Notifications', 'Pagination',
function ($scope, $state, RegistryService, Notifications, Pagination) {

  function initView() {
    $('#loadingViewSpinner').show();
    RegistryService.registries()
    .then(function success(data) {
      $scope.registries = data;
    })
    .catch(function error(err) {
      $scope.registries = [];
      Notifications.error('Failure', err, 'Unable to retrieve registries');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  

  initView();
}]);
