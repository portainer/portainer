import { PortainerEndpointCreationTypes } from 'Portainer/models/endpoint/models';
import { getAgentShortVersion } from 'Portainer/views/endpoints/helpers';
import { buildOption } from '@/portainer/components/BoxSelector';

export default class WizardKubernetesController {
  /* @ngInject */
  constructor($async, EndpointService, StateManager, Notifications, $filter, clipboard, NameValidator) {
    this.$async = $async;
    this.EndpointService = EndpointService;
    this.StateManager = StateManager;
    this.Notifications = Notifications;
    this.$filter = $filter;
    this.clipboard = clipboard;
    this.NameValidator = NameValidator;

    this.state = {
      endpointType: 'agent',
      actionInProgress: false,
      formValues: {
        name: '',
        url: '',
      },
      availableOptions: [buildOption('Agent', 'fa fa-bolt', 'Agent', '', 'agent')],
    };

    this.onChangeEndpointType = this.onChangeEndpointType.bind(this);
  }

  onChangeEndpointType(endpointType) {
    this.state.endpointType = endpointType;
  }

  addKubernetesAgent() {
    return this.$async(async () => {
      const name = this.state.formValues.name;
      const groupId = 1;
      const tagIds = [];
      const url = this.$filter('stripprotocol')(this.state.formValues.url);
      const publicUrl = url.split(':')[0];
      const creationType = PortainerEndpointCreationTypes.AgentEnvironment;
      const tls = true;
      const tlsSkipVerify = true;
      const tlsSkipClientVerify = true;
      const tlsCaFile = null;
      const tlsCertFile = null;
      const tlsKeyFile = null;

      // Check name is duplicated or not
      let nameUsed = await this.NameValidator.validateEnvironmentName(name);
      if (nameUsed) {
        this.Notifications.error('Failure', null, 'This name is been used, please try another one');
        return;
      }
      await this.addRemoteEndpoint(name, creationType, url, publicUrl, groupId, tagIds, tls, tlsSkipVerify, tlsSkipClientVerify, tlsCaFile, tlsCertFile, tlsKeyFile);
    });
  }

  async addRemoteEndpoint(name, creationType, url, publicURL, groupId, tagIds, tls, tlsSkipVerify, tlsSkipClientVerify, tlsCaFile, tlsCertFile, tlsKeyFile) {
    this.state.actionInProgress = true;
    try {
      await this.EndpointService.createRemoteEndpoint(
        name,
        creationType,
        url,
        publicURL,
        groupId,
        tagIds,
        tls,
        tlsSkipVerify,
        tlsSkipClientVerify,
        tlsCaFile,
        tlsCertFile,
        tlsKeyFile
      );
      this.Notifications.success('Environment connected', name);
      this.clearForm();
      this.onUpdate();
      this.onAnalytics('kubernetes-agent');
    } catch (err) {
      this.Notifications.error('Failure', err, 'Unable to conect your environment');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  copyLoadBalancer() {
    this.clipboard.copyText(this.command.loadBalancer);
    $('#loadBalancerNotification').show().fadeOut(2500);
  }

  copyNodePort() {
    this.clipboard.copyText(this.command.nodePort);
    $('#nodePortNotification').show().fadeOut(2500);
  }

  clearForm() {
    this.state.formValues = {
      name: '',
      url: '',
    };
  }

  $onInit() {
    return this.$async(async () => {
      const agentVersion = this.StateManager.getState().application.version;
      const agentShortVersion = getAgentShortVersion(agentVersion);

      this.command = {
        loadBalancer: `curl -L https://downloads.portainer.io/ce${agentShortVersion}/portainer-agent-k8s-lb.yaml -o portainer-agent-k8s.yaml; kubectl apply -f portainer-agent-k8s.yaml `,
        nodePort: `curl -L https://downloads.portainer.io/ce${agentShortVersion}/portainer-agent-k8s-nodeport.yaml -o portainer-agent-k8s.yaml; kubectl apply -f portainer-agent-k8s.yaml `,
      };
    });
  }
}
