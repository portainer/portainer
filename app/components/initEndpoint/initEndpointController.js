angular.module('initEndpoint', [])
.controller('InitEndpointController', ['$scope', '$state', 'EndpointService', 'StateManager', 'EndpointProvider', 'Notifications',
function ($scope, $state, EndpointService, StateManager, EndpointProvider, Notifications) {

  $scope.logo = StateManager.getState().application.logo;

  $scope.state = {
    uploadInProgress: false
  };

  $scope.formValues = {
    EndpointType: 'remote',
    Name: '',
    URL: '',
    TLS: false,
    TLSCACert: null,
    TLSCert: null,
    TLSKey: null
  };

  if (!_.isEmpty($scope.applicationState.endpoint)) {
    $state.go('dashboard');
  }


  $scope.createLocalEndpoint = function() {
    $('#createResourceSpinner').show();
    var name = 'local';
    var URL = 'npipe:\\\\.\\pipe\\docker_engine';

    EndpointService.createLocalEndpoint(name, URL, false, true)
    .then(function success(data) {
      var endpointID = data.Id;
      EndpointProvider.setEndpointID(endpointID);
      return StateManager.updateEndpointState(false);
    })
    .then(function success(data) {
      $state.go('dashboard');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to connect to the Docker endpoint');
    })
    .finally(function final() {
      $('#createResourceSpinner').hide();
    });
  };

  $scope.createRemoteEndpoint = function() {
    $('#createResourceSpinner').show();
    var name = $scope.formValues.Name;
    var URL = $scope.formValues.URL;
    var PublicURL = URL.split(':')[0];
    var TLS = $scope.formValues.TLS;
    var TLSCAFile = $scope.formValues.TLSCACert;
    var TLSCertFile = $scope.formValues.TLSCert;
    var TLSKeyFile = $scope.formValues.TLSKey;

    EndpointService.createRemoteEndpoint(name, URL, PublicURL, TLS, TLSCAFile, TLSCertFile, TLSKeyFile)
    .then(function success(data) {
      var endpointID = data.Id;
      EndpointProvider.setEndpointID(endpointID);
      return StateManager.updateEndpointState(false);
    })
    .then(function success(data) {
      $state.go('dashboard');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to connect to the Docker endpoint');
    })
    .finally(function final() {
      $('#createResourceSpinner').hide();
    });
  };
}]);
