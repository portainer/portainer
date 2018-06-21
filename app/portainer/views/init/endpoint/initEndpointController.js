angular.module('portainer.app')
.controller('InitEndpointController', ['$scope', '$state', 'EndpointService', 'StateManager', 'EndpointProvider', 'Notifications', 'ExtensionManager',
function ($scope, $state, EndpointService, StateManager, EndpointProvider, Notifications, ExtensionManager) {

  if (!_.isEmpty($scope.applicationState.endpoint)) {
    $state.go('docker.dashboard');
  }

  $scope.logo = StateManager.getState().application.logo;

  $scope.state = {
    uploadInProgress: false,
    actionInProgress: false
  };

  $scope.formValues = {
    EndpointType: 'remote',
    Name: '',
    URL: '',
    TLS: false,
    TLSSkipVerify: false,
    TLSSKipClientVerify: false,
    TLSCACert: null,
    TLSCert: null,
    TLSKey: null,
    AzureApplicationId: '',
    AzureTenantId: '',
    AzureAuthenticationKey: ''
  };

  $scope.createLocalEndpoint = function() {
    var name = 'local';
    var URL = 'unix:///var/run/docker.sock';
    var endpoint;

    $scope.state.actionInProgress = true;
    EndpointService.createLocalEndpoint()
    .then(function success(data) {
      endpoint = data;
      EndpointProvider.setEndpointID(endpoint.Id);
      return ExtensionManager.initEndpointExtensions(endpoint.Id);
    })
    .then(function success(data) {
      var extensions = data;
      return StateManager.updateEndpointState(false, endpoint.Type, extensions);
    })
    .then(function success(data) {
      $state.go('docker.dashboard');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to connect to the Docker environment');
    })
    .finally(function final() {
      $scope.state.actionInProgress = false;
    });
  };

  $scope.createAzureEndpoint = function() {
    var name = $scope.formValues.Name;
    var applicationId = $scope.formValues.AzureApplicationId;
    var tenantId = $scope.formValues.AzureTenantId;
    var authenticationKey = $scope.formValues.AzureAuthenticationKey;

    createAzureEndpoint(name, applicationId, tenantId, authenticationKey);
  };

  $scope.createAgentEndpoint = function() {
    var name = $scope.formValues.Name;
    var URL = $scope.formValues.URL;
    var PublicURL = URL.split(':')[0];

    createRemoteEndpoint(name, 2, URL, PublicURL, true, true, true, null, null, null);
  };

  $scope.createRemoteEndpoint = function() {
    var name = $scope.formValues.Name;
    var URL = $scope.formValues.URL;
    var PublicURL = URL.split(':')[0];
    var TLS = $scope.formValues.TLS;
    var TLSSkipVerify = TLS && $scope.formValues.TLSSkipVerify;
    var TLSSKipClientVerify = TLS && $scope.formValues.TLSSKipClientVerify;
    var TLSCAFile = TLSSkipVerify ? null : $scope.formValues.TLSCACert;
    var TLSCertFile = TLSSKipClientVerify ? null : $scope.formValues.TLSCert;
    var TLSKeyFile = TLSSKipClientVerify ? null : $scope.formValues.TLSKey;

    createRemoteEndpoint(name, 1, URL, PublicURL, TLS, TLSSkipVerify, TLSSKipClientVerify, TLSCAFile, TLSCertFile, TLSKeyFile);
  };

  function createAzureEndpoint(name, applicationId, tenantId, authenticationKey) {
    var endpoint;

    $scope.state.actionInProgress = true;
    EndpointService.createAzureEndpoint(name, applicationId, tenantId, authenticationKey, 1, [])
    .then(function success(data) {
      endpoint = data;
      EndpointProvider.setEndpointID(endpoint.Id);
      return StateManager.updateEndpointState(false, endpoint.Type, []);
    })
    .then(function success(data) {
      $state.go('azure.dashboard');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to connect to the Azure environment');
    })
    .finally(function final() {
      $scope.state.actionInProgress = false;
    });
  }

  function createRemoteEndpoint(name, type, URL, PublicURL, TLS, TLSSkipVerify, TLSSKipClientVerify, TLSCAFile, TLSCertFile, TLSKeyFile) {
    var endpoint;
    $scope.state.actionInProgress = true;
    EndpointService.createRemoteEndpoint(name, type, URL, PublicURL, 1, [], TLS, TLSSkipVerify, TLSSKipClientVerify, TLSCAFile, TLSCertFile, TLSKeyFile)
    .then(function success(data) {
      endpoint = data;
      EndpointProvider.setEndpointID(endpoint.Id);
      return ExtensionManager.initEndpointExtensions(endpoint.Id);
    })
    .then(function success(data) {
      var extensions = data;
      return StateManager.updateEndpointState(false, endpoint.Type, extensions);
    })
    .then(function success(data) {
      $state.go('docker.dashboard');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to connect to the Docker environment');
    })
    .finally(function final() {
      $scope.state.actionInProgress = false;
    });
  }
}]);
