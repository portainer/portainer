angular.module('createRegistry', [])
.controller('CreateRegistryController', ['$scope', '$state', 'RegistryService', 'Notifications',
function ($scope, $state, RegistryService, Notifications) {

  $scope.formValues = {
    Name: '',
    URL: '',
    Authentication: false,
    Username: '',
    Password: ''
  };

  $scope.addRegistry = function() {
    $('#createRegistrySpinner').show();
    var registryName = $scope.formValues.Name;
    var registryURL = $scope.formValues.URL.replace(/^https?\:\/\//i, '');
    var authentication = $scope.formValues.Authentication;
    var username = $scope.formValues.Username;
    var password = $scope.formValues.Password;
    RegistryService.createRegistry(registryName, registryURL, authentication, username, password)
    .then(function success(data) {
      Notifications.success('Registry successfully created');
      $state.go('registries');
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create registry');
    })
    .finally(function final() {
      $('#createRegistrySpinner').hide();
    });
  };
}]);
