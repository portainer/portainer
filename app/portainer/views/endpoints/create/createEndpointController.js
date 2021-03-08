import { PortainerEndpointCreationTypes, PortainerEndpointTypes } from 'Portainer/models/endpoint/models';
import { EndpointSecurityFormData } from '../../../components/endpointSecurity/porEndpointSecurityModel';

angular
  .module('portainer.app')
  .controller('CreateEndpointController', function CreateEndpointController(
    $async,
    $q,
    $scope,
    $state,
    $filter,
    clipboard,
    EndpointService,
    GroupService,
    TagService,
    SettingsService,
    Notifications,
    Authentication
  ) {
    $scope.state = {
      EnvironmentType: 'agent',
      PlatformType: 'linux',
      actionInProgress: false,
      deploymentTab: 0,
      allowCreateTag: Authentication.isAdmin(),
      availableEdgeAgentCheckinOptions: [
        { key: 'Use default interval', value: 0 },
        {
          key: '5 seconds',
          value: 5,
        },
        {
          key: '10 seconds',
          value: 10,
        },
        {
          key: '30 seconds',
          value: 30,
        },
        { key: '5 minutes', value: 300 },
        { key: '1 hour', value: 3600 },
        { key: '1 day', value: 86400 },
      ],
    };

    const deployCommands = {
      kubeLoadBalancer: `curl -L https://downloads.portainer.io/portainer-agent-k8s-lb.yaml -o portainer-agent-k8s.yaml; kubectl apply -f portainer-agent-k8s.yaml`,
      kubeNodePort: `curl -L https://downloads.portainer.io/portainer-agent-k8s-nodeport.yaml -o portainer-agent-k8s.yaml; kubectl apply -f portainer-agent-k8s.yaml`,
      agentLinux: `curl -L https://downloads.portainer.io/agent-stack.yml -o agent-stack.yml && docker stack deploy --compose-file=agent-stack.yml portainer-agent`,
      agentWindows: `curl -L https://downloads.portainer.io/agent-stack-windows.yml -o agent-stack-windows.yml && docker stack deploy --compose-file=agent-stack-windows.yml portainer-agent`,
    };
    $scope.deployCommands = deployCommands;

    $scope.formValues = {
      Name: '',
      URL: '',
      PublicURL: '',
      GroupId: 1,
      SecurityFormData: new EndpointSecurityFormData(),
      AzureApplicationId: '',
      AzureTenantId: '',
      AzureAuthenticationKey: '',
      TagIds: [],
      CheckinInterval: $scope.state.availableEdgeAgentCheckinOptions[0].value,
    };

    $scope.copyAgentCommand = function () {
      if ($scope.state.deploymentTab === 2 && $scope.state.PlatformType === 'linux') {
        clipboard.copyText(deployCommands.agentLinux);
      } else if ($scope.state.deploymentTab === 2 && $scope.state.PlatformType === 'windows') {
        clipboard.copyText(deployCommands.agentWindows);
      } else if ($scope.state.deploymentTab === 1) {
        clipboard.copyText(deployCommands.kubeNodePort);
      } else {
        clipboard.copyText(deployCommands.kubeLoadBalancer);
      }
      $('#copyNotification').show().fadeOut(2500);
    };

    $scope.setDefaultPortainerInstanceURL = function () {
      $scope.formValues.URL = window.location.origin;
    };

    $scope.resetEndpointURL = function () {
      $scope.formValues.URL = '';
    };

    $scope.onCreateTag = function onCreateTag(tagName) {
      return $async(onCreateTagAsync, tagName);
    };

    async function onCreateTagAsync(tagName) {
      try {
        const tag = await TagService.createTag(tagName);
        $scope.availableTags = $scope.availableTags.concat(tag);
        $scope.formValues.TagIds = $scope.formValues.TagIds.concat(tag.Id);
      } catch (err) {
        Notifications.error('Failure', err, 'Unable to create tag');
      }
    }

    $scope.addDockerEndpoint = function () {
      var name = $scope.formValues.Name;
      var URL = $filter('stripprotocol')($scope.formValues.URL);
      var publicURL = $scope.formValues.PublicURL;
      var groupId = $scope.formValues.GroupId;
      var tagIds = $scope.formValues.TagIds;

      if ($scope.formValues.ConnectSocket) {
        URL = $scope.formValues.SocketPath;
        $scope.state.actionInProgress = true;
        EndpointService.createLocalEndpoint(name, URL, publicURL, groupId, tagIds)
          .then(function success() {
            Notifications.success('Endpoint created', name);
            $state.go('portainer.endpoints', {}, { reload: true });
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to create endpoint');
          })
          .finally(function final() {
            $scope.state.actionInProgress = false;
          });
      } else {
        if (publicURL === '') {
          publicURL = URL.split(':')[0];
        }

        var securityData = $scope.formValues.SecurityFormData;
        var TLS = securityData.TLS;
        var TLSMode = securityData.TLSMode;
        var TLSSkipVerify = TLS && (TLSMode === 'tls_client_noca' || TLSMode === 'tls_only');
        var TLSSkipClientVerify = TLS && (TLSMode === 'tls_ca' || TLSMode === 'tls_only');
        var TLSCAFile = TLSSkipVerify ? null : securityData.TLSCACert;
        var TLSCertFile = TLSSkipClientVerify ? null : securityData.TLSCert;
        var TLSKeyFile = TLSSkipClientVerify ? null : securityData.TLSKey;

        addEndpoint(
          name,
          PortainerEndpointCreationTypes.LocalDockerEnvironment,
          URL,
          publicURL,
          groupId,
          tagIds,
          TLS,
          TLSSkipVerify,
          TLSSkipClientVerify,
          TLSCAFile,
          TLSCertFile,
          TLSKeyFile
        );
      }
    };

    $scope.addKubernetesEndpoint = function () {
      var name = $scope.formValues.Name;
      $scope.state.actionInProgress = true;
      EndpointService.createLocalKubernetesEndpoint(name)
        .then(function success(result) {
          Notifications.success('Endpoint created', name);
          $state.go('portainer.endpoints.endpoint.kubernetesConfig', { id: result.Id });
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to create endpoint');
        })
        .finally(function final() {
          $scope.state.actionInProgress = false;
        });
    };

    $scope.addAgentEndpoint = function () {
      var name = $scope.formValues.Name;
      // var URL = $filter('stripprotocol')($scope.formValues.URL);
      var URL = $scope.formValues.URL;
      var publicURL = $scope.formValues.PublicURL === '' ? URL.split(':')[0] : $scope.formValues.PublicURL;
      var groupId = $scope.formValues.GroupId;
      var tagIds = $scope.formValues.TagIds;

      addEndpoint(name, PortainerEndpointCreationTypes.AgentEnvironment, URL, publicURL, groupId, tagIds, true, true, true, null, null, null);
    };

    $scope.addEdgeAgentEndpoint = function () {
      var name = $scope.formValues.Name;
      var groupId = $scope.formValues.GroupId;
      var tagIds = $scope.formValues.TagIds;
      var URL = $scope.formValues.URL;

      addEndpoint(name, PortainerEndpointCreationTypes.EdgeAgentEnvironment, URL, '', groupId, tagIds, false, false, false, null, null, null, $scope.formValues.CheckinInterval);
    };

    $scope.addAzureEndpoint = function () {
      var name = $scope.formValues.Name;
      var applicationId = $scope.formValues.AzureApplicationId;
      var tenantId = $scope.formValues.AzureTenantId;
      var authenticationKey = $scope.formValues.AzureAuthenticationKey;
      var groupId = $scope.formValues.GroupId;
      var tagIds = $scope.formValues.TagIds;

      createAzureEndpoint(name, applicationId, tenantId, authenticationKey, groupId, tagIds);
    };

    function createAzureEndpoint(name, applicationId, tenantId, authenticationKey, groupId, tagIds) {
      $scope.state.actionInProgress = true;
      EndpointService.createAzureEndpoint(name, applicationId, tenantId, authenticationKey, groupId, tagIds)
        .then(function success() {
          Notifications.success('Endpoint created', name);
          $state.go('portainer.endpoints', {}, { reload: true });
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to create endpoint');
        })
        .finally(function final() {
          $scope.state.actionInProgress = false;
        });
    }

    function addEndpoint(name, creationType, URL, PublicURL, groupId, tagIds, TLS, TLSSkipVerify, TLSSkipClientVerify, TLSCAFile, TLSCertFile, TLSKeyFile, CheckinInterval) {
      $scope.state.actionInProgress = true;
      EndpointService.createRemoteEndpoint(
        name,
        creationType,
        URL,
        PublicURL,
        groupId,
        tagIds,
        TLS,
        TLSSkipVerify,
        TLSSkipClientVerify,
        TLSCAFile,
        TLSCertFile,
        TLSKeyFile,
        CheckinInterval
      )
        .then(function success(endpoint) {
          Notifications.success('Endpoint created', name);
          switch (endpoint.Type) {
            case PortainerEndpointTypes.EdgeAgentOnDockerEnvironment:
            case PortainerEndpointTypes.EdgeAgentOnKubernetesEnvironment:
              $state.go('portainer.endpoints.endpoint', { id: endpoint.Id });
              break;
            case PortainerEndpointTypes.AgentOnKubernetesEnvironment:
              $state.go('portainer.endpoints.endpoint.kubernetesConfig', { id: endpoint.Id });
              break;
            default:
              $state.go('portainer.endpoints', {}, { reload: true });
              break;
          }
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to create endpoint');
        })
        .finally(function final() {
          $scope.state.actionInProgress = false;
        });
    }

    function initView() {
      $q.all({
        groups: GroupService.groups(),
        tags: TagService.tags(),
        settings: SettingsService.settings(),
      })
        .then(function success(data) {
          $scope.groups = data.groups;
          $scope.availableTags = data.tags;

          const settings = data.settings;
          $scope.state.availableEdgeAgentCheckinOptions[0].key += ` (${settings.EdgeAgentCheckinInterval} seconds)`;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to load groups');
        });
    }

    initView();
  });
