angular.module('endpointInit', [])
.controller('EndpointInitController', ['$scope', '$state', 'EndpointService', 'StateManager', 'Messages',
function ($scope, $state, EndpointService, StateManager, Messages) {
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

  EndpointService.getActive().then(function success(data) {
    $state.go('dashboard');
  }, function error(err) {
    if (err.status !== 404) {
      Messages.error("Failure", err, 'Unable to verify Docker endpoint existence');
    }
  });

  $scope.cleanError = function() {
    $scope.state.error = '';
  };

  $scope.createLocalEndpoint = function() {
    $('#initEndpointSpinner').show();
    $scope.state.error = '';
    var name = "local";
    var URL = "unix:///var/run/docker.sock";
    var TLS = false;
    EndpointService.createLocalEndpoint(name, URL, TLS, true).then(function success(data) {
      StateManager.updateEndpointState(false)
      .then(function success() {
        $state.go('dashboard');
      }, function error(err) {
        $('#initEndpointSpinner').hide();
        $scope.state.error = 'Unable to connect to the Docker endpoint';
      });
    }, function error(err) {
      $('#initEndpointSpinner').hide();
      $scope.state.error = 'Unable to create endpoint';
    });
  };

  $scope.createRemoteEndpoint = function() {
    $('#initEndpointSpinner').show();
    $scope.state.error = '';
    var name = $scope.formValues.Name;
    var URL = $scope.formValues.URL;
    var TLS = $scope.formValues.TLS;
    var TLSCAFile = $scope.formValues.TLSCACert;
    var TLSCertFile = $scope.formValues.TLSCert;
    var TLSKeyFile = $scope.formValues.TLSKey;
    EndpointService.createRemoteEndpoint(name, URL, TLS, TLSCAFile, TLSCertFile, TLSKeyFile, TLS ? false : true)
    .then(function success(data) {
      StateManager.updateEndpointState(false)
      .then(function success() {
        $state.go('dashboard');
      }, function error(err) {
        $('#initEndpointSpinner').hide();
        EndpointService.deleteEndpoint(0)
        .then(function success() {
          $scope.state.error = 'Unable to connect to the Docker endpoint';
        });
      });
    }, function error(err) {
      $('#initEndpointSpinner').hide();
      $scope.state.uploadInProgress = false;
      $scope.state.error = err.msg;
    }, function update(evt) {
      if (evt.upload) {
        $scope.state.uploadInProgress = evt.upload;
      }
    });
  };
}]);
