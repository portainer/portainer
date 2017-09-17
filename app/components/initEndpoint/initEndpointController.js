angular.module('initEndpoint', [])
.controller('InitEndpointController', ['$scope', '$state', 'EndpointService', 'StateManager', 'EndpointProvider', 'Notifications',
function ($scope, $state, EndpointService, StateManager, EndpointProvider, Notifications) {

  if (!_.isEmpty($scope.applicationState.endpoint)) {
    $state.go('dashboard');
  }

  $scope.logo = StateManager.getState().application.logo;

  $scope.state = {
    uploadInProgress: false
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
    $('#createResourceSpinner').show();
    var name = 'local';

    var endpointID = 1;
    EndpointService.createLocalEndpoint(name, URL, false, true)
    .then(function success(data) {
      endpointID = data.Id;
      EndpointProvider.setEndpointID(endpointID);
      return StateManager.updateEndpointState(false);
    })
    .then(function success(data) {
      $state.go('dashboard');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to connect to the Docker environment');
      EndpointService.deleteEndpoint(endpointID);
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
    var TLSSkipVerify = TLS && $scope.formValues.TLSSkipVerify;
    var TLSSKipClientVerify = TLS && $scope.formValues.TLSSKipClientVerify;
    var TLSCAFile = TLSSkipVerify ? null : $scope.formValues.TLSCACert;
    var TLSCertFile = TLSSKipClientVerify ? null : $scope.formValues.TLSCert;
    var TLSKeyFile = TLSSKipClientVerify ? null : $scope.formValues.TLSKey;

    var endpointID = 1;
    EndpointService.createRemoteEndpoint(name, URL, PublicURL, TLS, TLSSkipVerify, TLSSKipClientVerify, TLSCAFile, TLSCertFile, TLSKeyFile)
    .then(function success(data) {
      endpointID = data.Id;
      EndpointProvider.setEndpointID(endpointID);
      return StateManager.updateEndpointState(false);
    })
    .then(function success(data) {
      $state.go('dashboard');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to connect to the Docker environment');
      EndpointService.deleteEndpoint(endpointID);
    })
    .finally(function final() {
      $('#createResourceSpinner').hide();
    });
  };
}]);
