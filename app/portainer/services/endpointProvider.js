angular.module('portainer.app').factory(
  'EndpointProvider',
  /* @ngInject */
  function EndpointProviderFactory(LocalStorage, $uiRouterGlobals) {
    const state = {
      currentEndpoint: null,
    };
    var service = {};
    var endpoint = {};

    service.initialize = function () {
      var endpointID = LocalStorage.getEndpointID();
      var endpointPublicURL = LocalStorage.getEndpointPublicURL();
      var offlineMode = LocalStorage.getOfflineMode();

      if (endpointID) {
        endpoint.ID = endpointID;
      }
      if (endpointPublicURL) {
        endpoint.PublicURL = endpointPublicURL;
      }
      if (offlineMode) {
        endpoint.OfflineMode = offlineMode;
      }
    };

    service.clean = function () {
      LocalStorage.cleanEndpointData();
      endpoint = {};
    };

    service.endpoint = function () {
      return endpoint;
    };

    service.endpointID = function () {
      if (endpoint.ID === undefined) {
        endpoint.ID = LocalStorage.getEndpointID();
      }
      if (endpoint.ID === null || endpoint.ID === undefined) {
        return service.getUrlEndpointID();
      }
      return endpoint.ID;
    };

    // TODO: technical debt
    // Reference issue: JIRA CE-463
    // Documentation (https://ui-router.github.io/ng1/docs/latest/modules/injectables.html) show the usage of either
    // * $stateParams
    // * $transition$
    // * $uiRouterGlobals
    // to retrieve the URL params
    //
    // * $stateParams: is deprecated and will cause a circular dependency injection error
    // because EndpointProvider is used by EndpointStatusInterceptor which is injected inside $httpProvider
    // >> [$injector:cdep] Circular dependency found: $uiRouter <- $stateParams <- EndpointProvider <- EndpointStatusInterceptor <- $http <- $uiRouter
    // For more details, see https://stackoverflow.com/questions/20230691/injecting-state-ui-router-into-http-interceptor-causes-circular-dependency#20230786
    //
    // * $transition$: mentionned as the replacement of $stateParams (https://ui-router.github.io/guide/ng1/migrate-to-1_0#stateparams-deprecation)
    // but is not injectable without tweaks inside a service
    //
    // * $uiRouterGlobal: per https://github.com/angular-ui/ui-router/issues/3237#issuecomment-271979688
    // seems the recommanded way to retrieve params inside a service/factory
    //
    // We need this function to fallback on URL endpoint ID when no endpoint has been selected
    service.getUrlEndpointID = () => {
      return $uiRouterGlobals.params.id;
    };

    service.setEndpointID = function (id) {
      endpoint.ID = id;
      LocalStorage.storeEndpointID(id);
    };

    service.endpointPublicURL = function () {
      if (endpoint.PublicURL === undefined) {
        endpoint.PublicURL = LocalStorage.getEndpointPublicURL();
      }
      return endpoint.PublicURL;
    };

    service.setEndpointPublicURL = function (publicURL) {
      endpoint.PublicURL = publicURL;
      LocalStorage.storeEndpointPublicURL(publicURL);
    };

    service.endpoints = function () {
      return LocalStorage.getEndpoints();
    };

    service.setEndpoints = function (data) {
      LocalStorage.storeEndpoints(data);
    };

    service.offlineMode = function () {
      return endpoint.OfflineMode;
    };

    service.setOfflineMode = function (isOffline) {
      endpoint.OfflineMode = isOffline;
      LocalStorage.storeOfflineMode(isOffline);
    };

    service.setOfflineModeFromStatus = function (status) {
      var isOffline = status !== 1;
      endpoint.OfflineMode = isOffline;
      LocalStorage.storeOfflineMode(isOffline);
    };

    service.currentEndpoint = function () {
      return state.currentEndpoint;
    };

    service.setCurrentEndpoint = function (endpoint) {
      state.currentEndpoint = endpoint;
    };

    return service;
  }
);
