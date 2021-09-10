export default class WizardEndpointsController {
  /* @ngInject */
  constructor($async, $scope, $state, EndpointService, $analytics) {
    this.$async = $async;
    this.$scope = $scope;
    this.$state = $state;
    this.EndpointService = EndpointService;
    this.$analytics = $analytics;

    this.updateEndpoint = this.updateEndpoint.bind(this);
    this.addAnalytics = this.addAnalytics.bind(this);
  }
  /**
   * WIZARD ENDPOINT SECTION
   */

  async updateEndpoint() {
    const updateEndpoints = await this.EndpointService.endpoints();
    this.endpoints = updateEndpoints.value;
  }

  startWizard() {
    const options = this.state.options;
    this.state.selections = options.filter((item) => item.selected === true);
    this.state.maxStep = this.state.selections.length;

    if (this.state.selections.length !== 0) {
      this.state.section = this.state.selections[this.state.currentStep].endpoint;
      this.state.selections[this.state.currentStep].stage = 'active';
    }

    if (this.state.currentStep === this.state.maxStep - 1) {
      this.state.nextStep = 'Finish';
    }

    this.$analytics.eventTrack('endpoint-wizard-endpoint-select', {
      category: 'portainer',
      metadata: {
        environment: this.state.analytics.docker + this.state.analytics.kubernetes + this.state.analytics.aci,
      },
    });
    this.state.currentStep++;
  }

  previousStep() {
    this.state.section = this.state.selections[this.state.currentStep - 2].endpoint;
    this.state.selections[this.state.currentStep - 2].stage = 'active';
    this.state.selections[this.state.currentStep - 1].stage = '';
    this.state.nextStep = 'Next Step';
    this.state.currentStep--;
  }

  async nextStep() {
    if (this.state.currentStep >= this.state.maxStep - 1) {
      this.state.nextStep = 'Finish';
    }
    if (this.state.currentStep === this.state.maxStep) {
      // the Local Endpoint Counter from endpoints array due to including Local Endpoint been added Automatic before Wizard start
      const endpointsAdded = await this.EndpointService.endpoints();
      const endpointsArray = endpointsAdded.value;
      const filter = endpointsArray.filter((item) => item.Type === 1 || item.Type === 5);
      // NOTICE: This is the temporary fix for excluded docker api endpoint been counted as local endpoint
      this.state.counter.localEndpoint = filter.length - this.state.counter.dockerApi;

      this.$analytics.eventTrack('endpoint-wizard-environment-add-finish', {
        category: 'portainer',
        metadata: {
          'docker-agent': this.state.counter.dockerAgent,
          'docker-api': this.state.counter.dockerApi,
          'kubernetes-agent': this.state.counter.kubernetesAgent,
          'aci-api': this.state.counter.aciApi,
          'local-endpoint': this.state.counter.localEndpoint,
        },
      });
      this.$state.go('portainer.home');
    } else {
      this.state.section = this.state.selections[this.state.currentStep].endpoint;
      this.state.selections[this.state.currentStep].stage = 'active';
      this.state.selections[this.state.currentStep - 1].stage = 'completed';
      this.state.currentStep++;
    }
  }

  addAnalytics(endpoint) {
    switch (endpoint) {
      case 'docker-agent':
        this.state.counter.dockerAgent++;
        break;
      case 'docker-api':
        this.state.counter.dockerApi++;
        break;
      case 'kubernetes-agent':
        this.state.counter.kubernetesAgent++;
        break;
      case 'aci-api':
        this.state.counter.aciApi++;
        break;
    }
  }

  endpointSelect(endpoint) {
    switch (endpoint) {
      case 'docker':
        if (this.state.options[0].selected) {
          this.state.options[0].selected = false;
          this.state.dockerActive = '';
          this.state.analytics.docker = '';
        } else {
          this.state.options[0].selected = true;
          this.state.dockerActive = 'wizard-active';
          this.state.analytics.docker = 'Docker/';
        }
        break;
      case 'kubernetes':
        if (this.state.options[1].selected) {
          this.state.options[1].selected = false;
          this.state.kubernetesActive = '';
          this.state.analytics.kubernetes = '';
        } else {
          this.state.options[1].selected = true;
          this.state.kubernetesActive = 'wizard-active';
          this.state.analytics.kubernetes = 'Kubernetes/';
        }
        break;
      case 'aci':
        if (this.state.options[2].selected) {
          this.state.options[2].selected = false;
          this.state.aciActive = '';
          this.state.analytics.aci = '';
        } else {
          this.state.options[2].selected = true;
          this.state.aciActive = 'wizard-active';
          this.state.analytics.aci = 'ACI';
        }
        break;
    }
    const options = this.state.options;
    this.state.selections = options.filter((item) => item.selected === true);
  }

  $onInit() {
    return this.$async(async () => {
      (this.state = {
        currentStep: 0,
        section: '',
        dockerActive: '',
        kubernetesActive: '',
        aciActive: '',
        maxStep: '',
        previousStep: 'Previous',
        nextStep: 'Next Step',
        selections: [],
        analytics: {
          docker: '',
          kubernetes: '',
          aci: '',
        },
        counter: {
          dockerAgent: 0,
          dockerApi: 0,
          kubernetesAgent: 0,
          aciApi: 0,
          localEndpoint: 0,
        },
        options: [
          {
            endpoint: 'docker',
            selected: false,
            stage: '',
            nameClass: 'docker',
            icon: 'fab fa-docker',
          },
          {
            endpoint: 'kubernetes',
            selected: false,
            stage: '',
            nameClass: 'kubernetes',
            icon: 'fas fa-dharmachakra',
          },
          {
            endpoint: 'aci',
            selected: false,
            stage: '',
            nameClass: 'aci',
            icon: 'fab fa-microsoft',
          },
        ],
        selectOption: '',
      }),
        (this.endpoints = []);

      const endpoints = await this.EndpointService.endpoints();
      this.endpoints = endpoints.value;
    });
  }
}
