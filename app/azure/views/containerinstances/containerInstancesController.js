angular.module('portainer.azure')
.controller('AzureContainerInstancesController', ['$scope', 'AzureResourceService', 'Notifications',
function ($scope, AzureResourceService, Notifications) {

  function initView() {
    AzureResourceService.containerGroups()
    .then(function success(data) {
      $scope.containerGroups = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to load container groups');
    });
  }

  initView();
}]);
