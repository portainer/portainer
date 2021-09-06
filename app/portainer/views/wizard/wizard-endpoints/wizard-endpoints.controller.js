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
        docker: this.state.analytics.docker,
        kubernetes: this.state.analytics.kubernetes,
        aci: this.state.analytics.aci,
      },
    });
    this.state.currentStep++;
  }

  nextStep() {
    if (this.state.currentStep >= this.state.maxStep - 1) {
      this.state.nextStep = 'Finish';
    }
    if (this.state.currentStep === this.state.maxStep) {
      this.$analytics.eventTrack('endpoint-wizard-environment-add-finish', {
        category: 'portainer',
        metadata: {
          'local-endpoint': this.state.counter.localEndpoint,
          'docker-agent': this.state.counter.dockerAgent,
          'docker-api': this.state.counter.dockerApi,
          'kubernetes-agent': this.state.counter.kubernetesAgent,
          'aci-api': this.state.counter.aciApi,
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
      case 'local-endpoint':
        this.state.counter.localEndpoint++;
        break;
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
          this.state.analytics.docker = 1;
        } else {
          this.state.options[0].selected = true;
          this.state.dockerActive = 'wizard-active';
          this.state.analytics.docker = 0;
        }
        break;
      case 'kubernetes':
        if (this.state.options[1].selected) {
          this.state.options[1].selected = false;
          this.state.kubernetesActive = '';
          this.state.analytics.kubernetes = 1;
        } else {
          this.state.options[1].selected = true;
          this.state.kubernetesActive = 'wizard-active';
          this.state.analytics.kubernetes = 0;
        }
        break;
      case 'aci':
        if (this.state.options[2].selected) {
          this.state.options[2].selected = false;
          this.state.aciActive = '';
          this.state.analytics.aci = 1;
        } else {
          this.state.options[2].selected = true;
          this.state.aciActive = 'wizard-active';
          this.state.analytics.aci = 0;
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
        nextStep: 'Next Step',
        selections: [],
        analytics: {
          docker: null,
          kubernetes: null,
          aci: null,
        },
        counter: {
          localEndpoint: 0,
          dockerAgent: 0,
          dockerApi: 0,
          kubernetesAgent: 0,
          aciApi: 0,
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
        // Initial local endpoint been added automatic when login
        (this.endpoints = []);
      const endpoints = await this.EndpointService.endpoints();
      this.endpoints = endpoints.value;
    });
  }
}
