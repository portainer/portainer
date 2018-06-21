angular.module('portainer.app')
.controller('EndpointController', ['$q', '$scope', '$state', '$transition$', '$filter', 'EndpointService', 'GroupService', 'TagService', 'EndpointProvider', 'Notifications',
function ($q, $scope, $state, $transition$, $filter, EndpointService, GroupService, TagService, EndpointProvider, Notifications) {

  if (!$scope.applicationState.application.endpointManagement) {
    $state.go('portainer.endpoints');
  }

  $scope.state = {
    uploadInProgress: false,
    actionInProgress: false
  };

  $scope.formValues = {
    SecurityFormData: new EndpointSecurityFormData()
  };

  $scope.updateEndpoint = function() {
    var endpoint = $scope.endpoint;
    var securityData = $scope.formValues.SecurityFormData;
    var TLS = securityData.TLS;
    var TLSMode = securityData.TLSMode;
    var TLSSkipVerify = TLS && (TLSMode === 'tls_client_noca' || TLSMode === 'tls_only');
    var TLSSkipClientVerify = TLS && (TLSMode === 'tls_ca' || TLSMode === 'tls_only');

    var payload = {
      Name: endpoint.Name,
      PublicURL: endpoint.PublicURL,
      GroupID: endpoint.GroupId,
      Tags: endpoint.Tags,
      TLS: TLS,
      TLSSkipVerify: TLSSkipVerify,
      TLSSkipClientVerify: TLSSkipClientVerify,
      TLSCACert: TLSSkipVerify || securityData.TLSCACert === endpoint.TLSConfig.TLSCACert ? null : securityData.TLSCACert,
      TLSCert: TLSSkipClientVerify || securityData.TLSCert === endpoint.TLSConfig.TLSCert ? null : securityData.TLSCert,
      TLSKey: TLSSkipClientVerify || securityData.TLSKey === endpoint.TLSConfig.TLSKey ? null : securityData.TLSKey,
      AzureApplicationID: endpoint.AzureCredentials.ApplicationID,
      AzureTenantID: endpoint.AzureCredentials.TenantID,
      AzureAuthenticationKey: endpoint.AzureCredentials.AuthenticationKey
    };

    if ($scope.endpointType !== 'local' && endpoint.Type !== 3) {
      payload.URL = 'tcp://' + endpoint.URL;
    }

    $scope.state.actionInProgress = true;
    EndpointService.updateEndpoint(endpoint.Id, payload)
    .then(function success(data) {
      Notifications.success('Endpoint updated', $scope.endpoint.Name);
      EndpointProvider.setEndpointPublicURL(endpoint.PublicURL);
      $state.go('portainer.endpoints', {}, {reload: true});
    }, function error(err) {
      Notifications.error('Failure', err, 'Unable to update endpoint');
      $scope.state.actionInProgress = false;
    }, function update(evt) {
      if (evt.upload) {
        $scope.state.uploadInProgress = evt.upload;
      }
    });
  };

  function initView() {
    $q.all({
      endpoint: EndpointService.endpoint($transition$.params().id),
      groups: GroupService.groups(),
      tags: TagService.tagNames()
    })
    .then(function success(data) {
      var endpoint = data.endpoint;
      if (endpoint.URL.indexOf('unix://') === 0) {
        $scope.endpointType = 'local';
      } else {
        $scope.endpointType = 'remote';
      }
      endpoint.URL = $filter('stripprotocol')(endpoint.URL);
      $scope.endpoint = endpoint;
      $scope.groups = data.groups;
      $scope.availableTags = data.tags;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve endpoint details');
    });
  }

  initView();
}]);
