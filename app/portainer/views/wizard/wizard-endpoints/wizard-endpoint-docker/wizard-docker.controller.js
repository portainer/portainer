import { PortainerEndpointCreationTypes } from 'Portainer/models/endpoint/models';
import { EndpointSecurityFormData } from 'Portainer/components/endpointSecurity/porEndpointSecurityModel';
import { getAgentShortVersion } from 'Portainer/views/endpoints/helpers';
import { buildOption } from '@/portainer/components/BoxSelector';

export default class WizardDockerController {
  /* @ngInject */
  constructor($async, EndpointService, StateManager, Notifications, clipboard, $filter, NameValidator) {
    this.$async = $async;
    this.EndpointService = EndpointService;
    this.StateManager = StateManager;
    this.Notifications = Notifications;
    this.clipboard = clipboard;
    this.$filter = $filter;
    this.NameValidator = NameValidator;

    this.state = {
      endpointType: 'agent',
      ConnectSocket: false,
      actionInProgress: false,
      endpoints: [],
      availableOptions: [
        buildOption('Agent', 'fa fa-bolt', 'Agent', '', 'agent'),
        buildOption('API', 'fa fa-cloud', 'API', '', 'api'),
        buildOption('Socket', 'fab fa-docker', 'Socket', '', 'socket'),
      ],
    };

    this.formValues = {
      name: '',
      url: '',
      publicURL: '',
      groupId: 1,
      tagIds: [],
      environmentUrl: '',
      dockerApiurl: '',
      socketPath: '',
      overrideSocket: false,
      skipCertification: false,
      tls: false,
      securityFormData: new EndpointSecurityFormData(),
    };

    this.command = {};

    this.onChangeEndpointType = this.onChangeEndpointType.bind(this);
  }

  onChangeEndpointType(endpointType) {
    this.state.endpointType = endpointType;
  }

  copyLinuxCommand() {
    this.clipboard.copyText(this.command.linuxCommand);
    $('#linuxCommandNotification').show().fadeOut(2500);
  }

  copyWinCommand() {
    this.clipboard.copyText(this.command.winCommand);
    $('#winCommandNotification').show().fadeOut(2500);
  }

  copyLinuxSocket() {
    this.clipboard.copyText(this.command.linuxSocket);
    $('#linuxSocketNotification').show().fadeOut(2500);
  }

  copyWinSocket() {
    this.clipboard.copyText(this.command.winSocket);
    $('#winSocketNotification').show().fadeOut(2500);
  }

  onChangeFile(file) {
    this.formValues.securityFormData = file;
  }

  // connect docker environment
  connectEnvironment(type) {
    return this.$async(async () => {
      const name = this.formValues.name;
      const url = this.$filter('stripprotocol')(this.formValues.url);
      const publicUrl = url.split(':')[0];
      const overrideUrl = this.formValues.socketPath;
      const groupId = this.formValues.groupId;
      const tagIds = this.formValues.tagIds;
      const securityData = this.formValues.securityFormData;
      const socketUrl = this.formValues.overrideSocket ? overrideUrl : url;

      var creationType = null;

      if (type === 'agent') {
        creationType = PortainerEndpointCreationTypes.AgentEnvironment;
      }

      if (type === 'api') {
        creationType = PortainerEndpointCreationTypes.LocalDockerEnvironment;
      }

      // Check name is duplicated or not
      const nameUsed = await this.NameValidator.validateEnvironmentName(name);
      if (nameUsed) {
        this.Notifications.error('Failure', null, 'This name is been used, please try another one');
        return;
      }
      switch (type) {
        case 'agent':
          await this.addDockerAgentEndpoint(name, creationType, url, publicUrl, groupId, tagIds);
          break;
        case 'api':
          await this.addDockerApiEndpoint(name, creationType, url, publicUrl, groupId, tagIds, securityData);
          break;
        case 'socket':
          await this.addDockerLocalEndpoint(name, socketUrl, publicUrl, groupId, tagIds);
          break;
      }
    });
  }

