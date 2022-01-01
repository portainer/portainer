import angular from 'angular';
import _ from 'lodash-es';
import { KubernetesPortainerConfigMapConfigName, KubernetesPortainerConfigMapNamespace, KubernetesPortainerConfigMapAccessKey } from 'Kubernetes/models/config-map/models';
import { UserAccessViewModel, TeamAccessViewModel } from 'Portainer/models/access';
import KubernetesConfigMapHelper from 'Kubernetes/helpers/configMapHelper';

class KubernetesResourcePoolAccessController {
  /* @ngInject */
  constructor($async, $state, Notifications, KubernetesResourcePoolService, KubernetesConfigMapService, GroupService, AccessService) {
    this.$async = $async;
    this.$state = $state;
    this.Notifications = Notifications;
    this.KubernetesResourcePoolService = KubernetesResourcePoolService;
    this.KubernetesConfigMapService = KubernetesConfigMapService;

    this.GroupService = GroupService;
    this.AccessService = AccessService;

    this.onInit = this.onInit.bind(this);
    this.authorizeAccessAsync = this.authorizeAccessAsync.bind(this);
    this.unauthorizeAccessAsync = this.unauthorizeAccessAsync.bind(this);

    this.unauthorizeAccess = this.unauthorizeAccess.bind(this);
  }

  initAccessConfigMap(configMap) {
    configMap.Name = KubernetesPortainerConfigMapConfigName;
    configMap.Namespace = KubernetesPortainerConfigMapNamespace;
    configMap.Data[KubernetesPortainerConfigMapAccessKey] = {};
    return configMap;
  }

  /**
   * Init
   */
  async onInit() {
    const endpoint = this.endpoint;
    this.state = {
      actionInProgress: false,
      viewReady: false,
    };

    this.formValues = {
      multiselectOutput: [],
    };

    try {
      const name = this.$transition$.params().id;
      let [pool, configMap] = await Promise.all([
        this.KubernetesResourcePoolService.get(name),
        this.KubernetesConfigMapService.getAccess(KubernetesPortainerConfigMapNamespace, KubernetesPortainerConfigMapConfigName),
      ]);
      const group = await this.GroupService.group(endpoint.GroupId);
      const roles = [];
      const endpointAccesses = await this.AccessService.accesses(endpoint, group, roles);
      this.pool = pool;
      if (configMap.Id === 0) {
        configMap = this.initAccessConfigMap(configMap);
      }
      configMap = KubernetesConfigMapHelper.parseJSONData(configMap);

      this.authorizedUsersAndTeams = [];
      this.accessConfigMap = configMap;
      const poolAccesses = configMap.Data[KubernetesPortainerConfigMapAccessKey][name];
      if (poolAccesses) {
        this.authorizedUsersAndTeams = _.filter(endpointAccesses.authorizedUsersAndTeams, (item) => {
          if (item instanceof UserAccessViewModel && poolAccesses.UserAccessPolicies) {
            return poolAccesses.UserAccessPolicies[item.Id] !== undefined;
          } else if (item instanceof TeamAccessViewModel && poolAccesses.TeamAccessPolicies) {
            return poolAccesses.TeamAccessPolicies[item.Id] !== undefined;
          }
          return false;
        });
      }
      this.availableUsersAndTeams = _.without(endpointAccesses.authorizedUsersAndTeams, ...this.authorizedUsersAndTeams);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to retrieve namespace information');
    } finally {
      this.state.viewReady = true;
    }
  }

  $onInit() {
    return this.$async(this.onInit);
  }

  /**
   * Authorize access
   */
  async authorizeAccessAsync() {
    try {
      this.state.actionInProgress = true;
      const newAccesses = _.concat(this.authorizedUsersAndTeams, this.formValues.multiselectOutput);
      const accessConfigMap = KubernetesConfigMapHelper.modifiyNamespaceAccesses(angular.copy(this.accessConfigMap), this.pool.Namespace.Name, newAccesses);
      await this.KubernetesConfigMapService.updateAccess(accessConfigMap);
      this.Notifications.success('Access successfully created');
      this.$state.reload(this.$state.current);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to create accesses');
    }
  }

  authorizeAccess() {
    return this.$async(this.authorizeAccessAsync);
  }

  /**
   *
   */
  async unauthorizeAccessAsync(selectedItems) {
    try {
      this.state.actionInProgress = true;
      const newAccesses = _.without(this.authorizedUsersAndTeams, ...selectedItems);
      const accessConfigMap = KubernetesConfigMapHelper.modifiyNamespaceAccesses(angular.copy(this.accessConfigMap), this.pool.Namespace.Name, newAccesses);
      await this.KubernetesConfigMapService.updateAccess(accessConfigMap);
      this.Notifications.success('Access successfully removed');
      this.$state.reload(this.$state.current);
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to remove accesses');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  unauthorizeAccess(selectedItems) {
    return this.$async(this.unauthorizeAccessAsync, selectedItems);
  }
}

export default KubernetesResourcePoolAccessController;
angular.module('portainer.kubernetes').controller('KubernetesResourcePoolAccessController', KubernetesResourcePoolAccessController);
