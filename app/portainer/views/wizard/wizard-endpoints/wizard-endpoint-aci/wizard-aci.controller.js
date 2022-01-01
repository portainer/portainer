import { buildOption } from '@/portainer/components/BoxSelector';

export default class WizardAciController {
  /* @ngInject */
  constructor($async, EndpointService, Notifications, NameValidator) {
    this.$async = $async;
    this.EndpointService = EndpointService;
    this.Notifications = Notifications;
    this.NameValidator = NameValidator;

    this.state = {
      actionInProgress: false,
      endpointType: 'api',
      availableOptions: [buildOption('API', 'fa fa-bolt', 'API', '', 'api')],
    };
    this.formValues = {
      name: '',
      azureApplicationId: '',
      azureTenantId: '',
      azureAuthenticationKey: '',
    };

    this.onChangeEndpointType = this.onChangeEndpointType.bind(this);
  }

  onChangeEndpointType(endpointType) {
    this.state.endpointType = endpointType;
  }

  addAciEndpoint() {
    return this.$async(async () => {
      const { name, azureApplicationId, azureTenantId, azureAuthenticationKey } = this.formValues;
      const groupId = 1;
      const tagIds = [];

      try {
        this.state.actionInProgress = true;
        // Check name is duplicated or not
        let nameUsed = await this.NameValidator.validateEnvironmentName(name);
        if (nameUsed) {
          this.Notifications.error('Failure', null, 'This name is been used, please try another one');
          return;
        }
        await this.EndpointService.createAzureEndpoint(name, azureApplicationId, azureTenantId, azureAuthenticationKey, groupId, tagIds);
        this.Notifications.success('Environment connected', name);
        this.clearForm();
        this.onUpdate();
        this.onAnalytics('aci-api');
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to connect your environment');
      } finally {
        this.state.actionInProgress = false;
      }
    });
  }

  clearForm() {
    this.formValues = {
      name: '',
      azureApplicationId: '',
      azureTenantId: '',
      azureAuthenticationKey: '',
    };
  }
}
