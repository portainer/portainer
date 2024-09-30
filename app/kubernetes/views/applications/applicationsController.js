import angular from 'angular';
import _ from 'lodash-es';
import { KubernetesApplicationTypes } from 'Kubernetes/models/application/models/appConstants';
import { KubernetesPortainerApplicationStackNameLabel } from 'Kubernetes/models/application/models';
import { getDeploymentOptions } from '@/react/portainer/environments/environment.service';
import { getStacksFromApplications } from '@/react/kubernetes/applications/ListView/ApplicationsStacksDatatable/getStacksFromApplications';
import { getApplications } from '@/react/kubernetes/applications/application.queries.ts';
import { getNamespaces } from '@/react/kubernetes/namespaces/queries/useNamespacesQuery';
class KubernetesApplicationsController {
  /* @ngInject */
  constructor(
    $async,
    $state,
    $scope,
    Authentication,
    Notifications,
    KubernetesApplicationService,
    EndpointService,
    HelmService,
    KubernetesConfigurationService,
    LocalStorage,
    StackService,
    KubernetesNamespaceService
  ) {
    this.$async = $async;
    this.$state = $state;
    this.$scope = $scope;
    this.Authentication = Authentication;
    this.Notifications = Notifications;
    this.KubernetesApplicationService = KubernetesApplicationService;
    this.HelmService = HelmService;
    this.KubernetesConfigurationService = KubernetesConfigurationService;
    this.Authentication = Authentication;
    this.LocalStorage = LocalStorage;
    this.StackService = StackService;
    this.KubernetesNamespaceService = KubernetesNamespaceService;

    this.onInit = this.onInit.bind(this);
    this.removeAction = this.removeAction.bind(this);
    this.removeActionAsync = this.removeActionAsync.bind(this);
    this.removeStacksAction = this.removeStacksAction.bind(this);
    this.removeStacksActionAsync = this.removeStacksActionAsync.bind(this);
    this.onPublishingModeClick = this.onPublishingModeClick.bind(this);
    this.onChangeNamespaceDropdown = this.onChangeNamespaceDropdown.bind(this);
    this.setSystemResources = this.setSystemResources.bind(this);
  }

  selectTab(index) {
    this.LocalStorage.storeActiveTab('applications', index);
  }

  async removeStacksActionAsync(selectedItems) {
    let actionCount = selectedItems.length;
    for (const stack of selectedItems) {
      try {
        const isAppFormCreated = stack.Applications.some((x) => !x.ApplicationKind);

        if (isAppFormCreated) {
          const promises = _.map(stack.Applications, (app) => this.KubernetesApplicationService.delete(app));
          await Promise.all(promises);
        }

        await this.StackService.removeKubernetesStacksByName(stack.Name, stack.ResourcePool, false, this.endpoint.Id);

        this.Notifications.success('Stack successfully removed', stack.Name);
        _.remove(this.state.stacks, { Name: stack.Name });
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to remove stack');
      } finally {
        --actionCount;
        if (actionCount === 0) {
          this.$state.reload(this.$state.current);
        }
      }
    }
  }

  removeStacksAction(selectedItems) {
    return this.$async(this.removeStacksActionAsync, selectedItems);
  }

  async removeActionAsync(selectedItems) {
    let actionCount = selectedItems.length;
    for (const application of selectedItems) {
      try {
        if (application.ApplicationType === KubernetesApplicationTypes.Helm) {
          await this.HelmService.uninstall(this.endpoint.Id, application);
        } else {
          if (application.Metadata.labels && application.Metadata.labels[KubernetesPortainerApplicationStackNameLabel]) {
            // remove stack if no app left in the stack
            const appsInNamespace = await getApplications(this.endpoint.Id, { namespace: application.ResourcePool, withDependencies: false });
            const stacksInNamespace = getStacksFromApplications(appsInNamespace);
            const stack = stacksInNamespace.find((x) => x.Name === application.StackName);
            if (stack.Applications.length === 0 && application.StackId) {
              await this.StackService.remove({ Id: application.StackId }, false, this.endpoint.Id);
            }
          }
          await this.KubernetesApplicationService.delete(application);
        }
        this.Notifications.success('Application successfully removed', application.Name);
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to remove application');
      } finally {
        --actionCount;
        if (actionCount === 0) {
          this.$state.reload(this.$state.current);
        }
      }
    }
  }

  removeAction(selectedItems) {
    this.$async(() => this.removeActionAsync(selectedItems));
  }

  onPublishingModeClick(application) {
    this.state.activeTab = 1;
    _.forEach(this.state.ports, (item) => {
      item.Expanded = false;
      item.Highlighted = false;
      if (item.Name === application.Name && item.Ports.length > 1) {
        item.Expanded = true;
        item.Highlighted = true;
      }
    });
  }

  onChangeNamespaceDropdown(namespaceName) {
    return this.$async(async () => {
      this.state.namespaceName = namespaceName;
      // save the selected namespaceName in local storage with the key 'kubernetes_namespace_filter_${environmentId}_${userID}'
      this.LocalStorage.storeNamespaceFilter(this.endpoint.Id, this.user.ID, namespaceName);
    });
  }

  setSystemResources(flag) {
    return this.$scope.$applyAsync(() => {
      this.state.isSystemResources = flag;
    });
  }

  async onInit() {
    this.state = {
      activeTab: this.LocalStorage.getActiveTab('applications'),
      currentName: this.$state.$current.name,
      isAdmin: this.Authentication.isAdmin(),
      viewReady: false,
      applications: [],
      stacks: [],
      ports: [],
      namespaces: [],
      namespaceName: '',
      isSystemResources: undefined,
    };

    this.deploymentOptions = await getDeploymentOptions();

    this.user = this.Authentication.getUserDetails();
    this.state.namespaces = await getNamespaces(this.endpoint.Id);

    const savedNamespace = this.LocalStorage.getNamespaceFilter(this.endpoint.Id, this.user.ID); // could be null if not found, and '' if all namepsaces is selected
    const preferredNamespace = savedNamespace === null ? 'default' : savedNamespace;

    this.state.namespaces = this.state.namespaces.filter((n) => n.Status.phase === 'Active');
    this.state.namespaces = _.sortBy(this.state.namespaces, 'Name');
    // set all namespaces ('') if there are no namespaces, or if all namespaces is selected
    if (!this.state.namespaces.length || preferredNamespace === '') {
      this.state.namespaceName = '';
    } else {
      // otherwise, set the preferred namespaceName if it exists, otherwise set the first namespaceName
      this.state.namespaceName = this.state.namespaces.find((n) => n.Name === preferredNamespace) ? preferredNamespace : this.state.namespaces[0].Name;
    }

    this.state.viewReady = true;
  }

  $onInit() {
    return this.$async(this.onInit);
  }

  $onDestroy() {
    if (this.state.currentName !== this.$state.$current.name) {
      this.LocalStorage.storeActiveTab('applications', 0);
    }
  }
}

export default KubernetesApplicationsController;
angular.module('portainer.kubernetes').controller('KubernetesApplicationsController', KubernetesApplicationsController);
