import _ from 'lodash-es';
import angular from 'angular';
import { PortainerEndpointInitFormValues, PortainerEndpointInitFormValueEndpointSections } from 'Portainer/models/endpoint/formValues';
import { PortainerEndpointTypes, PortainerEndpointConnectionTypes } from 'Portainer/models/endpoint/models';

require('./includes/localDocker.html');
require('./includes/localKubernetes.html');
require('./includes/remote.html');
require('./includes/azure.html');
require('./includes/agent.html');

class InitEndpointController {
  /* @ngInject */
  constructor($async, $scope, $state, EndpointService, EndpointProvider, StateManager, Notifications) {
    this.$async = $async;
    this.$scope = $scope;
    this.$state = $state;
    this.EndpointService = EndpointService;
    this.EndpointProvider = EndpointProvider;
    this.StateManager = StateManager;
    this.Notifications = Notifications;

    this.createLocalEndpointAsync = this.createLocalEndpointAsync.bind(this);
    this.createLocalKubernetesEndpointAsync = this.createLocalKubernetesEndpointAsync.bind(this);
    this.createAgentEndpointAsync = this.createAgentEndpointAsync.bind(this);
    this.createAzureEndpointAsync = this.createAzureEndpointAsync.bind(this);
    this.createRemoteEndpointAsync = this.createRemoteEndpointAsync.bind(this);
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

  isRemoteConnectButtonDisabled() {
    return (
      this.state.actionInProgress ||
      !this.formValues.Name ||
      !this.formValues.URL ||
      (this.formValues.TLS &&
        ((this.formValues.TLSVerify && !this.formValues.TLSCACert) || (!this.formValues.TLSSKipClientVerify && (!this.formValues.TLSCert || !this.formValues.TLSKey))))
    );
  }

  isAzureConnectButtonDisabled() {
    return this.state.actionInProgress || !this.formValues.Name || !this.formValues.AzureApplicationId || !this.formValues.AzureTenantId || !this.formValues.AzureAuthenticationKey;
  }

  isConnectButtonDisabled() {
    switch (this.formValues.ConnectionType) {
      case PortainerEndpointConnectionTypes.DOCKER_LOCAL:
        return this.state.actionInProgress;
      case PortainerEndpointConnectionTypes.KUBERNETES_LOCAL:
        return this.state.actionInProgress;
      case PortainerEndpointConnectionTypes.REMOTE:
        return this.isRemoteConnectButtonDisabled();
      case PortainerEndpointConnectionTypes.AZURE:
        return this.isAzureConnectButtonDisabled();
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
      case PortainerEndpointConnectionTypes.REMOTE:
        return this.createRemoteEndpoint();
      case PortainerEndpointConnectionTypes.AZURE:
        return this.createAzureEndpoint();
      case PortainerEndpointConnectionTypes.AGENT:
        return this.createAgentEndpoint();
      default:
        this.Notifications.error('Failure', 'Unable to determine wich action to do');
    }
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
      this.$state.go('portainer.endpoints.endpoint.kubernetesConfig', { id: endpoint.Id });
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
      // TODO: k8s merge - change type ID for agent on kube (6) or agent on swarm (2)
      const endpoint = await this.EndpointService.createRemoteEndpoint(
        name,
        PortainerEndpointTypes.AgentOnKubernetesEnvironment,
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
      // TODO: k8s merge - go on home whith agent on swarm (2)
      this.$state.go('portainer.endpoints.endpoint.kubernetesConfig', { id: endpoint.Id });
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to connect to the Docker environment');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  createAgentEndpoint() {
    return this.$async(this.createAgentEndpointAsync);
  }

  /**
   * DOCKER REMOTE (1)
   */
  async createRemoteEndpointAsync() {
    try {
      this.state.actionInProgress = true;
      const name = this.formValues.Name;
      const type = PortainerEndpointTypes.DockerEnvironment;
      const URL = this.formValues.URL;
      const PublicURL = URL.split(':')[0];
      const TLS = this.formValues.TLS;
      const TLSSkipVerify = TLS && this.formValues.TLSSkipVerify;
      const TLSSKipClientVerify = TLS && this.formValues.TLSSKipClientVerify;
      const TLSCAFile = TLSSkipVerify ? null : this.formValues.TLSCACert;
      const TLSCertFile = TLSSKipClientVerify ? null : this.formValues.TLSCert;
      const TLSKeyFile = TLSSKipClientVerify ? null : this.formValues.TLSKey;
      await this.EndpointService.createRemoteEndpoint(name, type, URL, PublicURL, 1, [], TLS, TLSSkipVerify, TLSSKipClientVerify, TLSCAFile, TLSCertFile, TLSKeyFile);
      this.$state.go('portainer.home');
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to connect to the Docker environment');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  createRemoteEndpoint() {
    return this.$async(this.createAgentEndpointAsync);
  }

  /**
   * AZURE (4)
   */
  async createAzureEndpointAsync() {
    try {
      this.state.actionInProgress = true;
      var name = this.formValues.Name;
      var applicationId = this.formValues.AzureApplicationId;
      var tenantId = this.formValues.AzureTenantId;
      var authenticationKey = this.formValues.AzureAuthenticationKey;
      await this.EndpointService.createAzureEndpoint(name, applicationId, tenantId, authenticationKey, 1, []);
      this.$state.go('portainer.home');
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to connect to the Azure environment');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  createAzureEndpoint() {
    return this.$async(this.createAgentEndpointAsync);
  }
}

export default InitEndpointController;
angular.module('portainer.app').controller('InitEndpointController', InitEndpointController);
