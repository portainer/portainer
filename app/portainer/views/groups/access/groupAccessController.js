angular.module('portainer.app')
.controller('GroupAccessController', ['$scope', '$transition$', 'GroupService', 'Notifications',
function ($scope, $transition$, GroupService, Notifications) {

  $scope.updateAccess = function(authorizedUsers, authorizedTeams) {
    return GroupService.updateAccess($transition$.params().id, authorizedUsers, authorizedTeams);
  };

  function initView() {
    var groupId = $transition$.params().id;

    GroupService.group(groupId)
    .then(function success(data) {
      $scope.group = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to load view');
    });
  }

  initView();
}]);
