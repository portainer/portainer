angular.module('endpoint', [])
.controller('EndpointController', ['$scope', '$state', '$stateParams', '$filter', 'EndpointService', 'Notifications',
function ($scope, $state, $stateParams, $filter, EndpointService, Notifications) {

  if (!$scope.applicationState.application.endpointManagement) {
    $state.go('endpoints');
  }

  $scope.state = {
    uploadInProgress: false
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

    var endpointParams = {
      name: endpoint.Name,
      URL: endpoint.URL,
      PublicURL: endpoint.PublicURL,
      TLS: TLS,
      TLSSkipVerify: TLSSkipVerify,
      TLSSkipClientVerify: TLSSkipClientVerify,
      TLSCACert: TLSSkipVerify || securityData.TLSCACert === endpoint.TLSConfig.TLSCACert ? null : securityData.TLSCACert,
      TLSCert: TLSSkipClientVerify || securityData.TLSCert === endpoint.TLSConfig.TLSCert ? null : securityData.TLSCert,
      TLSKey: TLSSkipClientVerify || securityData.TLSKey === endpoint.TLSConfig.TLSKey ? null : securityData.TLSKey,
      type: $scope.endpointType
    };

    $('updateResourceSpinner').show();
    EndpointService.updateEndpoint(endpoint.Id, endpointParams)
    .then(function success(data) {
      Notifications.success('Endpoint updated', $scope.endpoint.Name);
      $state.go('endpoints');
    }, function error(err) {
      Notifications.error('Failure', err, 'Unable to update endpoint');
    }, function update(evt) {
      if (evt.upload) {
        $scope.state.uploadInProgress = evt.upload;
      }
    });
  };

  function initView() {
    $('#loadingViewSpinner').show();
    EndpointService.endpoint($stateParams.id)
    .then(function success(data) {
      var endpoint = data;
      endpoint.URL = $filter('stripprotocol')(endpoint.URL);
      $scope.endpoint = endpoint;

      if (endpoint.URL.indexOf('unix://') === 0) {
        $scope.endpointType = 'local';
      } else {
        $scope.endpointType = 'remote';
      }
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve endpoint details');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
