import $ from 'jquery';
import '@babel/polyfill';

angular.module('portainer').run(run);

function run(
  $rootScope,
  $state,
  $interval,
  LocalStorage,
  EndpointProvider,
  SystemService,
  cfpLoadingBar,
  $transitions,
  HttpRequestHelper,
  EndpointService,
  Notifications,
  StateManager,
  LegacyExtensionManager,
  KubernetesHealthService
) {
  'use strict';

  EndpointProvider.initialize();

  $rootScope.$state = $state;

  // Workaround to prevent the loading bar from going backward
  // https://github.com/chieffancypants/angular-loading-bar/issues/273
  var originalSet = cfpLoadingBar.set;
  cfpLoadingBar.set = function overrideSet(n) {
    if (n > cfpLoadingBar.status()) {
      originalSet.apply(cfpLoadingBar, arguments);
    }
  };

  $transitions.onBefore({}, function () {
    HttpRequestHelper.resetAgentHeaders();
  });

  $state.defaultErrorHandler(function () {
    // Do not log transitionTo errors
  });

  // Keep-alive Edge endpoints by sending a ping request every minute
  $interval(function () {
    ping(EndpointProvider, SystemService);
  }, 60 * 1000);

  $(document).ajaxSend(function (event, jqXhr, jqOpts) {
    const type = jqOpts.type === 'POST' || jqOpts.type === 'PUT' || jqOpts.type === 'PATCH';
    const hasNoContentType = jqOpts.contentType !== 'application/json' && jqOpts.headers && !jqOpts.headers['Content-Type'];
    if (type && hasNoContentType) {
      jqXhr.setRequestHeader('Content-Type', 'application/json');
    }
    jqXhr.setRequestHeader('Authorization', 'Bearer ' + LocalStorage.getJWT());
  });

  let currentEndpointId = 0;
  $transitions.onBefore({}, async (transition) => {
    const { endpointId } = transition.params();
    if (!endpointId || endpointId === currentEndpointId) {
      return true;
    }

    currentEndpointId = endpointId;
    const endpoint = await EndpointService.endpoint(endpointId);
    if (endpoint.Type === 3) {
      return switchToAzureEndpoint(endpoint);
    } else if (endpoint.Type === 4) {
      return switchToEdgeEndpoint(endpoint);
    }

    const status = await checkEndpointStatus(endpoint);
    endpoint.Status = status;
    return switchToDockerEndpoint(endpoint);

    function switchToAzureEndpoint(endpoint) {
      EndpointProvider.setEndpointID(endpoint.Id);
      EndpointProvider.setEndpointPublicURL(endpoint.PublicURL);
      EndpointProvider.setOfflineModeFromStatus(endpoint.Status);
      StateManager.updateEndpointState(endpoint, []).catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to connect to the Azure endpoint');
      });
    }

    function switchToEdgeEndpoint(endpoint) {
      if (!endpoint.EdgeID) {
        $state.go('portainer.endpoints.endpoint', { id: endpoint.Id });
        return;
      }

      // $scope.state.connectingToEdgeEndpoint = true;
      SystemService.ping(endpoint.Id)
        .then(function success() {
          endpoint.Status = 1;
        })
        .catch(function error() {
          endpoint.Status = 2;
        })
        .finally(function final() {
          switchToDockerEndpoint(endpoint);
        });
    }

    async function switchToDockerEndpoint(endpoint) {
      if (endpoint.Status === 2 && endpoint.Snapshots[0] && endpoint.Snapshots[0].Swarm === true) {
        // $scope.state.connectingToEdgeEndpoint = false;
        throw new Error('Endpoint is unreachable. Connect to another swarm manager.');
      } else if (endpoint.Status === 2 && !endpoint.Snapshots[0]) {
        // $scope.state.connectingToEdgeEndpoint = false;
        throw new Error('Endpoint is unreachable and there is no snapshot available for offline browsing.');
      }

      EndpointProvider.setEndpointID(endpoint.Id);
      EndpointProvider.setEndpointPublicURL(endpoint.PublicURL);
      EndpointProvider.setOfflineModeFromStatus(endpoint.Status);

      const extensions = await LegacyExtensionManager.initEndpointExtensions(endpoint);
      return StateManager.updateEndpointState(endpoint, extensions);
    }

    function switchToKubernetesEdgeEndpoint(endpoint) {
      if (!endpoint.EdgeID) {
        $state.go('portainer.endpoints.endpoint', { id: endpoint.Id });
        return;
      }

      EndpointProvider.setEndpointID(endpoint.Id);
      // $scope.state.connectingToEdgeEndpoint = true;
      KubernetesHealthService.ping()
        .then(function success() {
          endpoint.Status = 1;
        })
        .catch(function error() {
          endpoint.Status = 2;
        })
        .finally(function final() {
          switchToKubernetesEndpoint(endpoint);
        });
    }

    function switchToKubernetesEndpoint(endpoint) {
      EndpointProvider.setEndpointID(endpoint.Id);
      StateManager.updateEndpointState(endpoint, [])
        .then(function success() {
          $state.go('kubernetes.dashboard');
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to connect to the Kubernetes endpoint');
        });
    }

    async function checkEndpointStatus(endpoint) {
      let status = 1;
      try {
        await SystemService.ping(endpoint.Id);
        status = 1;
      } catch (e) {
        status = 2;
      }
      if (endpoint.Status === status) {
        return status;
      }

      try {
        await EndpointService.updateEndpoint(endpoint.Id, { Status: status });
        return status;
      } catch (err) {
        throw err;
      }
    }
  });
}

function ping(EndpointProvider, SystemService) {
  let endpoint = EndpointProvider.currentEndpoint();
  if (endpoint !== undefined && endpoint.Type === 4) {
    SystemService.ping(endpoint.Id);
  }
}
