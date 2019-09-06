angular.module('portainer.kubernetes', ['portainer.app'])
.config(['$stateRegistryProvider', function ($stateRegistryProvider) {
  'use strict';

  var kubernetes = {
    name: 'kubernetes',
    url: '/kubernetes',
    parent: 'root',
    abstract: true,
    resolve: {
      endpointID: ['EndpointProvider', '$state',
        function (EndpointProvider, $state) {
          var id = EndpointProvider.endpointID();
          if (!id) {
            return $state.go('portainer.home');
          }
        }
      ]
    }
  };

  var dashboard = {
    name: 'kubernetes.dashboard',
    url: '/dashboard',
    views: {
      'content@': {
        templateUrl: './views/dashboard/dashboard.html',
        controller: 'KubernetesDashboardController'
      }
    }
  };

  var namespaces = {
    name: 'kubernetes.namespaces',
    url: '/namespaces',
    views: {
      'content@': {
        templateUrl: './views/namespaces/namespaces.html',
        controller: 'KubernetesNamespacesController',
        controllerAs: 'ctrl'
      }
    }
  }

  $stateRegistryProvider.register(kubernetes);
  $stateRegistryProvider.register(dashboard);
  $stateRegistryProvider.register(namespaces);
}]);
