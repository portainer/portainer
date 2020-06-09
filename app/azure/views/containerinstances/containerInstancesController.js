angular.module('portainer.azure').controller('AzureContainerInstancesController', [
  '$scope',
  '$state',
  'AzureService',
  'Notifications',
  function ($scope, $state, AzureService, Notifications) {
    function initView() {
      AzureService.subscriptions()
        .then(function success(data) {
          var subscriptions = data;
          return AzureService.containerGroups(subscriptions);
        })
        .then(function success(data) {
          $scope.containerGroups = AzureService.aggregate(data);
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to load container groups');
        });
    }

    $scope.deleteAction = function (selectedItems) {
      var actionCount = selectedItems.length;
      angular.forEach(selectedItems, function (item) {
        AzureService.deleteContainerGroup(item.Id)
          .then(function success() {
            Notifications.success('Container group successfully removed', item.Name);
            var index = $scope.containerGroups.indexOf(item);
            $scope.containerGroups.splice(index, 1);
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to remove container group');
          })
          .finally(function final() {
            --actionCount;
            if (actionCount === 0) {
              $state.reload();
            }
          });
      });
    };

    initView();
  },
]);
