angular.module('portainer.app')
  .controller('SidebarController', ['$q', '$scope', 'StateManager', 'Notifications', 'Authentication', 'UserService',
    function ($q, $scope, StateManager, Notifications, Authentication, UserService) {

      function checkPermissions(memberships) {
        var isLeader = false;
        angular.forEach(memberships, function (membership) {
          if (membership.Role === 1) {
            isLeader = true;
          }
        });
        $scope.isTeamLeader = isLeader;
      }

      function initView() {
        $scope.uiVersion = StateManager.getState().application.version;
        $scope.logo = StateManager.getState().application.logo;

        var authenticationEnabled = $scope.applicationState.application.authentication;
        if (authenticationEnabled) {
          let userDetails = Authentication.getUserDetails();
          let isAdmin = Authentication.isAdmin();
          $scope.isAdmin = isAdmin;

          $q.when(!isAdmin ? UserService.userMemberships(userDetails.ID) : [])
            .then(function success(data) {
              checkPermissions(data);
            })
            .catch(function error(err) {
              Notifications.error('Failure', err, 'Unable to retrieve user memberships');
            });
        }
      }

      initView();
    }
  ]);