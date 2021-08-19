export default class HelmTemplatesController {
  /* @ngInject */
  constructor($analytics, $window, $async, $state, $anchorScroll, HelmService, KubernetesNamespaceHelper, KubernetesResourcePoolService, Notifications, ModalService) {
    this.$analytics = $analytics;
    this.$window = $window;
    this.$async = $async;
    this.$state = $state;
    this.$anchorScroll = $anchorScroll;
    this.HelmService = HelmService;
    this.KubernetesNamespaceHelper = KubernetesNamespaceHelper;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;
    this.Notifications = Notifications;
    this.ModalService = ModalService;

    this.editorUpdate = this.editorUpdate.bind(this);
    this.uiCanExit = this.uiCanExit.bind(this);
    this.installHelmchart = this.installHelmchart.bind(this);
    this.loadInitialData = this.loadInitialData.bind(this);
    this.getHelmValues = this.getHelmValues.bind(this);
    this.selectHelmChart = this.selectHelmChart.bind(this);

    $window.onbeforeunload = () => {
      if (this.state.isEditorDirty) {
        return '';
      }
    };
  }

  editorUpdate(content) {
    const contentvalues = content.getValue();
    if (this.state.originalvalues === contentvalues) {
      this.state.isEditorDirty = false;
    } else {
      this.state.values = contentvalues;
      this.state.isEditorDirty = true;
    }
  }

  async uiCanExit() {
    if (this.state.isEditorDirty) {
      return this.ModalService.confirmWebEditorDiscard();
    }
  }

  async installHelmchart() {
    this.state.actionInProgress = true;
    try {
      await this.HelmService.install(this.state.appName, this.state.resourcePool.Namespace.Name, this.state.template.name, this.state.values);
      this.Notifications.success('Helm Chart successfully installed');
      this.$analytics.eventTrack('kubernetes-helm-install', { category: 'kubernetes', metadata: { 'chart-name': this.state.template.name } });
      this.state.isEditorDirty = false;
      this.$state.go('kubernetes.applications');
    } catch (err) {
      this.Notifications.error('Installation error', err);
    } finally {
      this.state.actionInProgress = false;
    }
  }

  async getHelmValues() {
    this.state.loadingValues = true;
    try {
      const { values } = await this.HelmService.values(this.state.template.name);
      this.state.values = values;
      this.state.originalvalues = values;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve helm chart values.');
    } finally {
      this.state.loadingValues = false;
    }
  }

  async selectHelmChart(template) {
    this.$anchorScroll('view-top');
    this.state.showCustomValues = false;
    this.state.template = template;
    await this.getHelmValues();
  }

  async loadInitialData() {
    this.state.templatesLoading = true;
    try {
      const [resourcePools, templates] = await Promise.all([this.KubernetesResourcePoolService.get(), this.HelmService.search()]);

      const nonSystemNamespaces = resourcePools.filter((resourcePool) => !this.KubernetesNamespaceHelper.isSystemNamespace(resourcePool.Namespace.Name));
      this.state.resourcePools = nonSystemNamespaces;
      this.state.resourcePool = nonSystemNamespaces[0];

      const latestTemplates = Object.values(templates.entries).map((charts) => charts[0]);
      this.state.templates = latestTemplates;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve initial helm data.');
    } finally {
      this.state.templatesLoading = false;
    }
  }

  $onInit() {
    return this.$async(async () => {
      this.state = {
        appName: '',
        template: null,
        showCustomValues: false,
        actionInProgress: false,
        resourcePools: [],
        resourcePool: '',
        values: null,
        originalvalues: null,
        templates: [],
        loadingValues: false,
        isEditorDirty: false,

        viewReady: false,
      };

      await this.loadInitialData();

      this.state.viewReady = true;
    });
  }

  $onDestroy() {
    this.state.isEditorDirty = false;
  }
}
