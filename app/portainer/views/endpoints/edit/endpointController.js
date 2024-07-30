import _ from 'lodash-es';
import uuidv4 from 'uuid/v4';

import { PortainerEndpointTypes } from '@/portainer/models/endpoint/models';
import EndpointHelper from '@/portainer/helpers/endpointHelper';
import { getAMTInfo } from 'Portainer/hostmanagement/open-amt/open-amt.service';
import { confirmDestructive } from '@@/modals/confirm';
import { isEdgeEnvironment, isDockerAPIEnvironment } from '@/react/portainer/environments/utils';

import { commandsTabs } from '@/react/edge/components/EdgeScriptForm/scripts';
import { confirmDisassociate } from '@/react/portainer/environments/ItemView/ConfirmDisassociateModel';
import { buildConfirmButton } from '@@/modals/utils';
import { getInfo } from '@/react/docker/proxy/queries/useInfo';

angular.module('portainer.app').controller('EndpointController', EndpointController);

/* @ngInject */
function EndpointController(
  $async,
  $scope,
  $state,
  $transition$,
  $filter,
  clipboard,
  EndpointService,
  GroupService,

  Notifications,
  Authentication,
  SettingsService
) {
  $scope.onChangeCheckInInterval = onChangeCheckInInterval;
  $scope.setFieldValue = setFieldValue;
  $scope.onChangeTags = onChangeTags;
  $scope.onChangeTLSConfigFormValues = onChangeTLSConfigFormValues;

  $scope.state = {
    selectAll: false,
    // displayTextFilter: false,
    get selectedItemCount() {
      return $scope.state.selectedItems.length || 0;
    },
    selectedItems: [],
    uploadInProgress: false,
    actionInProgress: false,
    azureEndpoint: false,
    kubernetesEndpoint: false,
    agentEndpoint: false,
    edgeEndpoint: false,
    edgeAssociated: false,
    allowCreate: Authentication.isAdmin(),
    allowSelfSignedCerts: true,
    showAMTInfo: false,
    showTLSConfig: false,
    edgeScriptCommands: {
      linux: _.compact([commandsTabs.k8sLinux, commandsTabs.swarmLinux, commandsTabs.standaloneLinux]),
      win: [commandsTabs.swarmWindows, commandsTabs.standaloneWindow],
    },
  };

  $scope.selectAll = function () {
    $scope.state.firstClickedItem = null;
    for (var i = 0; i < $scope.state.filteredDataSet.length; i++) {
      var item = $scope.state.filteredDataSet[i];
      if (item.Checked !== $scope.state.selectAll) {
        // if ($scope.allowSelection(item) && item.Checked !== $scope.state.selectAll) {
        item.Checked = $scope.state.selectAll;
        $scope.selectItem(item);
      }
    }
  };

  function isBetween(value, a, b) {
    return (value >= a && value <= b) || (value >= b && value <= a);
  }

  $scope.selectItem = function (item, event) {
    // Handle range select using shift
    if (event && event.originalEvent.shiftKey && $scope.state.firstClickedItem) {
      const firstItemIndex = $scope.state.filteredDataSet.indexOf($scope.state.firstClickedItem);
      const lastItemIndex = $scope.state.filteredDataSet.indexOf(item);
      const itemsInRange = _.filter($scope.state.filteredDataSet, (item, index) => {
        return isBetween(index, firstItemIndex, lastItemIndex);
      });
      const value = $scope.state.firstClickedItem.Checked;

      _.forEach(itemsInRange, (i) => {
        i.Checked = value;
      });
      $scope.state.firstClickedItem = item;
    } else if (event) {
      item.Checked = !item.Checked;
      $scope.state.firstClickedItem = item;
    }
    $scope.state.selectedItems = _.uniq(_.concat($scope.state.selectedItems, $scope.state.filteredDataSet)).filter((i) => i.Checked);
    if (event && $scope.state.selectAll && $scope.state.selectedItems.length !== $scope.state.filteredDataSet.length) {
      $scope.state.selectAll = false;
    }
  };

  $scope.formValues = {
    tlsConfig: {
      tls: false,
      skipVerify: false,
      skipClientVerify: false,
      caCertFile: null,
      certFile: null,
      keyFile: null,
    },
  };

  $scope.onDisassociateEndpoint = async function () {
    confirmDisassociate().then((confirmed) => {
      if (confirmed) {
        disassociateEndpoint();
      }
    });
  };

  async function disassociateEndpoint() {
    var endpoint = $scope.endpoint;

    try {
      $scope.state.actionInProgress = true;
      await EndpointService.disassociateEndpoint(endpoint.Id);
      Notifications.success('Environment disassociated', $scope.endpoint.Name);
      $state.reload();
    } catch (err) {
      Notifications.error('Failure', err, 'Unable to disassociate environment');
    } finally {
      $scope.state.actionInProgress = false;
    }
  }

  function onChangeCheckInInterval(value) {
    setFieldValue('EdgeCheckinInterval', value);
  }

  function onChangeTags(value) {
    setFieldValue('TagIds', value);
  }

  function onChangeTLSConfigFormValues(newValues) {
    return this.$async(async () => {
      $scope.formValues.tlsConfig = {
        ...$scope.formValues.tlsConfig,
        ...newValues,
      };
    });
  }

  function setFieldValue(name, value) {
    return $scope.$evalAsync(() => {
      $scope.endpoint = {
        ...$scope.endpoint,
        [name]: value,
      };
    });
  }

  Array.prototype.indexOf = function (val) {
    for (var i = 0; i < this.length; i++) {
      if (this[i] == val) return i;
    }
    return -1;
  };
  Array.prototype.remove = function (val) {
    var index = this.indexOf(val);
    if (index > -1) {
      this.splice(index, 1);
    }
  };

  $scope.updateEndpoint = async function () {
    var endpoint = $scope.endpoint;

    if (isEdgeEnvironment(endpoint.Type) && _.difference($scope.initialTagIds, endpoint.TagIds).length > 0) {
      let confirmed = await confirmDestructive({
        title: 'Confirm action',
        message: 'Removing tags from this environment will remove the corresponding edge stacks when dynamic grouping is being used',
        confirmButton: buildConfirmButton(),
      });

      if (!confirmed) {
        return;
      }
    }

    var payload = {
      Name: endpoint.Name,
      PublicURL: endpoint.PublicURL,
      Gpus: endpoint.Gpus,
      GroupID: endpoint.GroupId,
      TagIds: endpoint.TagIds,
      AzureApplicationID: endpoint.AzureCredentials.ApplicationID,
      AzureTenantID: endpoint.AzureCredentials.TenantID,
      AzureAuthenticationKey: endpoint.AzureCredentials.AuthenticationKey,
      EdgeCheckinInterval: endpoint.EdgeCheckinInterval,
    };

    if (
      $scope.endpointType !== 'local' &&
      endpoint.Type !== PortainerEndpointTypes.AzureEnvironment &&
      endpoint.Type !== PortainerEndpointTypes.KubernetesLocalEnvironment &&
      endpoint.Type !== PortainerEndpointTypes.AgentOnKubernetesEnvironment
    ) {
      payload.URL = 'tcp://' + endpoint.URL;

      if (endpoint.Type === PortainerEndpointTypes.DockerEnvironment) {
        var tlsConfig = $scope.formValues.tlsConfig;
        payload.TLS = tlsConfig.tls;
        payload.TLSSkipVerify = tlsConfig.skipVerify;
        if (tlsConfig.tls && !tlsConfig.skipVerify) {
          payload.TLSSkipClientVerify = tlsConfig.skipClientVerify;
          payload.TLSCACert = tlsConfig.caCertFile;
          payload.TLSCert = tlsConfig.certFile;
          payload.TLSKey = tlsConfig.keyFile;
        }
      }
    }

    if (endpoint.Type === PortainerEndpointTypes.AgentOnKubernetesEnvironment) {
      payload.URL = endpoint.URL;
    }

    if (endpoint.Type === PortainerEndpointTypes.KubernetesLocalEnvironment) {
      payload.URL = 'https://' + endpoint.URL;
    }

    $scope.state.actionInProgress = true;
    EndpointService.updateEndpoint(endpoint.Id, payload).then(
      function success() {
        Notifications.success('Environment updated', $scope.endpoint.Name);
        $state.go($state.params.redirectTo || 'portainer.endpoints', {}, { reload: true });
      },
      function error(err) {
        Notifications.error('Failure', err, 'Unable to update environment');
        $scope.state.actionInProgress = false;
      },
      function update(evt) {
        if (evt.upload) {
          $scope.state.uploadInProgress = evt.upload;
        }
      }
    );
  };

  function decodeEdgeKey(key) {
    let keyInformation = {};

    if (key === '') {
      return keyInformation;
    }

    let decodedKey = _.split(atob(key), '|');
    keyInformation.instanceURL = decodedKey[0];
    keyInformation.tunnelServerAddr = decodedKey[1];

    return keyInformation;
  }

  function configureState() {
    if (
      $scope.endpoint.Type === PortainerEndpointTypes.KubernetesLocalEnvironment ||
      $scope.endpoint.Type === PortainerEndpointTypes.AgentOnKubernetesEnvironment ||
      $scope.endpoint.Type === PortainerEndpointTypes.EdgeAgentOnKubernetesEnvironment
    ) {
      $scope.state.kubernetesEndpoint = true;
    }
    if ($scope.endpoint.Type === PortainerEndpointTypes.EdgeAgentOnDockerEnvironment || $scope.endpoint.Type === PortainerEndpointTypes.EdgeAgentOnKubernetesEnvironment) {
      $scope.state.edgeEndpoint = true;
    }
    if ($scope.endpoint.Type === PortainerEndpointTypes.AzureEnvironment) {
      $scope.state.azureEndpoint = true;
    }
    if (
      $scope.endpoint.Type === PortainerEndpointTypes.AgentOnDockerEnvironment ||
      $scope.endpoint.Type === PortainerEndpointTypes.EdgeAgentOnDockerEnvironment ||
      $scope.endpoint.Type === PortainerEndpointTypes.AgentOnKubernetesEnvironment ||
      $scope.endpoint.Type === PortainerEndpointTypes.EdgeAgentOnKubernetesEnvironment
    ) {
      $scope.state.agentEndpoint = true;
    }
  }

  function configureTLS(endpoint) {
    $scope.formValues = {
      tlsConfig: {
        tls: endpoint.TLSConfig.TLS || false,
        skipVerify: endpoint.TLSConfig.TLSSkipVerify || false,
        skipClientVerify: endpoint.TLSConfig.TLSSkipClientVerify || false,
      },
    };
  }

  async function initView() {
    return $async(async () => {
      try {
        const [endpoint, groups, settings, publicSettings] = await Promise.all([
          EndpointService.endpoint($transition$.params().id),
          GroupService.groups(),
          SettingsService.settings(),
          SettingsService.publicSettings(),
        ]);
        // Feature flag check to conditionally show podman
        if (publicSettings.Features['podman']) {
          $scope.state.edgeScriptCommands.linux.push(commandsTabs.podmanLinux);
        }
        if (isDockerAPIEnvironment(endpoint)) {
          $scope.state.showTLSConfig = true;
        }

        // Check if the environment is docker standalone, to decide whether to show the GPU insights box
        const isDockerEnvironment = endpoint.Type === PortainerEndpointTypes.DockerEnvironment;
        if (isDockerEnvironment) {
          try {
            const dockerInfo = await getInfo(endpoint.Id);
            const isDockerSwarmEnv = dockerInfo.Swarm && dockerInfo.Swarm.NodeID;
            $scope.isDockerStandaloneEnv = !isDockerSwarmEnv;
          } catch (err) {
            // $scope.isDockerStandaloneEnv is only used to show the "GPU insights box", so fail quietly on error
          }
        }

        if (endpoint.URL.indexOf('unix://') === 0 || endpoint.URL.indexOf('npipe://') === 0) {
          $scope.endpointType = 'local';
        } else {
          $scope.endpointType = 'remote';
        }

        endpoint.URL = $filter('stripprotocol')(endpoint.URL);

        if (endpoint.Type === PortainerEndpointTypes.EdgeAgentOnDockerEnvironment || endpoint.Type === PortainerEndpointTypes.EdgeAgentOnKubernetesEnvironment) {
          $scope.edgeKeyDetails = decodeEdgeKey(endpoint.EdgeKey);

          $scope.state.edgeAssociated = !!endpoint.EdgeID;
          endpoint.EdgeID = endpoint.EdgeID || uuidv4();
        }

        $scope.endpoint = endpoint;
        $scope.initialTagIds = endpoint.TagIds.slice();
        $scope.groups = groups;

        configureState();

        configureTLS(endpoint);

        if (EndpointHelper.isDockerEndpoint(endpoint) && $scope.state.edgeAssociated) {
          $scope.state.showAMTInfo = settings && settings.openAMTConfiguration && settings.openAMTConfiguration.enabled;
        }
      } catch (err) {
        Notifications.error('Failure', err, 'Unable to retrieve environment details');
      }

      if ($scope.state.showAMTInfo) {
        try {
          $scope.endpoint.ManagementInfo = {};
          const amtInfo = await getAMTInfo($state.params.id);
          try {
            $scope.endpoint.ManagementInfo = JSON.parse(amtInfo.RawOutput);
          } catch (err) {
            clearAMTManagementInfo(amtInfo.RawOutput);
          }
        } catch (err) {
          clearAMTManagementInfo('Unable to retrieve AMT environment details');
        }
      }
    });
  }

  function clearAMTManagementInfo(versionValue) {
    $scope.endpoint.ManagementInfo['AMT'] = versionValue;
    $scope.endpoint.ManagementInfo['UUID'] = '-';
    $scope.endpoint.ManagementInfo['Control Mode'] = '-';
    $scope.endpoint.ManagementInfo['Build Number'] = '-';
    $scope.endpoint.ManagementInfo['DNS Suffix'] = '-';
  }

  initView();
}
