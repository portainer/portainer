angular.module('createVolume', [])
.controller('CreateVolumeController', ['$q', '$scope', '$state', 'VolumeService', 'InfoService', 'ResourceControlService', 'TeamService', 'Authentication', 'Notifications',
function ($q, $scope, $state, VolumeService, InfoService, ResourceControlService, TeamService, Authentication, Notifications) {

  $scope.formValues = {
    Ownership: $scope.applicationState.application.authentication ? 'private' : '',
    Ownership_Teams: [],
    Driver: 'local',
    DriverOptions: []
  };

  $scope.availableVolumeDrivers = [];
  $scope.teams = [];

  $scope.addDriverOption = function() {
    $scope.formValues.DriverOptions.push({ name: '', value: '' });
  };

  $scope.removeDriverOption = function(index) {
    $scope.formValues.DriverOptions.splice(index, 1);
  };

  $scope.create = function () {
    $('#createVolumeSpinner').show();

    var name = $scope.formValues.Name;
    var driver = $scope.formValues.Driver;
    var driverOptions = $scope.formValues.DriverOptions;
    var volumeConfiguration = VolumeService.createVolumeConfiguration(name, driver, driverOptions);

    VolumeService.createVolume(volumeConfiguration)
    .then(function success(data) {
      if ($scope.formValues.Ownership === 'private') {
        var users = [];
        users.push(Authentication.getUserDetails().ID);
        ResourceControlService.createResourceControl(users, [], data.Name)
        // ResourceControlService.setVolumeResourceControl(Authentication.getUserDetails().ID, data.Name)
        .then(function success() {
          Notifications.success("Volume created", data.Name);
          $state.go('volumes', {}, {reload: true});
        })
        .catch(function error(err) {
          Notifications.error("Failure", err, 'Unable to apply resource control on volume');
        });

      } else if ($scope.formValues.Ownership === 'team') {

        var teamIDs = [];
        angular.forEach($scope.formValues.Ownership_Teams, function(team) {
          teamIDs.push(team.Id);
        });

        ResourceControlService.createResourceControl([], teamIDs, data.Name)
        .then(function success() {
          Notifications.success("Volume created", data.Name);
          $state.go('volumes', {}, {reload: true});
        })
        .catch(function error(err) {
          Notifications.error("Failure", err, 'Unable to apply resource control on volume');
        });

      } else {
        Notifications.success("Volume created", data.Name);
        $state.go('volumes', {}, {reload: true});
      }
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create volume');
    })
    .finally(function final() {
      $('#createVolumeSpinner').hide();
    });
  };

  function initView() {
    $('#loadingViewSpinner').show();
    $q.all({
      drivers: InfoService.getVolumePlugins(),
      teams: TeamService.teamsByUserID(Authentication.getUserDetails().ID)
    })
    .then(function success(data) {
      $scope.availableVolumeDrivers = data.drivers;
      $scope.teams = data.teams;
      if (data.teams.length == 1) {
        $scope.formValues.Ownership_Teams = data.teams;
      }
    })
    .catch(function error(err) {
      Notifications.error("Failure", err, 'Unable to retrieve volume plugin information');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
