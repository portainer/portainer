import { PortainerEndpointCreationTypes, PortainerEndpointTypes } from 'Portainer/models/endpoint/models';
import { getAgentShortVersion } from 'Portainer/views/endpoints/helpers';
import { baseHref } from '@/portainer/helpers/pathHelper';
import { EndpointSecurityFormData } from '../../../components/endpointSecurity/porEndpointSecurityModel';

angular
  .module('portainer.app')
  .controller(
    'CreateEndpointController',
    function CreateEndpointController(
      $async,
      $analytics,
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
      Authentication,
      StateManager
    ) {
      $scope.state = {
        EnvironmentType: $state.params.isEdgeDevice ? 'edge_agent' : 'agent',
        PlatformType: 'linux',
        actionInProgress: false,
        deploymentTab: 0,
        allowCreateTag: Authentication.isAdmin(),
        isEdgeDevice: $state.params.isEdgeDevice,
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

      const agentVersion = StateManager.getState().application.version;
      const agentShortVersion = getAgentShortVersion(agentVersion);
      $scope.agentSecret = '';

      $scope.deployCommands = {
        kubeLoadBalancer: `curl -L https://downloads.portainer.io/ce${agentShortVersion}/portainer-agent-k8s-lb.yaml -o portainer-agent-k8s.yaml; kubectl apply -f portainer-agent-k8s.yaml`,
        kubeNodePort: `curl -L https://downloads.portainer.io/ce${agentShortVersion}/portainer-agent-k8s-nodeport.yaml -o portainer-agent-k8s.yaml; kubectl apply -f portainer-agent-k8s.yaml`,
        agentLinux: agentLinuxSwarmCommand,
        agentWindows: agentWindowsSwarmCommand,
      };

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
        let command = '';
        if ($scope.state.deploymentTab === 2 && $scope.state.PlatformType === 'linux') {
          command = $scope.deployCommands.agentLinux($scope.agentSecret);
        } else if ($scope.state.deploymentTab === 2 && $scope.state.PlatformType === 'windows') {
          command = $scope.deployCommands.agentWindows($scope.agentSecret);
        } else if ($scope.state.deploymentTab === 1) {
          command = $scope.deployCommands.kubeNodePort;
        } else {
          command = $scope.deployCommands.kubeLoadBalancer;
        }
        clipboard.copyText(command.trim());
        $('#copyNotification').show().fadeOut(2500);
      };

      $scope.setDefaultPortainerInstanceURL = function () {
        let url;

        if (window.location.origin.startsWith('http')) {
          const path = baseHref() !== '/' ? path : '';
          url = `${window.location.origin}${path}`;
        } else {
          url = baseHref().replace(/\/$/, '');
        }

        $scope.formValues.URL = url;
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
              Notifications.success('Environment created', name);
              $state.go('portainer.endpoints', {}, { reload: true });
            })
            .catch(function error(err) {
              Notifications.error('Failure', err, 'Unable to create environment');
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
        var tagIds = $scope.formValues.TagIds;
        $scope.state.actionInProgress = true;
        EndpointService.createLocalKubernetesEndpoint(name, tagIds)
          .then(function success(result) {
            Notifications.success('Environment created', name);
            $state.go('portainer.k8sendpoint.kubernetesConfig', { id: result.Id });
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to create environment');
          })
          .finally(function final() {
            $scope.state.actionInProgress = false;
          });
      };

      $scope.addAgentEndpoint = addAgentEndpoint;
      async function addAgentEndpoint() {
        return $async(async () => {
          const name = $scope.formValues.Name;
          const URL = $scope.formValues.URL;
          const publicURL = $scope.formValues.PublicURL === '' ? URL.split(':')[0] : $scope.formValues.PublicURL;
          const groupId = $scope.formValues.GroupId;
          const tagIds = $scope.formValues.TagIds;

          const endpoint = await addEndpoint(name, PortainerEndpointCreationTypes.AgentEnvironment, URL, publicURL, groupId, tagIds, true, true, true, null, null, null);
          $analytics.eventTrack('portainer-endpoint-creation', { category: 'portainer', metadata: { type: 'agent', platform: platformLabel(endpoint.Type) } });
        });

        function platformLabel(type) {
          switch (type) {
            case PortainerEndpointTypes.DockerEnvironment:
            case PortainerEndpointTypes.AgentOnDockerEnvironment:
            case PortainerEndpointTypes.EdgeAgentOnDockerEnvironment:
              return 'docker';
            case PortainerEndpointTypes.KubernetesLocalEnvironment:
            case PortainerEndpointTypes.AgentOnKubernetesEnvironment:
            case PortainerEndpointTypes.EdgeAgentOnKubernetesEnvironment:
              return 'kubernetes';
          }
        }
      }

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
            Notifications.success('Environment created', name);
            $state.go('portainer.endpoints', {}, { reload: true });
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to create environment');
          })
          .finally(function final() {
            $scope.state.actionInProgress = false;
          });
      }

      async function addEndpoint(
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
      ) {
        return $async(async () => {
          $scope.state.actionInProgress = true;
          try {
            const endpoint = await EndpointService.createRemoteEndpoint(
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
              CheckinInterval,
              $scope.state.isEdgeDevice
            );

            Notifications.success('Environment created', name);
            switch (endpoint.Type) {
              case PortainerEndpointTypes.EdgeAgentOnDockerEnvironment:
              case PortainerEndpointTypes.EdgeAgentOnKubernetesEnvironment:
                $state.go('portainer.endpoints.endpoint', { id: endpoint.Id });
                break;
              case PortainerEndpointTypes.AgentOnKubernetesEnvironment:
                $state.go('portainer.k8sendpoint.kubernetesConfig', { id: endpoint.Id });
                break;
              default:
                $state.go('portainer.endpoints', {}, { reload: true });
                break;
            }

            return endpoint;
          } catch (err) {
            Notifications.error('Failure', err, 'Unable to create environment');
          } finally {
            $scope.state.actionInProgress = false;
          }
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
            $scope.agentSecret = settings.AgentSecret;
          })
          .catch(function error(err) {
            Notifications.error('Failure', err, 'Unable to load groups');
          });
      }

      function agentLinuxSwarmCommand(agentSecret) {
        let secret = agentSecret == '' ? '' : `\\\n  -e AGENT_SECRET=${agentSecret} `;
        return `
docker network create \\
  --driver overlay \\
  portainer_agent_network

docker service create \\
  --name portainer_agent \\
  --network portainer_agent_network \\
  -p 9001:9001/tcp ${secret}\\
  --mode global \\
  --constraint 'node.platform.os == linux' \\
  --mount type=bind,src=//var/run/docker.sock,dst=/var/run/docker.sock \\
  --mount type=bind,src=//var/lib/docker/volumes,dst=/var/lib/docker/volumes \\
  portainer/agent:${agentVersion}
  `;
      }

      function agentWindowsSwarmCommand(agentSecret) {
        let secret = agentSecret == '' ? '' : `\\\n  -e AGENT_SECRET=${agentSecret} `;
        return `
docker network create \\
  --driver overlay \\
  portainer_agent_network && \\
docker service create \\
  --name portainer_agent \\
  --network portainer_agent_network \\
  -p 9001:9001/tcp  ${secret}\\
  --mode global \\
  --constraint 'node.platform.os == windows' \\
  --mount type=npipe,src=\\\\.\\pipe\\docker_engine,dst=\\\\.\\pipe\\docker_engine \\
  --mount type=bind,src=C:\\ProgramData\\docker\\volumes,dst=C:\\ProgramData\\docker\\volumes \\
  portainer/agent:${agentVersion}
  `;
      }

      initView();
    }
  );
