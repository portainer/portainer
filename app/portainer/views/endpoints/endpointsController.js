angular.module('portainer.app')
.controller('EndpointsController', ['$scope', '$state', '$filter',  'EndpointService', 'Notifications',
function ($scope, $state, $filter, EndpointService, Notifications) {
  $scope.state = {
    uploadInProgress: false,
    actionInProgress: false
  };

  $scope.formValues = {
    Name: '',
    URL: '',
    PublicURL: '',
    SecurityFormData: new EndpointSecurityFormData()
  };

  $scope.addEndpoint = function() {
    var name = $scope.formValues.Name;
    var URL = $filter('stripprotocol')($scope.formValues.URL);
    var PublicURL = $scope.formValues.PublicURL;
    if (PublicURL === '') {
      PublicURL = URL.split(':')[0];
    }

    var securityData = $scope.formValues.SecurityFormData;
    var TLS = securityData.TLS;
    var TLSMode = securityData.TLSMode;
    var TLSSkipVerify = TLS && (TLSMode === 'tls_client_noca' || TLSMode === 'tls_only');
    var TLSSkipClientVerify = TLS && (TLSMode === 'tls_ca' || TLSMode === 'tls_only');
    var TLSCAFile = TLSSkipVerify ? null : securityData.TLSCACert;
    var TLSCertFile = TLSSkipClientVerify ? null : securityData.TLSCert;
    var TLSKeyFile = TLSSkipClientVerify ? null : securityData.TLSKey;

    $scope.state.actionInProgress = true;
    EndpointService.createRemoteEndpoint(name, URL, PublicURL, TLS, TLSSkipVerify, TLSSkipClientVerify, TLSCAFile, TLSCertFile, TLSKeyFile).then(function success(data) {
      Notifications.success('Endpoint created', name);
      $state.reload();
    }, function error(err) {
      $scope.state.uploadInProgress = false;
      $scope.state.actionInProgress = false;
      Notifications.error('Failure', err, 'Unable to create endpoint');
    }, function update(evt) {
      if (evt.upload) {
        $scope.state.uploadInProgress = evt.upload;
      }
    });
  };

  $scope.removeAction = function (selectedItems) {
    var actionCount = selectedItems.length;
    angular.forEach(selectedItems, function (endpoint) {
      EndpointService.deleteEndpoint(endpoint.Id)
      .then(function success() {
        Notifications.success('Endpoint successfully removed', endpoint.Name);
        var index = $scope.endpoints.indexOf(endpoint);
        $scope.endpoints.splice(index, 1);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to remove endpoint');
      })
      .finally(function final() {
        --actionCount;
        if (actionCount === 0) {
          $state.reload();
        }
      });
    });
  };

  function fetchEndpoints() {
    EndpointService.endpoints()
    .then(function success(data) {
      $scope.endpoints = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve endpoints');
      $scope.endpoints = [];
    });
  }

  fetchEndpoints();
}]);
