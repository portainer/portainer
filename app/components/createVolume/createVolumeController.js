angular.module('createVolume', [])
.controller('CreateVolumeController', ['$scope', '$state', 'Volume', 'ResourceControlService', 'Authentication', 'Messages',
function ($scope, $state, Volume, ResourceControlService, Authentication, Messages) {

  $scope.formValues = {
    Ownership: $scope.applicationState.application.authentication ? 'private' : '',
    DriverOptions: []
  };

  $scope.config = {
    Driver: 'local'
  };

  $scope.addDriverOption = function() {
    $scope.formValues.DriverOptions.push({ name: '', value: '' });
  };

  $scope.removeDriverOption = function(index) {
    $scope.formValues.DriverOptions.splice(index, 1);
  };

  function createVolume(config) {
    $('#createVolumeSpinner').show();
    Volume.create(config, function (d) {
      if (d.message) {
        $('#createVolumeSpinner').hide();
        Messages.error('Unable to create volume', {}, d.message);
      } else {
        if ($scope.formValues.Ownership === 'private') {
          ResourceControlService.setVolumeResourceControl(Authentication.getUserDetails().ID, d.Name)
          .then(function success() {
            Messages.send("Volume created", d.Name);
            $('#createVolumeSpinner').hide();
            $state.go('volumes', {}, {reload: true});
          })
          .catch(function error(err) {
            $('#createVolumeSpinner').hide();
            Messages.error("Failure", err, 'Unable to apply resource control on volume');
          });
        } else {
          Messages.send("Volume created", d.Name);
          $('#createVolumeSpinner').hide();
          $state.go('volumes', {}, {reload: true});
        }
      }
    }, function (e) {
      $('#createVolumeSpinner').hide();
      Messages.error("Failure", e, 'Unable to create volume');
    });
  }

  function prepareDriverOptions(config) {
    var options = {};
    $scope.formValues.DriverOptions.forEach(function (option) {
      options[option.name] = option.value;
    });
    config.DriverOpts = options;
  }

  function prepareConfiguration() {
    var config = angular.copy($scope.config);
    prepareDriverOptions(config);
    return config;
  }

  $scope.create = function () {
    var config = prepareConfiguration();
    createVolume(config);
  };
}]);
