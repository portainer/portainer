angular.module('orca', [])
.controller('OrcaController', ['$q', '$scope', '$location', '$sce', 'SystemService', 'NodeService', 'Pagination', 'Notifications', 'StateManager', 'Authentication',
function ($q, $scope, $location, $sce, SystemService, NodeService, Pagination, Notifications, StateManager, Authentication) {
  $scope.state = {};
  $scope.info = {};

  $scope.trustSrc = function(src) {
    return $sce.trustAsResourceUrl(src);
  }

  $scope.orca = {url:$location.protocol() + '://' + $location.host() + ':20000'};

  function initView() {
    $('#loadingViewSpinner').show();

    if (StateManager.getState().application.authentication) {
      var userDetails = Authentication.getUserDetails();
      var isAdmin = userDetails.role === 1 ? true: false;
      $scope.isAdmin = isAdmin;
    }

    $('#loadingViewSpinner').hide();
  }

  initView();
}]);