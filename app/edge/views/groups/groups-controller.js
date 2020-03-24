angular
  .module('portainer.edge')
  .controller('EdgeGroupsController', function EdgeGroupsController(
    Notifications,
    $state,
    $scope,
    EdgeGroupService
  ) {
    this.removeAction = removeAction.bind(this);

    this.$onInit = async function $onInit() {
      this.items = await EdgeGroupService.groups();
      $scope.$digest();
    };

    async function removeAction(selectedItems) {
      let actionCount = selectedItems.length;
      for (const item of selectedItems) {
        try {
          await EdgeGroupService.remove(item.Id);
          $scope.$digest();

          Notifications.success(
            'Edge Group successfully removed',
            item.Name
          );
          const index = this.items.indexOf(item);
          this.items.splice(index, 1);
        } catch (err) {
          Notifications.error(
            'Failure',
            err,
            'Unable to remove Edge Group'
          );
        } finally {
          actionCount--;
          if (actionCount === 0) {
            $state.reload();
          }
        }
      }
    }
  });
