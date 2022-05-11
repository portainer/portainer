import { ResourceControlType } from '@/portainer/access-control/types';

class ContainerInstanceDetailsController {
  /* @ngInject */
  constructor($state, AzureService, ContainerGroupService, Notifications, ResourceGroupService, SubscriptionService) {
    Object.assign(this, { $state, AzureService, ContainerGroupService, Notifications, ResourceGroupService, SubscriptionService });

    this.state = {
      loading: false,
    };

    this.resourceType = ResourceControlType.ContainerGroup;

    this.container = null;
    this.subscription = null;
    this.resourceGroup = null;
    this.onUpdateSuccess = this.onUpdateSuccess.bind(this);
  }

  onUpdateSuccess() {
    this.$state.reload();
  }

  async $onInit() {
    this.state.loading = true;
    const { id } = this.$state.params;
    const { subscriptionId, resourceGroupId, containerGroupId } = parseId(id);
    try {
      this.subscription = await this.SubscriptionService.subscription(subscriptionId);
      this.container = await this.ContainerGroupService.containerGroup(subscriptionId, resourceGroupId, containerGroupId);
      this.resourceGroup = await this.ResourceGroupService.resourceGroup(subscriptionId, resourceGroupId);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve container instance details');
    }
    this.state.loading = false;
  }
}

function parseId(id) {
  const [, subscriptionId, resourceGroupId, , containerGroupId] = id.match(/^\/subscriptions\/(.+)\/resourceGroups\/(.+)\/providers\/(.+)\/containerGroups\/(.+)$/);

  return { subscriptionId, resourceGroupId, containerGroupId };
}

export default ContainerInstanceDetailsController;
