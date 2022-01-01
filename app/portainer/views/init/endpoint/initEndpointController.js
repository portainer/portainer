import _ from 'lodash-es';
import angular from 'angular';
import { PortainerEndpointInitFormValueEndpointSections, PortainerEndpointInitFormValues } from 'Portainer/models/endpoint/formValues';
import { PortainerEndpointConnectionTypes, PortainerEndpointCreationTypes, PortainerEndpointTypes } from 'Portainer/models/endpoint/models';

require('./includes/localDocker.html');
require('./includes/localKubernetes.html');
require('./includes/agent.html');

class InitEndpointController {
  /* @ngInject */
  constructor($async, $scope, $state, EndpointService, StateManager, Notifications) {
    this.$async = $async;
    this.$scope = $scope;
    this.$state = $state;
    this.EndpointService = EndpointService;
    this.StateManager = StateManager;
    this.Notifications = Notifications;

    this.createLocalEndpointAsync = this.createLocalEndpointAsync.bind(this);
    this.createLocalKubernetesEndpointAsync = this.createLocalKubernetesEndpointAsync.bind(this);
    this.createAgentEndpointAsync = this.createAgentEndpointAsync.bind(this);
  }

  $onInit() {
    if (!_.isEmpty(this.$scope.applicationState.endpoint)) {
      this.$state.go('portainer.home');
    }
    this.logo = this.StateManager.getState().application.logo;

    this.state = {
      uploadInProgress: false,
      actionInProgress: false,
    };

    this.formValues = new PortainerEndpointInitFormValues();
    this.endpointSections = PortainerEndpointInitFormValueEndpointSections;
    this.PortainerEndpointConnectionTypes = PortainerEndpointConnectionTypes;
  }

  isConnectButtonDisabled() {
    switch (this.formValues.ConnectionType) {
      case PortainerEndpointConnectionTypes.DOCKER_LOCAL:
        return this.state.actionInProgress;
      case PortainerEndpointConnectionTypes.KUBERNETES_LOCAL:
        return this.state.actionInProgress;
      case PortainerEndpointConnectionTypes.AGENT:
        return this.state.actionInProgress || !this.formValues.Name || !this.formValues.URL;
      default:
        break;
    }
  }

  createEndpoint() {
    switch (this.formValues.ConnectionType) {
      case PortainerEndpointConnectionTypes.DOCKER_LOCAL:
        return this.createLocalEndpoint();
      case PortainerEndpointConnectionTypes.KUBERNETES_LOCAL:
        return this.createLocalKubernetesEndpoint();
      case PortainerEndpointConnectionTypes.AGENT:
        return this.createAgentEndpoint();
      default:
        this.Notifications.error('Failure', null, 'Unable to determine which action to do to create environment');
    }
  }

  skipEndpointCreation() {
    this.$state.go('portainer.home');
  }

  /**
   * DOCKER_LOCAL (1)
   */
  async createLocalEndpointAsync() {
    try {
      this.state.actionInProgress = true;
      await this.EndpointService.createLocalEndpoint();
      this.$state.go('portainer.home');
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to connect to the Docker environment');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  createLocalEndpoint() {
    return this.$async(this.createLocalEndpointAsync);
  }

  /**
   * KUBERNETES_LOCAL (5)
   */
  async createLocalKubernetesEndpointAsync() {
    try {
      this.state.actionInProgress = true;
      const endpoint = await this.EndpointService.createLocalKubernetesEndpoint();
      this.$state.go('portainer.k8sendpoint.kubernetesConfig', { id: endpoint.Id });
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to connect to the Kubernetes environment');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  createLocalKubernetesEndpoint() {
    return this.$async(this.createLocalKubernetesEndpointAsync);
  }

  /**
   * DOCKER / KUBERNETES AGENT (2 / 6)
   */
  async createAgentEndpointAsync() {
    try {
      this.state.actionInProgress = true;
      const name = this.formValues.Name;
      const URL = this.formValues.URL;
      const PublicURL = URL.split(':')[0];

      const endpoint = await this.EndpointService.createRemoteEndpoint(
        name,
        PortainerEndpointCreationTypes.AgentEnvironment,
        URL,
        PublicURL,
        1,
        [],
        true,
        true,
        true,
        null,
        null,
        null
      );
      const routeName = endpoint.Type === PortainerEndpointTypes.AgentOnKubernetesEnvironment ? 'portainer.k8sendpoint.kubernetesConfig' : 'portainer.home';
      this.$state.go(routeName, { id: endpoint.Id });
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to connect to the Docker environment');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  createAgentEndpoint() {
    return this.$async(this.createAgentEndpointAsync);
  }
}

export default InitEndpointController;
angular.module('portainer.app').controller('InitEndpointController', InitEndpointController);
