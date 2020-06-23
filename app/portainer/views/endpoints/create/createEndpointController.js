import { PortainerEndpointTypes } from 'Portainer/models/endpoint/models';
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
      if ($scope.state.deploymentTab === 0) {
        clipboard.copyText('curl -L https://downloads.portainer.io/agent-stack.yml -o agent-stack.yml && docker stack deploy --compose-file=agent-stack.yml portainer-agent');
      } else {
        clipboard.copyText('curl -L https://downloads.portainer.io/portainer-agent-k8s.yaml -o portainer-agent-k8s.yaml; kubectl apply -f portainer-agent-k8s.yaml');
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
        Notifications.error('Failue', err, 'Unable to create tag');
      }
    }

    $scope.addDockerEndpoint = function () {
      var name = $scope.formValues.Name;
      var URL = $filter('stripprotocol')($scope.formValues.URL);
      var publicURL = $scope.formValues.PublicURL === '' ? URL.split(':')[0] : $scope.formValues.PublicURL;
      var groupId = $scope.formValues.GroupId;
      var tagIds = $scope.formValues.TagIds;

      var securityData = $scope.formValues.SecurityFormData;
      var TLS = securityData.TLS;
      var TLSMode = securityData.TLSMode;
      var TLSSkipVerify = TLS && (TLSMode === 'tls_client_noca' || TLSMode === 'tls_only');
      var TLSSkipClientVerify = TLS && (TLSMode === 'tls_ca' || TLSMode === 'tls_only');
      var TLSCAFile = TLSSkipVerify ? null : securityData.TLSCACert;
      var TLSCertFile = TLSSkipClientVerify ? null : securityData.TLSCert;
      var TLSKeyFile = TLSSkipClientVerify ? null : securityData.TLSKey;

      addEndpoint(name, PortainerEndpointTypes.DockerEnvironment, URL, publicURL, groupId, tagIds, TLS, TLSSkipVerify, TLSSkipClientVerify, TLSCAFile, TLSCertFile, TLSKeyFile);
    };

    $scope.addAgentEndpoint = function () {
      var name = $scope.formValues.Name;
      var URL = $filter('stripprotocol')($scope.formValues.URL);
      var publicURL = $scope.formValues.PublicURL === '' ? URL.split(':')[0] : $scope.formValues.PublicURL;
      var groupId = $scope.formValues.GroupId;
      var tagIds = $scope.formValues.TagIds;

      addEndpoint(name, PortainerEndpointTypes.AgentOnDockerEnvironment, URL, publicURL, groupId, tagIds, true, true, true, null, null, null);
      // TODO: k8s merge - temporarily updated to AgentOnKubernetesEnvironment, breaking Docker agent support
      // addEndpoint(name, PortainerEndpointTypes.AgentOnKubernetesEnvironment, URL, publicURL, groupId, tags, true, true, true, null, null, null);
    };

    $scope.addEdgeAgentEndpoint = function () {
      var name = $scope.formValues.Name;
      var groupId = $scope.formValues.GroupId;
      var tagIds = $scope.formValues.TagIds;
      var URL = $scope.formValues.URL;

      addEndpoint(name, PortainerEndpointTypes.EdgeAgentOnDockerEnvironment, URL, '', groupId, tagIds, false, false, false, null, null, null, $scope.formValues.CheckinInterval);
      // TODO: k8s merge - temporarily updated to EdgeAgentOnKubernetesEnvironment, breaking Docker Edge agent support
      // addEndpoint(name, PortainerEndpointTypes.EdgeAgentOnKubernetesEnvironment, URL, "", groupId, tags, false, false, false, null, null, null);
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

    function addEndpoint(name, type, URL, PublicURL, groupId, tagIds, TLS, TLSSkipVerify, TLSSkipClientVerify, TLSCAFile, TLSCertFile, TLSKeyFile, CheckinInterval) {
      $scope.state.actionInProgress = true;
      EndpointService.createRemoteEndpoint(
        name,
        type,
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
        .then(function success(data) {
          Notifications.success('Endpoint created', name);
          if (type === PortainerEndpointTypes.EdgeAgentOnDockerEnvironment || type === PortainerEndpointTypes.EdgeAgentOnKubernetesEnvironment) {
            $state.go('portainer.endpoints.endpoint', { id: data.Id });
          } else if (type === PortainerEndpointTypes.AgentOnKubernetesEnvironment) {
            $state.go('portainer.endpoints.endpoint.kubernetesConfig', { id: data.Id });
          } else {
            $state.go('portainer.endpoints', {}, { reload: true });
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
