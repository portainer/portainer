import _ from 'lodash-es';
import { AccessControlFormData } from '../../../../portainer/components/accessControlForm/porAccessControlFormModel';
import { MacvlanFormData } from '../../../components/network-macvlan-form/networkMacvlanFormModel';

angular.module('portainer.docker').controller('CreateNetworkController', [
  '$q',
  '$scope',
  '$state',
  'PluginService',
  'Notifications',
  'NetworkService',
  'LabelHelper',
  'Authentication',
  'ResourceControlService',
  'FormValidator',
  'HttpRequestHelper',
  function ($q, $scope, $state, PluginService, Notifications, NetworkService, LabelHelper, Authentication, ResourceControlService, FormValidator, HttpRequestHelper) {
    $scope.formValues = {
      DriverOptions: [],
      IPV4: {
        Subnet: '',
        Gateway: '',
        IPRange: '',
        AuxAddress: '',
      },
      IPV6: {
        Subnet: '',
        Gateway: '',
        IPRange: '',
        AuxAddress: '',
      },
      Labels: [],
      AccessControlData: new AccessControlFormData(),
      NodeName: null,
      Macvlan: new MacvlanFormData(),
    };

    $scope.state = {
      formValidationError: '',
      actionInProgress: false,
    };

    $scope.availableNetworkDrivers = [];

    $scope.config = {
      Driver: 'bridge',
      CheckDuplicate: true,
      Internal: false,
      Attachable: false,
      EnableIPv6: false,
      // Force IPAM Driver to 'default', should not be required.
      // See: https://github.com/docker/docker/issues/25735
      IPAM: {
        Driver: 'default',
        Config: [],
      },
      Labels: {},
    };

    $scope.addDriverOption = function () {
      $scope.formValues.DriverOptions.push({
        name: '',
        value: '',
      });
    };

    $scope.removeDriverOption = function (index) {
      $scope.formValues.DriverOptions.splice(index, 1);
    };

    $scope.addLabel = function () {
      $scope.formValues.Labels.push({
        key: '',
        value: '',
      });
    };

    $scope.removeLabel = function (index) {
      $scope.formValues.Labels.splice(index, 1);
    };

    function prepareIPAMConfiguration(config) {
      if ($scope.formValues.IPV4.Subnet) {
        let ipamConfig = {};
        ipamConfig.Subnet = $scope.formValues.IPV4.Subnet;
        if ($scope.formValues.IPV4.Gateway) {
          ipamConfig.Gateway = $scope.formValues.IPV4.Gateway;
        }
        if ($scope.formValues.IPV4.IPRange) {
          ipamConfig.IPRange = $scope.formValues.IPV4.IPRange;
        }
        if ($scope.formValues.IPV4.AuxAddress) {
          ipamConfig.AuxAddress = $scope.formValues.IPV4.AuxAddress;
        }
        config.IPAM.Config.push(ipamConfig);
      }
      if ($scope.formValues.IPV6.Subnet) {
        let ipamConfig = {};
        ipamConfig.Subnet = $scope.formValues.IPV6.Subnet;
        if ($scope.formValues.IPV6.Gateway) {
          ipamConfig.Gateway = $scope.formValues.IPV6.Gateway;
        }
        if ($scope.formValues.IPV6.IPRange) {
          ipamConfig.IPRange = $scope.formValues.IPV6.IPRange;
        }
        if ($scope.formValues.IPV6.AuxAddress) {
          ipamConfig.AuxAddress = $scope.formValues.IPV6.AuxAddress;
        }
        config.EnableIPv6 = true;
        config.IPAM.Config.push(ipamConfig);
      }
    }

    function prepareDriverOptions(config) {
      var options = {};
      $scope.formValues.DriverOptions.forEach(function (option) {
        options[option.name] = option.value;
      });
      config.Options = options;
    }

    function prepareLabelsConfig(config) {
      config.Labels = LabelHelper.fromKeyValueToLabelHash($scope.formValues.Labels);
    }

    function prepareConfiguration() {
      var config = angular.copy($scope.config);
      prepareIPAMConfiguration(config);
      prepareDriverOptions(config);
      prepareLabelsConfig(config);
      return config;
    }

    function modifyNetworkConfigurationForMacvlanConfigOnly(config) {
      config.Internal = null;
      config.Attachable = null;
      config.ConfigOnly = true;
      config.Options.parent = $scope.formValues.Macvlan.ParentNetworkCard;
    }

    function modifyNetworkConfigurationForMacvlanConfigFrom(config, selectedNetworkConfig) {
      config.ConfigFrom = {
        Network: selectedNetworkConfig.Name,
      };
      if ($scope.applicationState.endpoint.mode.provider === 'DOCKER_SWARM_MODE') {
        config.Scope = 'swarm';
      } else {
        config.Scope = 'local';
      }
    }

    function validateForm(accessControlData, isAdmin) {
      $scope.state.formValidationError = '';
      var error = '';
      error = FormValidator.validateAccessControl(accessControlData, isAdmin);

      if (error) {
        $scope.state.formValidationError = error;
        return false;
      }
      return true;
    }

    function createNetwork(context) {
      HttpRequestHelper.setPortainerAgentTargetHeader(context.nodeName);
      HttpRequestHelper.setPortainerAgentManagerOperation(context.managerOperation);

      $scope.state.actionInProgress = true;
      NetworkService.create(context.networkConfiguration)
        .then(function success(data) {
          const userId = context.userDetails.ID;
          const accessControlData = context.accessControlData;
          const resourceControl = data.Portainer.ResourceControl;
          return ResourceControlService.applyResourceControl(userId, accessControlData, resourceControl);
        })
        .then(function success() {
          Notifications.success('Network successfully created');
          if (context.reload) {
            $state.go(
              'docker.networks',
              {},
              {
                reload: true,
              }
            );
          }
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'An error occured during network creation');
        })
        .finally(function final() {
          $scope.state.actionInProgress = false;
        });
    }

    $scope.create = function () {
      var networkConfiguration = prepareConfiguration();
      var accessControlData = $scope.formValues.AccessControlData;
      var userDetails = Authentication.getUserDetails();
      var isAdmin = Authentication.isAdmin();

      if (!validateForm(accessControlData, isAdmin)) {
        return;
      }

      var creationContext = {
        nodeName: $scope.formValues.NodeName,
        managerOperation: false,
        networkConfiguration: networkConfiguration,
        userDetails: userDetails,
        accessControlData: accessControlData,
        reload: true,
      };

      if ($scope.applicationState.endpoint.mode.agentProxy && $scope.applicationState.endpoint.mode.provider === 'DOCKER_SWARM_MODE' && $scope.config.Driver === 'overlay') {
        creationContext.managerOperation = true;
      }

      if ($scope.config.Driver === 'macvlan') {
        if ($scope.formValues.Macvlan.Scope === 'local') {
          modifyNetworkConfigurationForMacvlanConfigOnly(networkConfiguration);
        } else if ($scope.formValues.Macvlan.Scope === 'swarm') {
          var selectedNetworkConfig = $scope.formValues.Macvlan.SelectedNetworkConfig;
          modifyNetworkConfigurationForMacvlanConfigFrom(networkConfiguration, selectedNetworkConfig);
          creationContext.nodeName = selectedNetworkConfig.NodeName;
        }
      }

      if (
        $scope.config.Driver === 'macvlan' &&
        $scope.formValues.Macvlan.Scope === 'local' &&
        $scope.applicationState.endpoint.mode.agentProxy &&
        $scope.applicationState.endpoint.mode.provider === 'DOCKER_SWARM_MODE'
      ) {
        var selectedNodes = $scope.formValues.Macvlan.DatatableState.selectedItems;
        selectedNodes.forEach(function (node, idx) {
          creationContext.nodeName = node.Hostname;
          creationContext.reload = idx === selectedNodes.length - 1 ? true : false;
          createNetwork(creationContext);
        });
      } else {
        createNetwork(creationContext);
      }
    };

    function initView() {
      var apiVersion = $scope.applicationState.endpoint.apiVersion;

      PluginService.networkPlugins(apiVersion < 1.25)
        .then(function success(data) {
          $scope.availableNetworkDrivers = data;
          $scope.availableNetworkDrivers = _.filter($scope.availableNetworkDrivers, (driver) => driver !== 'host' && driver !== 'null');
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to retrieve network drivers');
        });
    }

    initView();
  },
]);
