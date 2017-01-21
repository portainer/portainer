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

  $scope.createLocalEndpoint = function() {
    $scope.state.error = '';
    var name = "local";
    var URL = "unix:///var/run/docker.sock";
    var TLS = false;
    EndpointService.createLocalEndpoint(name, URL, TLS, true).then(function success(data) {
      StateManager.setEndpointStateActive()
      .then(function success() {
        $state.go('dashboard');
      }, function error(err) {
        $scope.state.error = 'Unable to retrieve endpoint information';
      });
    }, function error(err) {
      $scope.state.error = 'Unable to create endpoint';
    });
  };

  $scope.createRemoteEndpoint = function() {
    $scope.state.error = '';
    var name = $scope.formValues.Name;
    var URL = $scope.formValues.URL;
    var TLS = $scope.formValues.TLS;
    var TLSCAFile = $scope.formValues.TLSCACert;
    var TLSCertFile = $scope.formValues.TLSCert;
    var TLSKeyFile = $scope.formValues.TLSKey;
    EndpointService.createRemoteEndpoint(name, URL, TLS, TLSCAFile, TLSCertFile, TLSKeyFile, TLS ? false : true).then(function success(data) {
      $state.go('dashboard');
    }, function error(err) {
      $scope.state.uploadInProgress = false;
      $scope.state.error = err.msg;
    }, function update(evt) {
      if (evt.upload) {
        $scope.state.uploadInProgress = evt.upload;
      }
    });
  };
}]);
