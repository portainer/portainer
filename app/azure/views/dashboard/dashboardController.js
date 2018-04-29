angular.module('portainer.azure')
.controller('AzureDashboardController', ['$q', '$scope', 'AzureDashboardService', 'SubscriptionService', 'Notifications',
function ($q, $scope, AzureDashboardService, SubscriptionService, Notifications) {

  function initView() {
    $q.all({
      subscriptions: SubscriptionService.subscriptions(),
      resourceGroups: AzureDashboardService.resourceGroups()
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
