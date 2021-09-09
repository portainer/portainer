import { PortainerEndpointCreationTypes } from 'Portainer/models/endpoint/models';

export default class WizardViewController {
  /* @ngInject */
  constructor($async, $state, EndpointService, $analytics) {
    this.$async = $async;
    this.$state = $state;
    this.EndpointService = EndpointService;
    this.$analytics = $analytics;
  }

  /**
   * WIZARD APPLICATION
   */
  manageLocalEndpoint() {
    this.$state.go('portainer.home');
  }

  addRemoteEndpoint() {
    this.$state.go('portainer.wizard.endpoints');
  }

  async createLocalKubernetesEndpoint() {
    this.state.endpoint.loading = true;
    try {
      await this.EndpointService.createLocalKubernetesEndpoint();
      this.state.endpoint.loading = false;
      this.state.endpoint.added = true;
      this.state.endpoint.connected = 'kubernetes';
      this.state.local.icon = 'fas fa-dharmachakra';
    } catch (err) {
      this.state.endpoint.kubernetesError = true;
    }
  }

  async createLocalDockerEndpoint() {
    try {
      await this.EndpointService.createLocalEndpoint();
      this.state.endpoint.loading = false;
      this.state.endpoint.added = true;
      this.state.endpoint.connected = 'docker';
      this.state.local.icon = 'fab fa-docker';
    } finally {
      this.state.endpoint.loading = false;
    }
  }

  $onInit() {
    return this.$async(async () => {
      this.state = {
        local: {
          icon: '',
        },
        remote: {
          icon: 'fa fa-plug',
        },
        endpoint: {
          kubernetesError: false,
          connected: '',
          loading: false,
          added: false,
        },
      };

      const endpoints = await this.EndpointService.endpoints();
      if (endpoints.totalCount === '0') {
        await this.createLocalKubernetesEndpoint();
        if (this.state.endpoint.kubernetesError) {
          await this.createLocalDockerEndpoint();
        }
      } else {
        const addedLocalEndpoint = endpoints.value[0];
        if (addedLocalEndpoint.Type === PortainerEndpointCreationTypes.LocalDockerEnvironment) {
          this.state.endpoint.added = true;
          this.state.endpoint.connected = 'docker';
          this.state.local.icon = 'fab fa-docker';
        }

        if (addedLocalEndpoint.Type === PortainerEndpointCreationTypes.LocalKubernetesEnvironment) {
          this.state.endpoint.added = true;
          this.state.endpoint.connected = 'kubernetes';
          this.state.local.icon = 'fas fa-dharmachakra';
        }
      }
    });
  }
}
