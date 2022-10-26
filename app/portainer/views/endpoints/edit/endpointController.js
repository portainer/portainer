import _ from 'lodash-es';
import uuidv4 from 'uuid/v4';

import { PortainerEndpointTypes } from '@/portainer/models/endpoint/models';
import { EndpointSecurityFormData } from '@/portainer/components/endpointSecurity/porEndpointSecurityModel';
import EndpointHelper from '@/portainer/helpers/endpointHelper';
import { getAMTInfo } from 'Portainer/hostmanagement/open-amt/open-amt.service';
import { confirmDestructiveAsync } from '@/portainer/services/modal.service/confirm';
import { isEdgeEnvironment } from '@/react/portainer/environments/utils';

import { commandsTabs } from '@/react/edge/components/EdgeScriptForm/scripts';
import { GpusListAngular } from '@/react/portainer/environments/wizard/EnvironmentsCreationView/shared/Hardware/GpusList';

angular.module('portainer.app').component('gpusList', GpusListAngular).controller('EndpointController', EndpointController);

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
  SettingsService,
  ModalService
) {
  $scope.onChangeCheckInInterval = onChangeCheckInInterval;
  $scope.setFieldValue = setFieldValue;
  $scope.onChangeTags = onChangeTags;
  const isBE = process.env.PORTAINER_EDITION === 'BE';

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
    showNomad: isBE,
    edgeScriptCommands: {
      linux: _.compact([commandsTabs.k8sLinux, commandsTabs.swarmLinux, commandsTabs.standaloneLinux, isBE && commandsTabs.nomadLinux]),
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
    SecurityFormData: new EndpointSecurityFormData(),
  };

  $scope.copyEdgeAgentKey = function () {
    clipboard.copyText($scope.endpoint.EdgeKey);
    $('#copyNotificationEdgeKey').show().fadeOut(2500);
  };

  $scope.onToggleAllowSelfSignedCerts = function onToggleAllowSelfSignedCerts(checked) {
    return $scope.$evalAsync(() => {
      $scope.state.allowSelfSignedCerts = checked;
    });
  };

  $scope.onDisassociateEndpoint = async function () {
    ModalService.confirmDisassociate((confirmed) => {
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

  function setFieldValue(name, value) {
    return $scope.$evalAsync(() => {
      $scope.endpoint = {
        ...$scope.endpoint,
        [name]: value,
      };
    });
  }

  $scope.onGpusChange = onGpusChange;

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

  function onGpusChange(value) {
    return $async(async () => {
      $scope.endpoint.Gpus = value;
    });
  }

  function verifyGpus() {
    var i = ($scope.endpoint.Gpus || []).length;
    while (i--) {
      if ($scope.endpoint.Gpus[i].name === '' || $scope.endpoint.Gpus[i].name === null) {
        $scope.endpoint.Gpus.splice(i, 1);
      }
    }
  }

  $scope.updateEndpoint = async function () {
    var endpoint = $scope.endpoint;
    var securityData = $scope.formValues.SecurityFormData;
    var TLS = securityData.TLS;
    var TLSMode = securityData.TLSMode;
    var TLSSkipVerify = TLS && (TLSMode === 'tls_client_noca' || TLSMode === 'tls_only');
    var TLSSkipClientVerify = TLS && (TLSMode === 'tls_ca' || TLSMode === 'tls_only');

    if (isEdgeEnvironment(endpoint.Type) && _.difference($scope.initialTagIds, endpoint.TagIds).length > 0) {
      let confirmed = await confirmDestructiveAsync({
        title: 'Confirm action',
        message: 'Removing tags from this environment will remove the corresponding edge stacks when dynamic grouping is being used',
        buttons: {
          cancel: {
            label: 'Cancel',
            className: 'btn-default',
          },
          confirm: {
            label: 'Confirm',
            className: 'btn-primary',
          },
        },
      });

      if (!confirmed) {
        return;
      }
    }

    verifyGpus();
    var payload = {
      Name: endpoint.Name,
      PublicURL: endpoint.PublicURL,
      Gpus: endpoint.Gpus,
      GroupID: endpoint.GroupId,
      TagIds: endpoint.TagIds,
      TLS: TLS,
      TLSSkipVerify: TLSSkipVerify,
      TLSSkipClientVerify: TLSSkipClientVerify,
      TLSCACert: TLSSkipVerify || securityData.TLSCACert === endpoint.TLSConfig.TLSCACert ? null : securityData.TLSCACert,
      TLSCert: TLSSkipClientVerify || securityData.TLSCert === endpoint.TLSConfig.TLSCert ? null : securityData.TLSCert,
      TLSKey: TLSSkipClientVerify || securityData.TLSKey === endpoint.TLSConfig.TLSKey ? null : securityData.TLSKey,
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
        $state.go('portainer.endpoints', {}, { reload: true });
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

  async function initView() {
    return $async(async () => {
      try {
        const [endpoint, groups, settings] = await Promise.all([EndpointService.endpoint($transition$.params().id), GroupService.groups(), SettingsService.settings()]);

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
