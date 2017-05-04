angular.module('createVolume', [])
.controller('CreateVolumeController', ['$q', '$scope', '$state', 'VolumeService', 'InfoService', 'ResourceControlService', 'UserService', 'TeamService', 'Authentication', 'Notifications',
function ($q, $scope, $state, VolumeService, InfoService, ResourceControlService, UserService, TeamService, Authentication, Notifications) {

  $scope.formValues = {
    Ownership: $scope.applicationState.application.authentication ? 'private' : '',
    Ownership_Teams: [],
    Ownership_Users: [],
    Driver: 'local',
    DriverOptions: []
  };

  $scope.availableVolumeDrivers = [];
  $scope.teams = [];
  $scope.users = [];

  $scope.addDriverOption = function() {
    $scope.formValues.DriverOptions.push({ name: '', value: '' });
  };

  $scope.removeDriverOption = function(index) {
    $scope.formValues.DriverOptions.splice(index, 1);
  };

  function createResourceControl(userIDs, teamIDs, volumeIdentifier) {
    ResourceControlService.createResourceControl(userIDs, teamIDs, volumeIdentifier)
    .then(function success() {
      Notifications.success('Volume created', volumeIdentifier);
      $state.go('volumes', {}, {reload: true});
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to apply resource control on volume');
    });
  }

  $scope.create = function () {
    $('#createVolumeSpinner').show();

    var name = $scope.formValues.Name;
    var driver = $scope.formValues.Driver;
    var driverOptions = $scope.formValues.DriverOptions;
    var volumeConfiguration = VolumeService.createVolumeConfiguration(name, driver, driverOptions);

    VolumeService.createVolume(volumeConfiguration)
    .then(function success(data) {
      var volumeIdentifier = data.Name;

      if ($scope.formValues.Ownership === 'public') {
        Notifications.success('Volume created', volumeIdentifier);
        $state.go('volumes', {}, {reload: true});
        return;
      }

      var users = [];
      var teams = [];
      if ($scope.formValues.Ownership === 'private') {
        users.push(Authentication.getUserDetails().ID);
      } else if ($scope.formValues.Ownership === 'restricted') {
        angular.forEach($scope.formValues.Ownership_Users, function(user) {
          users.push(user.Id);
        });
        angular.forEach($scope.formValues.Ownership_Teams, function(team) {
          teams.push(team.Id);
        });
      }
      createResourceControl(users, teams, volumeIdentifier);
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
    var userDetails = Authentication.getUserDetails();
    var isAdmin = userDetails.role === 1 ? true: false;
    $scope.isAdmin = isAdmin;
    $q.all({
      drivers: InfoService.getVolumePlugins(),
      teams: UserService.userTeams(userDetails.ID),
      users: isAdmin ? UserService.users(false) : null
    })
    .then(function success(data) {
      $scope.availableVolumeDrivers = data.drivers;
      $scope.teams = data.teams;
      $scope.users = isAdmin ? data.users : [];
      if (data.teams.length === 1) {
        $scope.formValues.Ownership_Teams = data.teams;
      }
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to initialize volume creation view');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initView();
}]);
