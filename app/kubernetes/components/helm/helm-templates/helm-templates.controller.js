import KubernetesNamespaceHelper from 'Kubernetes/helpers/namespaceHelper';

export default class HelmTemplatesController {
  /* @ngInject */
  constructor(
    $analytics,
    $async,
    $state,
    $window,
    $anchorScroll,
    SettingsService,
    Authentication,
    UserService,
    HelmService,
    KubernetesResourcePoolService,
    Notifications,
    ModalService
  ) {
    this.$analytics = $analytics;
    this.$async = $async;
    this.$window = $window;
    this.$state = $state;
    this.$anchorScroll = $anchorScroll;
    this.SettingsService = SettingsService;
    this.Authentication = Authentication;
    this.UserService = UserService;
    this.HelmService = HelmService;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;
    this.Notifications = Notifications;
    this.ModalService = ModalService;

    this.editorUpdate = this.editorUpdate.bind(this);
    this.uiCanExit = this.uiCanExit.bind(this);
    this.installHelmchart = this.installHelmchart.bind(this);
    this.getHelmValues = this.getHelmValues.bind(this);
    this.selectHelmChart = this.selectHelmChart.bind(this);
    this.getHelmRepoURLs = this.getHelmRepoURLs.bind(this);
    this.getLatestCharts = this.getLatestCharts.bind(this);
    this.getResourcePools = this.getResourcePools.bind(this);

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
      await this.HelmService.install(this.state.appName, this.state.chart.repo, this.state.chart.name, this.state.values, this.state.resourcePool.Namespace.Name);
      this.Notifications.success('Helm Chart successfully installed');
      this.$analytics.eventTrack('kubernetes-helm-install', { category: 'kubernetes', metadata: { 'chart-name': this.state.chart.name } });
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
      const { values } = await this.HelmService.values(this.state.chart.repo, this.state.chart.name);
      this.state.values = values;
      this.state.originalvalues = values;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve helm chart values.');
    } finally {
      this.state.loadingValues = false;
    }
  }

  async selectHelmChart(chart) {
    this.$anchorScroll('view-top');
    this.state.showCustomValues = false;
    this.state.chart = chart;
    await this.getHelmValues();
  }

  /**
   * @description This function is used to get the helm repo urls for the endpoint and user
   * @returns {Promise<string[]>} list of helm repo urls
   */

  async getHelmRepoURLs() {
    this.state.reposLoading = true;
    try {
      // fetch globally set helm repo and user helm repos (parallel)
      const [{ HelmRepositoryURL }, userHelmRepositories] = await Promise.all([this.SettingsService.settings(), this.UserService.getHelmRepositories(this.state.userId)]);
      const userHelmReposUrls = userHelmRepositories.map((repo) => repo.URL);
      const uniqueHelmRepos = [...new Set([HelmRepositoryURL, ...userHelmReposUrls])]; // remove duplicates
      return uniqueHelmRepos;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve helm repo urls.');
    } finally {
      this.state.reposLoading = false;
    }
  }

  /**
   * @description This function is used to fetch the respective index.yaml files for the provided helm repo urls
   * @param {string[]} helmRepos list of helm repositories
   * @param {bool} append append charts returned from repo to existing list of helm charts
   */

  async getLatestCharts(helmRepos, append = false) {
    this.state.chartsLoading = true;
    try {
      const promiseList = helmRepos.map((repo) => this.HelmService.search(repo));
      // fetch helm charts from all the provided helm repositories (parallel)
      // Promise.allSettled is used to account for promise failure(s) - in cases the  user has provided invalid helm repo
      const chartPromises = await Promise.allSettled(promiseList);
      const latestCharts = chartPromises
        .filter((tp) => tp.status === 'fulfilled') // remove failed promises
        .map((tp) => ({ entries: tp.value.entries, repo: helmRepos[chartPromises.indexOf(tp)] })) // extract chart entries with respective repo data
        .flatMap(
          ({ entries, repo }) => Object.values(entries).map((charts) => ({ ...charts[0], repo })) // flatten chart entries to single array with respective repo
        );

      this.state.charts = append ? this.state.charts.concat(latestCharts) : latestCharts;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve helm repo charts.');
    } finally {
      this.state.chartsLoading = false;
    }
  }

  async getResourcePools() {
    this.state.resourcePoolsLoading = true;
    try {
      const resourcePools = await this.KubernetesResourcePoolService.get();

      const nonSystemNamespaces = resourcePools.filter((resourcePool) => !KubernetesNamespaceHelper.isSystemNamespace(resourcePool.Namespace.Name));
      this.state.resourcePools = nonSystemNamespaces;
      this.state.resourcePool = nonSystemNamespaces[0];
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve initial helm data.');
    } finally {
      this.state.resourcePoolsLoading = false;
    }
  }

  $onInit() {
    return this.$async(async () => {
      this.state = {
        appName: '',
        chart: null,
        showCustomValues: false,
        actionInProgress: false,
        resourcePools: [],
        resourcePool: '',
        values: null,
        originalvalues: null,
        charts: [],
        loadingValues: false,
        isEditorDirty: false,
        chartsLoading: false,
        resourcePoolsLoading: false,
        userId: this.Authentication.getUserDetails().ID,
        viewReady: false,
      };

      const helmRepos = await this.getHelmRepoURLs();
      await Promise.all([this.getLatestCharts(helmRepos), this.getResourcePools()]);

      this.state.viewReady = true;
    });
  }

  $onDestroy() {
    this.state.isEditorDirty = false;
  }
}