  // Docker Agent Endpoint
  async addDockerAgentEndpoint(name, creationType, url, publicUrl, groupId, tagIds) {
    const tsl = true;
    const tlsSkipVerify = true;
    const tlsSkipClientVerify = true;
    const tlsCaFile = null;
    const tlsCertFile = null;
    const tlsKeyFile = null;

    await this.addRemoteEndpoint(name, creationType, url, publicUrl, groupId, tagIds, tsl, tlsSkipVerify, tlsSkipClientVerify, tlsCaFile, tlsCertFile, tlsKeyFile);
  }

  // Docker Api Endpoint
  async addDockerApiEndpoint(name, creationType, url, publicUrl, groupId, tagIds, securityData) {
    const tsl = this.formValues.tls;
    const tlsSkipVerify = this.formValues.skipCertification;
    const tlsSkipClientVerify = this.formValues.skipCertification;
    const tlsCaFile = tlsSkipVerify ? null : securityData.TLSCACert;
    const tlsCertFile = tlsSkipClientVerify ? null : securityData.TLSCert;
    const tlsKeyFile = tlsSkipClientVerify ? null : securityData.TLSKey;

    await this.addRemoteEndpoint(name, creationType, url, publicUrl, groupId, tagIds, tsl, tlsSkipVerify, tlsSkipClientVerify, tlsCaFile, tlsCertFile, tlsKeyFile);
  }

  async addDockerLocalEndpoint(name, url, publicUrl, groupId, tagIds) {
    this.state.actionInProgress = true;
    try {
      await this.EndpointService.createLocalEndpoint(name, url, publicUrl, groupId, tagIds);
      this.Notifications.success('Environment connected', name);
      this.clearForm();
      this.onUpdate();
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to connect your environment');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  async addRemoteEndpoint(name, creationType, url, publicURL, groupId, tagIds, TLS, tlsSkipVerify, tlsSkipClientVerify, tlsCaFile, tlsCertFile, tlsKeyFile) {
    this.state.actionInProgress = true;
    try {
      await this.EndpointService.createRemoteEndpoint(
        name,
        creationType,
        url,
        publicURL,
        groupId,
        tagIds,
        TLS,
        tlsSkipVerify,
        tlsSkipClientVerify,
        tlsCaFile,
        tlsCertFile,
        tlsKeyFile
      );
      this.Notifications.success('Environment connected', name);
      this.clearForm();
      this.onUpdate();

      if (creationType === PortainerEndpointCreationTypes.AgentEnvironment) {
        this.onAnalytics('docker-agent');
      }

      if (creationType === PortainerEndpointCreationTypes.LocalDockerEnvironment) {
        this.onAnalytics('docker-api');
      }
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to connect your environment');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  clearForm() {
    this.formValues = {
      name: '',
      url: '',
      publicURL: '',
      groupId: 1,
      tagIds: [],
      environmentUrl: '',
      dockerApiurl: '',
      socketPath: '',
      overrodeSocket: false,
      skipCertification: false,
      tls: false,
      securityFormData: new EndpointSecurityFormData(),
    };
  }

  $onInit() {
    return this.$async(async () => {
      const agentVersion = this.StateManager.getState().application.version;
      const agentShortVersion = getAgentShortVersion(agentVersion);

      this.command = {
        linuxCommand: `curl -L https://downloads.portainer.io/agent-stack-ce${agentShortVersion}.yml -o agent-stack.yml && docker stack deploy --compose-file=agent-stack.yml portainer-agent `,
        winCommand: `curl -L https://downloads.portainer.io/agent-stack-ce${agentShortVersion}-windows.yml -o agent-stack-windows.yml && docker stack deploy --compose-file=agent-stack-windows.yml portainer-agent `,
        linuxSocket: `-v "/var/run/docker.sock:/var/run/docker.sock" `,
        winSocket: `-v \.\pipe\docker_engine:\.\pipe\docker_engine `,
      };
    });
  }
}
