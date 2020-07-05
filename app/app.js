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

  $transitions.onBefore({}, async (transition) => {
    const { endpointId } = transition.params();
    const currentEndpointId = EndpointProvider.endpointID();
    const routerStateService = transition.router.stateService;
    if (!endpointId || endpointId === currentEndpointId) {
      return true;
    }

    try {
      const endpoint = await EndpointService.endpoint(endpointId);
      if (endpoint.Type === 3) {
        return await switchToAzureEndpoint(endpoint);
      }

      if (endpoint.Type === 4) {
        return await switchToEdgeEndpoint(endpoint);
      }

      if (endpoint.Type === 5 || endpoint.Type === 6) {
        return await switchToKubernetesEndpoint(endpoint);
      }
      if (endpoint.Type === 7) {
        return await switchToKubernetesEdgeEndpoint(endpoint);
      }

      const status = await checkEndpointStatus(endpoint);
      endpoint.Status = status;
      return await switchToDockerEndpoint(endpoint);
    } catch (error) {
      return routerStateService.target('portainer.home', { error });
    }

    async function switchToAzureEndpoint(endpoint) {
      EndpointProvider.setEndpointID(endpoint.Id);
      EndpointProvider.setEndpointPublicURL(endpoint.PublicURL);
      EndpointProvider.setOfflineModeFromStatus(endpoint.Status);
      await StateManager.updateEndpointState(endpoint, []);
    }

    async function switchToEdgeEndpoint(endpoint) {
      if (!endpoint.EdgeID) {
        return routerStateService.target('portainer.endpoints.endpoint', { id: endpoint.Id });
      }

      // $scope.state.connectingToEdgeEndpoint = true;
      try {
        await SystemService.ping(endpoint.Id);
        endpoint.Status = 1;
      } catch (e) {
        endpoint.Status = 2;
      }
      return switchToDockerEndpoint(endpoint);
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

    async function switchToKubernetesEdgeEndpoint(endpoint) {
      if (!endpoint.EdgeID) {
        return routerStateService.target('portainer.endpoints.endpoint', { id: endpoint.Id });
      }

      EndpointProvider.setEndpointID(endpoint.Id);
      // $scope.state.connectingToEdgeEndpoint = true;
      try {
        await KubernetesHealthService.ping();
        endpoint.Status = 1;
      } catch (e) {
        endpoint.Status = 2;
      }
      switchToKubernetesEndpoint(endpoint);
    }

    async function switchToKubernetesEndpoint(endpoint) {
      EndpointProvider.setEndpointID(endpoint.Id);
      return StateManager.updateEndpointState(endpoint, []);
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
