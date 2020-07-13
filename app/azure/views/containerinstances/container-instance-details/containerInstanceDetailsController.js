class ContainerInstanceDetailsController {
  /* @ngInject */
  constructor($state, AzureService, Notifications, ResourceGroupService) {
    Object.assign(this, { $state, AzureService, Notifications, ResourceGroupService });

    this.container = null;
    this.subscription = null;
    this.resourceGroup = null;
  }

  async $onInit() {
    const { id } = this.$state.params;
    const { subscriptionId, resourceGroupId } = parseId(id);
    try {
      const subscriptions = await this.AzureService.subscriptions();
      this.subscription = subscriptions.find((subscription) => subscription.Id === subscriptionId);

      const containerGroups = this.AzureService.aggregate(await this.AzureService.containerGroups(subscriptions));
      this.container = containerGroups.find((group) => group.Id === id);

      const resourceGroups = this.AzureService.aggregate(await this.ResourceGroupService.resourceGroups(subscriptionId));
      this.resourceGroup = resourceGroups.find((group) => group.Id.endsWith(resourceGroupId));
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrive container instance details');
    }
  }
}

function parseId(id) {
  const [, subscriptionId, resourceGroupId] = id.match(/^\/subscriptions\/(.+)\/resourceGroups\/(.+)\/providers\/.+$/);

  return { subscriptionId, resourceGroupId };
}

export default ContainerInstanceDetailsController;
