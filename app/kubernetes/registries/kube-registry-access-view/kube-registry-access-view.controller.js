export default class KubernetesRegistryAccessController {
  /* @ngInject */
  constructor($async, $state, EndpointService, Notifications, KubernetesResourcePoolService, KubernetesNamespaceHelper) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;
    this.KubernetesNamespaceHelper = KubernetesNamespaceHelper;
    this.EndpointService = EndpointService;

    this.state = {
      actionInProgress: false,
    };

    this.selectedResourcePools = [];
    this.resourcePools = [];
    this.savedResourcePools = [];

    this.handleRemove = this.handleRemove.bind(this);
  }

  async submit() {
    return this.updateNamespaces([...this.savedResourcePools.map(({ value }) => value), ...this.selectedResourcePools.map((pool) => pool.name)]);
  }

  handleRemove(namespaces) {
    const removeNamespaces = namespaces.map(({ value }) => value);

    return this.updateNamespaces(this.savedResourcePools.map(({ value }) => value).filter((value) => !removeNamespaces.includes(value)));
  }

  updateNamespaces(namespaces) {
    return this.$async(async () => {
      try {
        await this.EndpointService.updateRegistryAccess(this.endpoint.Id, this.registry.Id, {
          namespaces,
        });
        this.$state.reload();
      } catch (err) {
        this.Notifications.error('Failure', err, 'Failed saving registry access');
      }
    });
  }

  $onInit() {
    return this.$async(async () => {
      try {
        this.state = {
          registryId: this.$state.params.id,
        };
        this.registry = await this.EndpointService.registry(this.endpoint.Id, this.state.registryId);
        if (this.registry.RegistryAccesses && this.registry.RegistryAccesses[this.endpoint.Id]) {
          this.savedResourcePools = this.registry.RegistryAccesses[this.endpoint.Id].Namespaces.map((value) => ({ value }));
        }
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve registry details');
      }

      try {
        const resourcePools = await this.KubernetesResourcePoolService.get();

        this.resourcePools = resourcePools
          .filter((pool) => !this.KubernetesNamespaceHelper.isSystemNamespace(pool.Namespace.Name) && !this.savedResourcePools.find(({ value }) => value === pool.Namespace.Name))
          .map((pool) => ({ name: pool.Namespace.Name, id: pool.Namespace.Id }));
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to retrieve namespaces');
      }
    });
  }
}
