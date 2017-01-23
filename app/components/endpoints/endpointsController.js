angular.module('endpoints', [])
.controller('EndpointsController', ['$scope', '$state', 'EndpointService', 'Settings', 'Messages', 'Pagination',
function ($scope, $state, EndpointService, Settings, Messages, Pagination) {
  $scope.state = {
    error: '',
    uploadInProgress: false,
    selectedItemCount: 0,
    pagination_count: Pagination.getPaginationCount('endpoints')
  };
  $scope.sortType = 'Name';
  $scope.sortReverse = true;

  $scope.formValues = {
    Name: '',
    URL: '',
    TLS: false,
    TLSCACert: null,
    TLSCert: null,
    TLSKey: null
  };

  $scope.order = function(sortType) {
    $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
    $scope.sortType = sortType;
  };

  $scope.changePaginationCount = function() {
    Pagination.setPaginationCount('endpoints', $scope.state.pagination_count);
  };

  $scope.selectItem = function (item) {
    if (item.Checked) {
      $scope.state.selectedItemCount++;
    } else {
      $scope.state.selectedItemCount--;
    }
  };

  $scope.addEndpoint = function() {
    $scope.state.error = '';
    var name = $scope.formValues.Name;
    var URL = $scope.formValues.URL;
    var TLS = $scope.formValues.TLS;
    var TLSCAFile = $scope.formValues.TLSCACert;
    var TLSCertFile = $scope.formValues.TLSCert;
    var TLSKeyFile = $scope.formValues.TLSKey;
    EndpointService.createRemoteEndpoint(name, URL, TLS, TLSCAFile, TLSCertFile, TLSKeyFile, false).then(function success(data) {
      Messages.send("Endpoint created", name);
      $state.reload();
    }, function error(err) {
      $scope.state.uploadInProgress = false;
      $scope.state.error = err.msg;
    }, function update(evt) {
      if (evt.upload) {
        $scope.state.uploadInProgress = evt.upload;
      }
    });
  };

  $scope.removeAction = function () {
    $('#loadEndpointsSpinner').show();
    var counter = 0;
    var complete = function () {
      counter = counter - 1;
      if (counter === 0) {
        $('#loadEndpointsSpinner').hide();
      }
    };
    angular.forEach($scope.endpoints, function (endpoint) {
      if (endpoint.Checked) {
        counter = counter + 1;
        EndpointService.deleteEndpoint(endpoint.Id).then(function success(data) {
          Messages.send("Endpoint deleted", endpoint.Name);
          var index = $scope.endpoints.indexOf(endpoint);
          $scope.endpoints.splice(index, 1);
          complete();
        }, function error(err) {
          Messages.error("Failure", err, 'Unable to remove endpoint');
          complete();
        });
      }
    });
  };

  function fetchEndpoints() {
    $('#loadEndpointsSpinner').show();
    EndpointService.endpoints().then(function success(data) {
      $scope.endpoints = data;
      EndpointService.getActive().then(function success(data) {
        $scope.activeEndpoint = data;
        $('#loadEndpointsSpinner').hide();
      }, function error(err) {
        $('#loadEndpointsSpinner').hide();
        Messages.error("Failure", err, "Unable to retrieve active endpoint");
      });
    }, function error(err) {
      $('#loadEndpointsSpinner').hide();
      Messages.error("Failure", err, "Unable to retrieve endpoints");
      $scope.endpoints = [];
    });
  }

  fetchEndpoints();
}]);
