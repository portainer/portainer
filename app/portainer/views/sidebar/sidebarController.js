angular.module('portainer.app').controller('SidebarController', [
  '$q',
  '$scope',
  '$transitions',
  'StateManager',
  'Notifications',
  'Authentication',
  'UserService',
  'EndpointProvider',
  function ($q, $scope, $transitions, StateManager, Notifications, Authentication, UserService, EndpointProvider) {
    function checkPermissions(memberships) {
      var isLeader = false;
      angular.forEach(memberships, function (membership) {
        if (membership.Role === 1) {
          isLeader = true;
        }
      });
      $scope.isTeamLeader = isLeader;
    }

    async function initView() {
      $scope.uiVersion = StateManager.getState().application.version;
      $scope.logo = StateManager.getState().application.logo;
      $scope.showStacks = await shouldShowStacks();

      let userDetails = Authentication.getUserDetails();
      let isAdmin = Authentication.isAdmin();
      $scope.isAdmin = isAdmin;
      $scope.endpointId = EndpointProvider.endpointID();

      $q.when(!isAdmin ? UserService.userMemberships(userDetails.ID) : [])
        .then(function success(data) {
          checkPermissions(data);
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve user memberships');
        });

      $transitions.onEnter({}, () => {
        $scope.endpointId = EndpointProvider.endpointID();
      });
    }

    initView();

    async function shouldShowStacks() {
      const isAdmin = Authentication.isAdmin();
      const { allowStackManagementForRegularUsers } = $scope.applicationState.application;

      return isAdmin || allowStackManagementForRegularUsers;
    }

    $transitions.onEnter({}, async () => {
      $scope.showStacks = await shouldShowStacks();
    });
  },
]);
