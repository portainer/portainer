angular.module('portainer')
.controller('porAccessControlFormController', ['$q', 'UserService', 'Notifications', 'Authentication',
function ($q, UserService, Notifications, Authentication) {
  var ctrl = this;

  ctrl.availableTeams = [];
  ctrl.availableUsers = [];

  function initComponent() {
    $('#loadingViewSpinner').show();

    var userDetails = Authentication.getUserDetails();
    var isAdmin = userDetails.role === 1 ? true: false;
    ctrl.isAdmin = isAdmin;

    if (isAdmin) {
      ctrl.formData.Ownership = 'administrators';
    }

    $q.all({
      availableTeams: UserService.userTeams(userDetails.ID),
      availableUsers: isAdmin ? UserService.users(false) : []
    })
    .then(function success(data) {
      ctrl.availableUsers = data.availableUsers;

      var availableTeams = data.availableTeams;
      ctrl.availableTeams = availableTeams;
      if (!isAdmin && availableTeams.length === 1) {
        ctrl.formData.AuthorizedTeams = availableTeams;
      }
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve access control information');
    })
    .finally(function final() {
      $('#loadingViewSpinner').hide();
    });
  }

  initComponent();
}]);
