import angular from 'angular';
import { confirm } from '@@/modals/confirm';
import { ModalType } from '@@/modals';
import { buildConfirmButton } from '@@/modals/utils';

class KubernetesResourcePoolsController {
  /* @ngInject */
  constructor($async, $state, Notifications, KubernetesResourcePoolService, KubernetesNamespaceService) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;
    this.KubernetesNamespaceService = KubernetesNamespaceService;

    this.onInit = this.onInit.bind(this);
    this.getResourcePools = this.getResourcePools.bind(this);
    this.getResourcePoolsAsync = this.getResourcePoolsAsync.bind(this);
    this.removeAction = this.removeAction.bind(this);
    this.removeActionAsync = this.removeActionAsync.bind(this);
    this.onReload = this.onReload.bind(this);
  }

  async onReload() {
    this.$state.reload(this.$state.current);
  }

  async removeActionAsync(selectedItems) {
    let actionCount = selectedItems.length;
    for (const pool of selectedItems) {
      try {
        const isTerminating = pool.Namespace.Status === 'Terminating';
        if (isTerminating) {
          const ns = await this.KubernetesNamespaceService.getJSONAsync(pool.Namespace.Name);
          ns.$promise.then(async (namespace) => {
            const n = JSON.parse(namespace.data);
            if (n.spec && n.spec.finalizers) {
              delete n.spec.finalizers;
            }
            await this.KubernetesNamespaceService.updateFinalizeAsync(n);
          });
        } else {
          await this.KubernetesResourcePoolService.delete(pool);
        }
        this.Notifications.success('Namespace successfully removed', pool.Namespace.Name);
        const index = this.resourcePools.indexOf(pool);
        this.resourcePools.splice(index, 1);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to remove namespace');
      } finally {
        --actionCount;
        if (actionCount === 0) {
          this.$state.reload(this.$state.current);
        }
      }
    }
  }

  removeAction(selectedItems) {
    const isTerminatingNS = selectedItems.some((pool) => pool.Namespace.Status === 'Terminating');
    const message = isTerminatingNS
      ? 'At least one namespace is in a terminating state. For terminating state namespaces, you may continue and force removal, but doing so without having properly cleaned up may lead to unstable and unpredictable behavior. Are you sure you wish to proceed?'
      : 'Do you want to remove the selected namespace(s)? All the resources associated to the selected namespace(s) will be removed too. Are you sure you wish to proceed?';
    confirm({
      title: isTerminatingNS ? 'Force namespace removal' : 'Are you sure?',
      message,
      confirmButton: buildConfirmButton('Remove', 'danger'),

      modalType: ModalType.Destructive,
    }).then((confirmed) => {
      if (confirmed) {
        return this.$async(this.removeActionAsync, selectedItems);
      }
    });
  }

  async getResourcePoolsAsync() {
    try {
      this.resourcePools = await this.KubernetesResourcePoolService.get('', { getQuota: true });
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retreive namespaces');
    }
  }

  getResourcePools() {
    return this.$async(this.getResourcePoolsAsync);
  }

  async onInit() {
    this.state = {
      viewReady: false,
    };

    await this.getResourcePools();

    this.state.viewReady = true;
  }

  $onInit() {
    return this.$async(this.onInit);
  }
}

export default KubernetesResourcePoolsController;
angular.module('portainer.kubernetes').controller('KubernetesResourcePoolsController', KubernetesResourcePoolsController);
