angular.module('endpoints', [])
.controller('EndpointsController', ['$scope', '$state', '$filter',  'EndpointService', 'EndpointProvider', 'Notifications', 'PaginationService',
function ($scope, $state, $filter, EndpointService, EndpointProvider, Notifications, PaginationService) {
  $scope.state = {
    uploadInProgress: false,
    // selectedItemCount: 0,
    // pagination_count: Pagination.getPaginationCount('endpoints'),
    deploymentInProgress: false
  };
  // $scope.sortType = 'Name';
  // $scope.sortReverse = true;

  $scope.formValues = {
    Name: '',
    URL: '',
    PublicURL: '',
    SecurityFormData: new EndpointSecurityFormData()
  };

  // $scope.renderFieldActions = function(item, value) {
  //   console.log(JSON.stringify(item, null, 4));
  //   return '<a ui-sref="endpoint.access({id:' + item.Id + '})"><i class="fa fa-users" aria-hidden="true" style="margin-left: 7px;"></i> Manage access</a>';
  // };

  // $scope.order = function(sortType) {
  //   $scope.sortReverse = ($scope.sortType === sortType) ? !$scope.sortReverse : false;
  //   $scope.sortType = sortType;
  // };
  //
  // $scope.changePaginationCount = function() {
  //   PaginationService.setPaginationCount('endpoints', $scope.state.pagination_count);
  // };
  //
  // $scope.selectItems = function (allSelected) {
  //   angular.forEach($scope.state.filteredEndpoints, function (endpoint) {
  //     if (endpoint.Checked !== allSelected) {
  //       endpoint.Checked = allSelected;
  //       $scope.selectItem(endpoint);
  //     }
  //   });
  // };
  //
  // $scope.selectItem = function (item) {
  //   if (item.Checked) {
  //     $scope.state.selectedItemCount++;
  //   } else {
  //     $scope.state.selectedItemCount--;
  //   }
  // };

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

    $scope.state.deploymentInProgress = true;
    EndpointService.createRemoteEndpoint(name, URL, PublicURL, TLS, TLSSkipVerify, TLSSkipClientVerify, TLSCAFile, TLSCertFile, TLSKeyFile).then(function success(data) {
      Notifications.success('Endpoint created', name);
      $state.reload();
    }, function error(err) {
      $scope.state.uploadInProgress = false;
      $scope.state.deploymentInProgress = false;
      Notifications.error('Failure', err, 'Unable to create endpoint');
    }, function update(evt) {
      if (evt.upload) {
        $scope.state.uploadInProgress = evt.upload;
      }
    });
  };

  $scope.removeAction = function () {
    angular.forEach($scope.endpoints, function (endpoint) {
      if (endpoint.Checked) {
        EndpointService.deleteEndpoint(endpoint.Id).then(function success(data) {
          Notifications.success('Endpoint deleted', endpoint.Name);
          var index = $scope.endpoints.indexOf(endpoint);
          $scope.endpoints.splice(index, 1);
        }, function error(err) {
          Notifications.error('Failure', err, 'Unable to remove endpoint');
        });
      }
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
