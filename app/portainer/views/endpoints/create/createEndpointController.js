angular.module('portainer.app')
.controller('CreateEndpointController', ['$scope', '$state', '$filter', 'EndpointService', 'Notifications',
function ($scope, $state, $filter, EndpointService, Notifications) {

  $scope.state = {
    EnvironmentType: 'docker',
    actionInProgress: false
  };

  $scope.formValues = {
    Name: '',
    URL: '',
    PublicURL: '',
    SecurityFormData: new EndpointSecurityFormData()
  };

  $scope.addDockerEndpoint = function() {
    var name = $scope.formValues.Name;
    var URL = $filter('stripprotocol')($scope.formValues.URL);
    var publicURL = $scope.formValues.PublicURL === '' ? URL.split(':')[0] : $scope.formValues.PublicURL;

    var securityData = $scope.formValues.SecurityFormData;
    var TLS = securityData.TLS;
    var TLSMode = securityData.TLSMode;
    var TLSSkipVerify = TLS && (TLSMode === 'tls_client_noca' || TLSMode === 'tls_only');
    var TLSSkipClientVerify = TLS && (TLSMode === 'tls_ca' || TLSMode === 'tls_only');
    var TLSCAFile = TLSSkipVerify ? null : securityData.TLSCACert;
    var TLSCertFile = TLSSkipClientVerify ? null : securityData.TLSCert;
    var TLSKeyFile = TLSSkipClientVerify ? null : securityData.TLSKey;

    addEndpoint(name, URL, publicURL, TLS, TLSSkipVerify, TLSSkipClientVerify, TLSCAFile, TLSCertFile, TLSKeyFile);
  };

  $scope.addAgentEndpoint = function() {
    var name = $scope.formValues.Name;
    var URL = $filter('stripprotocol')($scope.formValues.URL);
    var publicURL = $scope.formValues.PublicURL === '' ? URL.split(':')[0] : $scope.formValues.PublicURL;

    addEndpoint(name, URL, publicURL, true, true, true, null, null, null);
  };

  function addEndpoint(name, URL, PublicURL, TLS, TLSSkipVerify, TLSSkipClientVerify, TLSCAFile, TLSCertFile, TLSKeyFile) {
    $scope.state.actionInProgress = true;
    EndpointService.createRemoteEndpoint(name, URL, PublicURL, TLS, TLSSkipVerify, TLSSkipClientVerify, TLSCAFile, TLSCertFile, TLSKeyFile)
    .then(function success() {
      Notifications.success('Endpoint created', name);
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create endpoint');
    })
    .finally(function final() {
      $scope.state.actionInProgress = false;
    });
  }
}]);
