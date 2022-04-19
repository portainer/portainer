angular.module('portainer.app').controller('SidebarController', SidebarController);

function SidebarController($rootScope, $scope, $transitions, StateManager, Notifications, Authentication, UserService, EndpointProvider) {
  $scope.applicationState = StateManager.getState();
  $scope.endpointState = EndpointProvider.endpoint();
  $scope.display = !window.ddExtension;

  function checkPermissions(memberships) {
    var isLeader = false;
    angular.forEach(memberships, function (membership) {
      if (membership.Role === 1) {
        isLeader = true;
      }
    });
    $scope.isTeamLeader = isLeader;
  }

  function isClusterAdmin() {
    return Authentication.isAdmin();
  }

  async function initView() {
    $scope.uiVersion = StateManager.getState().application.version;
    $scope.logo = StateManager.getState().application.logo;

    $scope.endpointId = EndpointProvider.endpointID();
    $scope.showStacks = shouldShowStacks();

    const userDetails = Authentication.getUserDetails();
    const isAdmin = isClusterAdmin();
    $scope.isAdmin = isAdmin;

    if (!isAdmin) {
      try {
        const memberships = await UserService.userMemberships(userDetails.ID);
        checkPermissions(memberships);
      } catch (err) {
        Notifications.error('Failure', err, 'Unable to retrieve user memberships');
      }
    }
  }

  initView();

  function shouldShowStacks() {
    if (isClusterAdmin()) {
      return true;
    }

    const endpoint = EndpointProvider.currentEndpoint();
    if (!endpoint || !endpoint.SecuritySettings) {
      return false;
    }

    return endpoint.SecuritySettings.allowStackManagementForRegularUsers;
  }

  $transitions.onEnter({}, async () => {
    $scope.endpointId = EndpointProvider.endpointID();
    $scope.showStacks = shouldShowStacks();
    $scope.isAdmin = isClusterAdmin();

    if ($scope.applicationState.endpoint.name) {
      document.title = `${$rootScope.defaultTitle} | ${$scope.applicationState.endpoint.name}`;
    }
  });
}
