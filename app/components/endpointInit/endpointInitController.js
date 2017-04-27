angular.module('endpointInit', [])
.controller('EndpointInitController', ['$scope', '$state', 'EndpointService', 'StateManager', 'EndpointProvider', 'Notifications',
function ($scope, $state, EndpointService, StateManager, EndpointProvider, Notifications) {
  $scope.state = {
    error: '',
    uploadInProgress: false
  };

  $scope.formValues = {
    endpointType: "remote",
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

  $scope.resetErrorMessage = function() {
    $scope.state.error = '';
  };

  function showErrorMessage(message) {
    $scope.state.uploadInProgress = false;
    $scope.state.error = message;
  }

  function updateEndpointState(endpointID) {
    EndpointProvider.setEndpointID(endpointID);
    StateManager.updateEndpointState(false)
    .then(function success(data) {
      $state.go('dashboard');
    })
    .catch(function error(err) {
      EndpointService.deleteEndpoint(endpointID)
      .then(function success() {
        showErrorMessage('Unable to connect to the Docker endpoint');
      });
    });
  }

  $scope.createLocalEndpoint = function() {
    $('#initEndpointSpinner').show();
    $scope.state.error = '';
    var name = "local";
    var URL = "unix:///var/run/docker.sock";
    var TLS = false;

    EndpointService.createLocalEndpoint(name, URL, TLS, true)
    .then(function success(data) {
      var endpointID = data.Id;
      updateEndpointState(data.Id);
    }, function error() {
      $scope.state.error = 'Unable to create endpoint';
    })
    .finally(function final() {
      $('#initEndpointSpinner').hide();
    });
  };

  $scope.createRemoteEndpoint = function() {
    $('#initEndpointSpinner').show();
    $scope.state.error = '';
    var name = $scope.formValues.Name;
    var URL = $scope.formValues.URL;
    var URLPublish = URL.split(':')[0];
    var TLS = $scope.formValues.TLS;
    var TLSCAFile = $scope.formValues.TLSCACert;
    var TLSCertFile = $scope.formValues.TLSCert;
    var TLSKeyFile = $scope.formValues.TLSKey;

    EndpointService.createRemoteEndpoint(name, URL, URLPublish, TLS, TLSCAFile, TLSCertFile, TLSKeyFile)
    .then(function success(data) {
      var endpointID = data.Id;
      updateEndpointState(endpointID);
    }, function error(err) {
      showErrorMessage(err.msg);
    }, function update(evt) {
      if (evt.upload) {
        $scope.state.uploadInProgress = evt.upload;
      }
    })
    .finally(function final() {
      $('#initEndpointSpinner').hide();
    });
  };
}]);
