import angular from 'angular';
import { KubernetesConfigurationFormValues } from 'Kubernetes/models/configuration/formvalues';
import { KubernetesResourcePoolFormValues } from 'Kubernetes/models/resource-pool/formValues';
import { KubernetesApplicationFormValues } from 'Kubernetes/models/application/formValues';
import { KubernetesResourceActions, KubernetesResourceTypes } from 'Kubernetes/models/resource-types/models';
import getApplicationResources from './resources/applicationResources';
import getNamespaceResources from './resources/namespaceResources';
import getConfigurationResources from './resources/configurationResources';

class KubernetesSummaryController {
  /* @ngInject */
  constructor($scope, LocalStorage, KubernetesResourcePoolService) {
    this.LocalStorage = LocalStorage;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;

    this.toggleSummary = this.toggleSummary.bind(this);
    this.generateResourceSummaryList = this.generateResourceSummaryList.bind(this);

    // Deep-watch changes on formValues property
    $scope.$watch(
      '$ctrl.formValues',
      (formValues) => {
        this.state.resources = this.generateResourceSummaryList(angular.copy(formValues));
      },
      true
    );
  }

  getArticle(resourceType, resourceAction) {
    let article = 'a';
    if (resourceAction === KubernetesResourceActions.CREATE) {
      if (resourceType === KubernetesResourceTypes.INGRESS) {
        article = 'an';
      }
    } else {
      article = 'the';
    }

    return article;
  }

  /**
   * toggleSummary toggles the summary panel state and persists it to browser localstorage
   */
  toggleSummary() {
    this.state.expandedTemplate = !this.state.expandedTemplate;
    this.LocalStorage.storeKubernetesSummaryToggle(this.state.expandedTemplate);
  }

  /**
   * generateResourceSummaryList maps formValues to custom object
   * @param {object} formValues
   * @returns {object} => { action: "string", kind: "string", name: "string" }
   */
  generateResourceSummaryList(formValues) {
    const oldFormValues = this.oldFormValues;

    if (formValues instanceof KubernetesConfigurationFormValues) {
      // Configuration
      return getConfigurationResources(formValues);
    } else if (formValues instanceof KubernetesResourcePoolFormValues) {
      // Namespaces
      return getNamespaceResources(formValues, oldFormValues);
    } else if (formValues instanceof KubernetesApplicationFormValues) {
      // Applications

      // extract cpu and memory requests & limits for pod
      this.state.limits = { cpu: formValues.CpuLimit, memory: formValues.MemoryLimit };

      return getApplicationResources(formValues, oldFormValues);
    }

    return [];
  }

  $onInit() {
    const toggleValue = this.LocalStorage.getKubernetesSummaryToggle();
    const expanded = typeof toggleValue === 'boolean' ? toggleValue : true;

    this.state = {
      expandedTemplate: expanded,
      resources: [],
      limits: { cpu: null, memory: null },
    };
  }
}

export default KubernetesSummaryController;
angular.module('portainer.kubernetes').controller('KubernetesSummaryController', KubernetesSummaryController);
