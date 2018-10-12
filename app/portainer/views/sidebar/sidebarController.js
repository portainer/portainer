angular.module('portainer.app')
  .controller('SidebarController', ['$q', '$transitions', '$scope', 'StateManager', 'Notifications', 'Authentication', 'UserService', 'EndpointProvider',
    function ($q, $transitions, $scope, StateManager, Notifications, Authentication, UserService, EndpointProvider) {

      function checkPermissions(memberships) {
        var isLeader = false;
        angular.forEach(memberships, function (membership) {
          if (membership.Role === 1) {
            isLeader = true;
          }
        });
        $scope.isTeamLeader = isLeader;
      }

      $transitions.onSuccess({to: '**'}, function() {
        $scope.endpointStatus = EndpointProvider.endpointStatus();
      });

      function initView() {
        $scope.uiVersion = StateManager.getState().application.version;
        $scope.logo = StateManager.getState().application.logo;
        $scope.endpointStatus = EndpointProvider.endpointStatus();

        var authenticationEnabled = $scope.applicationState.application.authentication;
        if (authenticationEnabled) {
          var userDetails = Authentication.getUserDetails();
          var isAdmin = userDetails.role === 1;
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