angular.module('createConfig', [])
.controller('CreateConfigController', ['$scope', '$state', 'Notifications', 'ConfigService',
function ($scope, $state, Notifications, ConfigService) {
  $scope.formValues = {
    Name: '',
    Data: '',
    Labels: []
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

  function prepareConfigData(config) {
    config.Data = btoa(unescape(encodeURIComponent($scope.formValues.Data)));
  }

  function prepareConfiguration() {
    var config = {};
    config.Name = $scope.formValues.Name;
    prepareConfigData(config);
    prepareLabelsConfig(config);
    return config;
  }

  function createConfig(config) {
    $('#createConfigSpinner').show();
    ConfigService.create(config)
    .then(function success(data) {
      Notifications.success('Config successfully created');
      $state.go('configs', {}, {reload: true});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create config');
    })
    .finally(function final() {
      $('#createConfigSpinner').hide();
    });
  }

  $scope.create = function () {
    var config = prepareConfiguration();
    createConfig(config);
  };
}]);
