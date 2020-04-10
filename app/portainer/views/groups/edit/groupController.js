angular.module('portainer.app').controller('GroupController', function GroupController($q, $async, $scope, $state, $transition$, GroupService, TagService, Notifications) {
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

  $scope.onCreateTag = function onCreateTag(tagName) {
    return $async(onCreateTagAsync, tagName);
  };

  async function onCreateTagAsync(tagName) {
    try {
      const tag = await TagService.createTag(tagName);
      $scope.availableTags = $scope.availableTags.concat(tag);
      $scope.group.TagIds = $scope.group.TagIds.concat(tag.Id);
    } catch (err) {
      Notifications.error('Failue', err, 'Unable to create tag');
    }
  }

  function initView() {
    var groupId = $transition$.params().id;

    $q.all({
      group: GroupService.group(groupId),
      tags: TagService.tags(),
    })
      .then(function success(data) {
        $scope.group = data.group;
        $scope.availableTags = data.tags;
        $scope.loaded = true;
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to load group details');
      });
  }

  initView();
});
