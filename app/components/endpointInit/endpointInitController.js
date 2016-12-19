angular.module('endpointInit', [])
.controller('EndpointInitController', ['$scope',
function ($scope) {
  $scope.formValues = {
    endpointType: "remote",
    TLS: false,
    TLSCACert: null,
    TLSCert: null,
    TLSKey: null
  };
}]);
