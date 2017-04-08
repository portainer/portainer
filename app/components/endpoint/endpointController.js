angular.module('endpoint', [])
.controller('EndpointController', ['$scope', '$state', '$stateParams', '$filter', 'EndpointService', 'Messages',
function ($scope, $state, $stateParams, $filter, EndpointService, Messages) {

  if (!$scope.applicationState.application.endpointManagement) {
    $state.go('endpoints');
  }

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
    var endpointParams = {
      name: $scope.endpoint.Name,
      URL: $scope.endpoint.URL,
      TLS: $scope.endpoint.TLS,
      TLSCACert: $scope.formValues.TLSCACert !== $scope.endpoint.TLSCACert ? $scope.formValues.TLSCACert : null,
      TLSCert: $scope.formValues.TLSCert !== $scope.endpoint.TLSCert ? $scope.formValues.TLSCert : null,
      TLSKey: $scope.formValues.TLSKey !== $scope.endpoint.TLSKey ? $scope.formValues.TLSKey : null,
      type: $scope.endpointType
    };

    EndpointService.updateEndpoint(ID, endpointParams)
    .then(function success(data) {
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
