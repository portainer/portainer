angular.module('endpointInit', [])
.controller('EndpointInitController', ['$scope', '$state', 'EndpointService', 'StateManager', 'EndpointProvider', 'Messages',
function ($scope, $state, EndpointService, StateManager, EndpointProvider, Messages) {
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

  $scope.cleanError = function() {
    $scope.state.error = '';
  };

  $scope.createLocalEndpoint = function() {
    $('#initEndpointSpinner').show();
    $scope.state.error = '';
    var name = "local";
    var URL = "unix:///var/run/docker.sock";
    var TLS = false;

    EndpointService.createLocalEndpoint(name, URL, TLS, true)
    .then(
    function success(data) {
      var endpointID = data.Id;
      EndpointProvider.setEndpointID(endpointID);
      StateManager.updateEndpointState(false).then(
      function success() {
        $state.go('dashboard');
      },
      function error(err) {
        EndpointService.deleteEndpoint(endpointID)
        .then(function success() {
          $scope.state.error = 'Unable to connect to the Docker endpoint';
        });
      });
    },
    function error() {
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
    var TLS = $scope.formValues.TLS;
    var TLSCAFile = $scope.formValues.TLSCACert;
    var TLSCertFile = $scope.formValues.TLSCert;
    var TLSKeyFile = $scope.formValues.TLSKey;
    EndpointService.createRemoteEndpoint(name, URL, TLS, TLSCAFile, TLSCertFile, TLSKeyFile, TLS ? false : true)
    .then(function success(data) {
      console.log(JSON.stringify(data, null, 4));
      var endpointID = data.Id;
      EndpointProvider.setEndpointID(endpointID);
      StateManager.updateEndpointState(false)
      .then(function success() {
        $state.go('dashboard');
      }, function error(err) {
        EndpointService.deleteEndpoint(endpointID)
        .then(function success() {
          $('#initEndpointSpinner').hide();
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
