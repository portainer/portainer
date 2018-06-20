angular.module('portainer.app')
.controller('GroupsController', ['$scope', '$state', '$filter',  'GroupService', 'Notifications',
function ($scope, $state, $filter, GroupService, Notifications) {

  $scope.removeAction = function (selectedItems) {
    var actionCount = selectedItems.length;
    angular.forEach(selectedItems, function (group) {
      GroupService.deleteGroup(group.Id)
      .then(function success() {
        Notifications.success('Endpoint group successfully removed', group.Name);
        var index = $scope.groups.indexOf(group);
        $scope.groups.splice(index, 1);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to remove group');
      })
      .finally(function final() {
        --actionCount;
        if (actionCount === 0) {
          $state.reload();
        }
      });
    });
  };

  function initView() {
    GroupService.groups()
    .then(function success(data) {
      $scope.groups = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve endpoint groups');
      $scope.groups = [];
    });
  }

  initView();
}]);
