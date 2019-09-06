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

  var services = {
    name: 'kubernetes.services',
    url: '/services',
    views: {
      'content@': {
        templateUrl: './views/services/services.html',
        controller: 'KubernetesServicesController',
        controllerAs: 'ctrl'
      }
    }
  }

  var containers = {
    name: 'kubernetes.containers',
    url: '/containers',
    views: {
      'content@': {
        templateUrl: './views/containers/containers.html',
        controller: 'KubernetesContainersController',
        controllerAs: 'ctrl'
      }
    }
  }

  $stateRegistryProvider.register(kubernetes);
  $stateRegistryProvider.register(dashboard);
  $stateRegistryProvider.register(namespaces);
  $stateRegistryProvider.register(services);
  $stateRegistryProvider.register(containers);
}]);
