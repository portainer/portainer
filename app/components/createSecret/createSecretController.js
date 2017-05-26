angular.module('createSecret', [])
.controller('CreateSecretController', ['$scope', '$state', 'Notifications', 'Secret',
function ($scope, $state, Notifications, Secret) {
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

  function createSecret(config) {
    $('#createSecretSpinner').show();
    Secret.create(config, function (d) {
      if (d.message) {
        $('#createSecretSpinner').hide();
        Notifications.error('Unable to create secret', {}, d.message);
      } else {
        Notifications.success('Secret created', d.Id);
        $('#createSecretSpinner').hide();
        $state.go('secrets', {}, {reload: true});
      }
    }, function (e) {
      $('#createSecretSpinner').hide();
      Notifications.error('Failure', e, 'Unable to create secret');
    });
  }

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

  $scope.create = function () {
    var config = prepareConfiguration();
    createSecret(config);
  };
}]);
