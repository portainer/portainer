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
    TLSKey: null
  };

  $scope.createLocalEndpoint = function() {
    var name = 'local';
    var URL = 'unix:///var/run/docker.sock';
    var endpointID = 1;

    $scope.state.actionInProgress = true;
    EndpointService.createLocalEndpoint(name, URL, false, true)
    .then(function success(data) {
      endpointID = data.Id;
      EndpointProvider.setEndpointID(endpointID);
      return ExtensionManager.initEndpointExtensions(endpointID);
    })
    .then(function success(data) {
      var extensions = data;
      return StateManager.updateEndpointState(false, extensions);
    })
    .then(function success(data) {
      $state.go('docker.dashboard');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to connect to the Docker environment');
      EndpointService.deleteEndpoint(endpointID);
    })
    .finally(function final() {
      $scope.state.actionInProgress = false;
    });
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
    var endpointID = 1;

    $scope.state.actionInProgress = true;
    EndpointService.createRemoteEndpoint(name, URL, PublicURL, TLS, TLSSkipVerify, TLSSKipClientVerify, TLSCAFile, TLSCertFile, TLSKeyFile)
    .then(function success(data) {
      endpointID = data.Id;
      EndpointProvider.setEndpointID(endpointID);
      return ExtensionManager.initEndpointExtensions(endpointID);
    })
    .then(function success(data) {
      var extensions = data;
      return StateManager.updateEndpointState(false, extensions);
    })
    .then(function success(data) {
      $state.go('docker.dashboard');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to connect to the Docker environment');
      EndpointService.deleteEndpoint(endpointID);
    })
    .finally(function final() {
      $scope.state.actionInProgress = false;
    });
  };
}]);
