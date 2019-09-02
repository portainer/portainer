angular.module('portainer.kubernetes')
.controller('KubernetesDashboardController', ['$scope', '$q', 'EndpointService', 'Notifications', 'EndpointProvider', 'KubernetesNamespaceService',
function ($scope, $q, EndpointService, Notifications, EndpointProvider, KubernetesNamespaceService) {

  function initView() {
    var endpointId = EndpointProvider.endpointID();

    $q.all({
      endpoint: EndpointService.endpoint(endpointId),
      namespaces: KubernetesNamespaceService.namespaces()
    })
    .then(function success(data) {
      $scope.endpoint = data.endpoint;
      $scope.namespaces = data.namespaces;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to load dashboard data');
    });
  }

  initView();
}]);
