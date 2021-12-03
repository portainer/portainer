import _ from 'lodash-es';
import KubernetesNamespaceHelper from 'Kubernetes/helpers/namespaceHelper';

export default class HelmTemplatesController {
  /* @ngInject */
  constructor($analytics, $async, $state, $window, $anchorScroll, Authentication, HelmService, KubernetesResourcePoolService, Notifications, ModalService) {
    this.$analytics = $analytics;
    this.$async = $async;
    this.$window = $window;
    this.$state = $state;
    this.$anchorScroll = $anchorScroll;
    this.Authentication = Authentication;
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
      const payload = {
        Name: this.state.appName,
        Repo: this.state.chart.repo,
        Chart: this.state.chart.name,
        Values: this.state.values,
        Namespace: this.state.resourcePool.Namespace.Name,
      };
      await this.HelmService.install(this.endpoint.Id, payload);
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
      const { GlobalRepository, UserRepositories } = await this.HelmService.getHelmRepositories(this.endpoint.Id);
      this.state.globalRepository = GlobalRepository;
      const userHelmReposUrls = UserRepositories.map((repo) => repo.URL);
      const uniqueHelmRepos = [...new Set([GlobalRepository, ...userHelmReposUrls])].map((url) => url.toLowerCase()).filter((url) => url); // remove duplicates and blank, to lowercase
      this.state.repos = uniqueHelmRepos;
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
  async getLatestCharts(helmRepos) {
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

      this.state.charts = latestCharts;
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
      this.state.resourcePools = _.sortBy(nonSystemNamespaces, ({ Namespace }) => (Namespace.Name === 'default' ? 0 : 1));
      this.state.resourcePool = this.state.resourcePools[0];
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
        repos: [],
        charts: [],
        loadingValues: false,
        isEditorDirty: false,
        chartsLoading: false,
        resourcePoolsLoading: false,
        viewReady: false,
        isAdmin: this.Authentication.isAdmin(),
        globalRepository: undefined,
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
