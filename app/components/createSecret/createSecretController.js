angular.module('createSecret', [])
.controller('CreateSecretController', ['$scope', '$state', 'Notifications', 'SecretService',
function ($scope, $state, Notifications, SecretService) {
  $scope.formValues = {
    Name: '',
    Data: '',
    Labels: [],
    encodeSecret: true
  };

  $scope.addLabel = function() {
    $scope.formValues.Labels.push({ name: '', value: ''});
  };

  $scope.removeLabel = function(index) {
    $scope.formValues.Labels.splice(index, 1);
  };

  function prepareLabelsConfig(config) {
    var labels = {};
    $scope.formValues.Labels.forEach(function (label) {
      if (label.name && label.value) {
          labels[label.name] = label.value;
      }
    });
    config.Labels = labels;
  }

  function prepareSecretData(config) {
    if ($scope.formValues.encodeSecret) {
      config.Data = btoa(unescape(encodeURIComponent($scope.formValues.Data)));
    } else {
      config.Data = $scope.formValues.Data;
    }
  }

  function prepareConfiguration() {
    var config = {};
    config.Name = $scope.formValues.Name;
    prepareSecretData(config);
    prepareLabelsConfig(config);
    return config;
  }

  function createSecret(config) {
    $('#createSecretSpinner').show();
    SecretService.create(config)
    .then(function success(data) {
      Notifications.success('Secret successfully created');
      $state.go('secrets', {}, {reload: true});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create secret');
    })
    .finally(function final() {
      $('#createSecretSpinner').hide();
    });
  }

  $scope.create = function () {
    var config = prepareConfiguration();
    createSecret(config);
  };
}]);
