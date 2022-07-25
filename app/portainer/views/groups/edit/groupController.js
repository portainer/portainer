angular.module('portainer.app').controller('GroupController', function GroupController($q, $scope, $state, $transition$, GroupService, Notifications) {
  $scope.state = {
    actionInProgress: false,
  };

  $scope.update = function () {
    var model = $scope.group;

    $scope.state.actionInProgress = true;
    GroupService.updateGroup(model)
      .then(function success() {
        Notifications.success('Group successfully updated');
        $state.go('portainer.groups', {}, { reload: true });
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to update group');
      })
      .finally(function final() {
        $scope.state.actionInProgress = false;
      });
  };

  function initView() {
    var groupId = $transition$.params().id;

    $q.all({
      group: GroupService.group(groupId),
    })
      .then(function success(data) {
        $scope.group = data.group;
        $scope.loaded = true;
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to load group details');
      });
  }

  initView();
});
