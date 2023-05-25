import KubernetesNamespaceHelper from 'Kubernetes/helpers/namespaceHelper';
import { confirmDeleteAccess } from '@/react/kubernetes/cluster/RegistryAccessView/ConfirmDeleteAccess';

export default class KubernetesRegistryAccessController {
  /* @ngInject */
  constructor($async, $scope, $state, EndpointService, Notifications, RegistryService, KubernetesResourcePoolService) {
    this.$async = $async;
    this.$scope = $scope;
    this.$state = $state;
    this.Notifications = Notifications;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;
    this.RegistryService = RegistryService;
    this.EndpointService = EndpointService;

    this.state = {
      actionInProgress: false,
    };

    this.selectedResourcePools = [];
    this.resourcePools = [];
    this.savedResourcePools = [];

    this.handleRemove = this.handleRemove.bind(this);
    this.onChangeResourcePools = this.onChangeResourcePools.bind(this);
  }

  async submit() {
    return this.updateNamespaces([...this.savedResourcePools.map(({ value }) => value), ...this.selectedResourcePools]);
  }

  handleRemove(namespaces) {
    const removeNamespaces = namespaces.map(({ value }) => value);
    const nsToUpdate = this.savedResourcePools.map(({ value }) => value).filter((value) => !removeNamespaces.includes(value));

    confirmDeleteAccess().then((confirmed) => {
      if (confirmed) {
        return this.updateNamespaces(nsToUpdate);
      }
    });
  }

  updateNamespaces(namespaces) {
    return this.$async(async () => {
      try {
        await this.EndpointService.updateRegistryAccess(this.endpoint.Id, this.registry.Id, {
          namespaces,
        });
        this.$state.reload(this.$state.current);
        this.Notifications.success('Success', 'Registry access updated');
      } catch (err) {
        this.Notifications.error('Failure', err, 'Failed saving registry access');
      }
    });
  }

  onChangeResourcePools(resourcePools) {
    return this.$scope.$evalAsync(() => {
      this.selectedResourcePools = resourcePools;
    });
  }

  $onInit() {
    return this.$async(async () => {
      try {
        this.state = {
          registryId: this.$state.params.id,
        };
        this.registry = await this.RegistryService.registry(this.state.registryId, this.endpoint.Id);
        if (this.registry.RegistryAccesses && this.registry.RegistryAccesses[this.endpoint.Id]) {
          this.savedResourcePools = this.registry.RegistryAccesses[this.endpoint.Id].Namespaces.map((value) => ({ value }));
        }
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve registry details');
      }

      try {
        const resourcePools = await this.KubernetesResourcePoolService.get();

        this.resourcePools = resourcePools
          .filter((pool) => !KubernetesNamespaceHelper.isSystemNamespace(pool.Namespace.Name) && !this.savedResourcePools.find(({ value }) => value === pool.Namespace.Name))
          .map((pool) => ({ name: pool.Namespace.Name, id: pool.Namespace.Id }));
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve namespaces');
      }
    });
  }
}
