angular.module('portainer.app')
.controller('TagsController', ['$scope', '$state', 'TagService', 'Notifications',
function ($scope, $state, TagService, Notifications) {

  $scope.state = {
    actionInProgress: false
  };

  $scope.formValues = {
    Name: ''
  };

  $scope.removeAction = function (selectedItems) {
    var actionCount = selectedItems.length;
    angular.forEach(selectedItems, function (tag) {
      TagService.deleteTag(tag.Id)
      .then(function success() {
        Notifications.success('Tag successfully removed', tag.Name);
        var index = $scope.tags.indexOf(tag);
        $scope.tags.splice(index, 1);
      })
      .catch(function error(err) {
        Notifications.error('Failure', err, 'Unable to tag');
      })
      .finally(function final() {
        --actionCount;
        if (actionCount === 0) {
          $state.reload();
        }
      });
    });
  };

  $scope.createTag = function() {
    var tagName = $scope.formValues.Name;
    TagService.createTag(tagName)
    .then(function success(data) {
      Notifications.success('Tag successfully created', tagName);
      $state.reload();
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to create tag');
    });
  };

  function initView() {
    TagService.tags()
    .then(function success(data) {
      $scope.tags = data;
    })
    .catch(function error(err) {
      Notifications.error('Failure', err, 'Unable to retrieve tags');
      $scope.tags = [];
    });
  }

  initView();
}]);
