import _ from "lodash-es";
import angular from "angular";
import { InitEndpointFormValues } from "Portainer/models/formValues/initEndpointFormValues";

class InitEndpointController {
  /* @ngInject */
  constructor($async, $scope, $state, EndpointService, StateManager, Notifications) {
    this.$async = $async;
    this.$scope = $scope;
    this.$state = $state;
    this.EndpointService = EndpointService;
    this.StateManager = StateManager;
    this.Notifications = Notifications;

    this.onInit = this.onInit.bind(this);
  }

  async onInit() {
    if (!_.isEmpty(this.$scope.applicationState.endpoint)) {
      this.$state.go("portainer.home");
    }
    this.logo = this.StateManager.getState().application.logo;

    this.state = {
      uploadInProgress: false,
      actionInProgress: false
    };

    this.formValues = new InitEndpointFormValues();
  }

  $onInit() {
    return this.$async(this.onInit);
  }

  createLocalEndpoint() {
    this.state.actionInProgress = true;
    this.EndpointService.createLocalEndpoint()
      .then(function success() {
        this.$state.go("portainer.home");
      })
      .catch(function error(err) {
        this.Notifications.error("Failure", err, "Unable to connect to the Docker environment");
      })
      .finally(function final() {
        this.state.actionInProgress = false;
      });
  }

  createLocalKubernetesEndpoint() {
    this.state.actionInProgress = true;
    this.EndpointService.createLocalKubernetesEndpoint()
      .then(function success() {
        this.$state.go("portainer.home");
      })
      .catch(function error(err) {
        this.Notifications.error("Failure", err, "Unable to connect to the Kubernetes environment");
      })
      .finally(function final() {
        this.state.actionInProgress = false;
      });
  }

  createAzureEndpoint() {
    var name = this.formValues.Name;
    var applicationId = this.formValues.AzureApplicationId;
    var tenantId = this.formValues.AzureTenantId;
    var authenticationKey = this.formValues.AzureAuthenticationKey;

    this.createAzureEndpointAction(name, applicationId, tenantId, authenticationKey);
  }

  createAgentEndpoint() {
    var name = this.formValues.Name;
    var URL = this.formValues.URL;
    var PublicURL = URL.split(":")[0];

    this.createRemoteEndpoint(name, 2, URL, PublicURL, true, true, true, null, null, null);
  }

  createRemoteEndpoint() {
    var name = this.formValues.Name;
    var URL = this.formValues.URL;
    var PublicURL = URL.split(":")[0];
    var TLS = this.formValues.TLS;
    var TLSSkipVerify = TLS && this.formValues.TLSSkipVerify;
    var TLSSKipClientVerify = TLS && this.formValues.TLSSKipClientVerify;
    var TLSCAFile = TLSSkipVerify ? null : this.formValues.TLSCACert;
    var TLSCertFile = TLSSKipClientVerify ? null : this.formValues.TLSCert;
    var TLSKeyFile = TLSSKipClientVerify ? null : this.formValues.TLSKey;

    this.createRemoteEndpointAction(name, 1, URL, PublicURL, TLS, TLSSkipVerify, TLSSKipClientVerify, TLSCAFile, TLSCertFile, TLSKeyFile);
  }

  createAzureEndpointAction(name, applicationId, tenantId, authenticationKey) {
    this.state.actionInProgress = true;
    this.EndpointService.createAzureEndpoint(name, applicationId, tenantId, authenticationKey, 1, [])
      .then(function success() {
        this.$state.go("portainer.home");
      })
      .catch(function error(err) {
        this.Notifications.error("Failure", err, "Unable to connect to the Azure environment");
      })
      .finally(function final() {
        this.state.actionInProgress = false;
      });
  }

  createRemoteEndpointAction(name, type, URL, PublicURL, TLS, TLSSkipVerify, TLSSKipClientVerify, TLSCAFile, TLSCertFile, TLSKeyFile) {
    this.state.actionInProgress = true;
    this.EndpointService.createRemoteEndpoint(name, type, URL, PublicURL, 1, [], TLS, TLSSkipVerify, TLSSKipClientVerify, TLSCAFile, TLSCertFile, TLSKeyFile)
      .then(function success() {
        this.$state.go("portainer.home");
      })
      .catch(function error(err) {
        this.Notifications.error("Failure", err, "Unable to connect to the Docker environment");
      })
      .finally(function final() {
        this.state.actionInProgress = false;
      });
  }
}

export default InitEndpointController;
angular.module("portainer.app").controller("InitEndpointController", InitEndpointController);
