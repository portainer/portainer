angular.module('portainer.azure').component('azureEndpointConfig', {
  bindings: {
    applicationId: '=',
    tenantId: '=',
    authenticationKey: '=',
  },
  templateUrl: './azureEndpointConfig.html',
});
