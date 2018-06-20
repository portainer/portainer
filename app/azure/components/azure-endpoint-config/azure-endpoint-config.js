angular.module('portainer.azure').component('azureEndpointConfig', {
  bindings: {
    applicationId: '=',
    tenantId: '=',
    authenticationKey: '='
  },
  templateUrl: 'app/azure/components/azure-endpoint-config/azureEndpointConfig.html'
});
