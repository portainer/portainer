angular.module('endpoint', [])
.controller('EndpointController', ['$scope', '$state', '$stateParams', '$filter', 'EndpointService', 'Messages',
function ($scope, $state, $stateParams, $filter, EndpointService, Messages) {
  $scope.state = {
    error: '',
    uploadInProgress: false
  };
  $scope.formValues = {
    TLSCACert: null,
    TLSCert: null,
    TLSKey: null
  };

  $scope.updateEndpoint = function() {
    var ID = $scope.endpoint.Id;
    var name = $scope.endpoint.Name;
    var URL = $scope.endpoint.URL;
    var TLS = $scope.endpoint.TLS;
    var TLSCACert = $scope.formValues.TLSCACert !== $scope.endpoint.TLSCACert ? $scope.formValues.TLSCACert : null;
    var TLSCert = $scope.formValues.TLSCert !== $scope.endpoint.TLSCert ? $scope.formValues.TLSCert : null;
    var TLSKey = $scope.formValues.TLSKey !== $scope.endpoint.TLSKey ? $scope.formValues.TLSKey : null;
    EndpointService.updateEndpoint(ID, name, URL, TLS, TLSCACert, TLSCert, TLSKey).then(function success(data) {
      Messages.send("Endpoint updated", $scope.endpoint.Name);
      $state.go('endpoints');
    }, function error(err) {
      $scope.state.error = err.msg;
    }, function update(evt) {
      if (evt.upload) {
        $scope.state.uploadInProgress = evt.upload;
      }
    });
  };

  function getEndpoint(endpointID) {
    $('#loadingViewSpinner').show();
    EndpointService.endpoint($stateParams.id).then(function success(data) {
      $('#loadingViewSpinner').hide();
      $scope.endpoint = data;
      if (data.URL.indexOf("unix://") === 0) {
        $scope.endpointType = 'local';
      } else {
        $scope.endpointType = 'remote';
      }
      $scope.endpoint.URL = $filter('stripprotocol')(data.URL);
      $scope.formValues.TLSCACert = data.TLSCACert;
      $scope.formValues.TLSCert = data.TLSCert;
      $scope.formValues.TLSKey = data.TLSKey;
    }, function error(err) {
      $('#loadingViewSpinner').hide();
      Messages.error("Failure", err, "Unable to retrieve endpoint details");
    });
  }

  getEndpoint($stateParams.id);
}]);
