angular.module('portainer.azure')
.controller('AzureDashboardController', ['$q', '$scope', 'AzureResourceService', 'SubscriptionService', 'Notifications',
function ($q, $scope, AzureResourceService, SubscriptionService, Notifications) {

  function initView() {
    $q.all({
      subscriptions: SubscriptionService.subscriptions(),
      resourceGroups: AzureResourceService.resourceGroups()
    })
    .then(function success(data) {
      $scope.subscriptions = data.subscriptions;
      $scope.resourceGroups =  data.resourceGroups;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to load dashboard data');
    });
  }

  initView();
}]);
