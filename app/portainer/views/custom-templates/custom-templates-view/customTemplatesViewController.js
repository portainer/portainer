import _ from 'lodash-es';
import { AccessControlFormData } from 'Portainer/components/accessControlForm/porAccessControlFormModel';

class CustomTemplatesViewController {
  /* @ngInject */
  constructor(
    $anchorScroll,
    $async,
    $rootScope,
    $state,
    Authentication,
    CustomTemplateService,
    EndpointProvider,
    FormValidator,
    ModalService,
    NetworkService,
    Notifications,
    ResourceControlService,
    StackService,
    StateManager
  ) {
    this.$anchorScroll = $anchorScroll;
    this.$async = $async;
    this.$rootScope = $rootScope;
    this.$state = $state;
    this.Authentication = Authentication;
    this.CustomTemplateService = CustomTemplateService;
    this.EndpointProvider = EndpointProvider;
    this.FormValidator = FormValidator;
    this.ModalService = ModalService;
    this.NetworkService = NetworkService;
    this.Notifications = Notifications;
    this.ResourceControlService = ResourceControlService;
    this.StateManager = StateManager;
    this.StackService = StackService;

    this.state = {
      selectedTemplate: null,
      showAdvancedOptions: false,
      formValidationError: '',
      actionInProgress: false,
      isEditorVisible: false,
    };

    this.formValues = {
      network: '',
      name: '',
      fileContent: '',
      AccessControlData: new AccessControlFormData(),
    };

    this.getTemplates = this.getTemplates.bind(this);
    this.getTemplatesAsync = this.getTemplatesAsync.bind(this);
    this.removeTemplates = this.removeTemplates.bind(this);
    this.removeTemplatesAsync = this.removeTemplatesAsync.bind(this);
    this.validateForm = this.validateForm.bind(this);
    this.createStack = this.createStack.bind(this);
    this.createStackAsync = this.createStackAsync.bind(this);
    this.selectTemplate = this.selectTemplate.bind(this);
    this.selectTemplateAsync = this.selectTemplateAsync.bind(this);
    this.unselectTemplate = this.unselectTemplate.bind(this);
    this.getNetworks = this.getNetworks.bind(this);
    this.getNetworksAsync = this.getNetworksAsync.bind(this);
    this.confirmDelete = this.confirmDelete.bind(this);
    this.confirmDeleteAsync = this.confirmDeleteAsync.bind(this);
    this.editorUpdate = this.editorUpdate.bind(this);
  }

  getTemplates() {
    return this.$async(this.getTemplatesAsync);
  }
  async getTemplatesAsync() {
    try {
      this.templates = await this.CustomTemplateService.customTemplates();
    } catch (err) {
      this.Notifications.error('Failed loading templates', err, 'Unable to load custom templates');
    }
  }

  removeTemplates(templates) {
    return this.$async(this.removeTemplatesAsync, templates);
  }
  async removeTemplatesAsync(templates) {
    for (let template of templates) {
      try {
        await this.CustomTemplateService.remove(template.id);
        this.Notifications.success('Removed template successfully');
        _.remove(this.templates, template);
      } catch (err) {
        this.Notifications.error('Failed removing template', err, 'Unable to remove custom template');
      }
    }
  }

  validateForm(accessControlData, isAdmin) {
    this.state.formValidationError = '';
    const error = this.FormValidator.validateAccessControl(accessControlData, isAdmin);

    if (error) {
      this.state.formValidationError = error;
      return false;
    }
    return true;
  }

  createStack() {
    return this.$async(this.createStackAsync);
  }
  async createStackAsync() {
    const userDetails = this.Authentication.getUserDetails();
    const userId = userDetails.ID;
    const accessControlData = this.formValues.AccessControlData;

    if (!this.validateForm(accessControlData, this.isAdmin)) {
      return;
    }
    const stackName = this.formValues.name;

    const endpointId = this.EndpointProvider.endpointID();

    try {
      const file = this.formValues.fileContent;
      const { ResourceControl: resourceControl } = await this.StackService.createComposeStackFromFileContent(stackName, file, [], endpointId);
      await this.ResourceControlService.applyResourceControl(userId, accessControlData, resourceControl);
      this.Notifications.success('Stack successfully deployed');
      this.$state.go('portainer.stacks');
    } catch (err) {
      this.Notifications.error('Deployment error', err, 'Failed to deploy stack');
    } finally {
      this.state.actionInProgress = false;
    }
  }

  unselectTemplate(template) {
    template.Selected = false;
    this.state.selectedTemplate = null;

    this.formValues = {
      network: '',
      name: '',
      fileContent: '',
      AccessControlData: new AccessControlFormData(),
    };
  }

  selectTemplate(template) {
    return this.$async(this.selectTemplateAsync, template);
  }
  async selectTemplateAsync(template) {
    if (this.state.selectedTemplate) {
      this.unselectTemplate(this.state.selectedTemplate);
    }

    template.Selected = true;

    this.formValues.network = _.find(this.availableNetworks, function (o) {
      return o.Name === 'bridge';
    });

    this.formValues.name = template.Name ? template.Name : '';
    this.state.selectedTemplate = template;
    this.$anchorScroll('view-top');

    const file = await this.CustomTemplateService.customTemplateFile(template.Id);
    this.formValues.fileContent = file;
  }

  getNetworks() {
    return this.$async(this.getNetworksAsync);
  }
  async getNetworksAsync() {
    const applicationState = this.StateManager.getState();

    const endpointMode = applicationState.endpoint.mode;
    const apiVersion = applicationState.endpoint.apiVersion;
    try {
      const networks = await this.NetworkService.networks(
        endpointMode.provider === 'DOCKER_STANDALONE' || endpointMode.provider === 'DOCKER_SWARM_MODE',
        false,
        endpointMode.provider === 'DOCKER_SWARM_MODE' && apiVersion >= 1.25
      );
      this.availableNetworks = networks;
    } catch (err) {
      this.Notifications.error('Failure', err, 'Failed to load networks.');
    }
  }

  confirmDelete(templateId) {
    return this.$async(this.confirmDeleteAsync, templateId);
  }
  async confirmDeleteAsync(templateId) {
    const confirmed = await this.ModalService.confirmDeletionAsync('Are you sure that you want to delete this template?');
    if (!confirmed) {
      return;
    }

    try {
      await this.CustomTemplateService.remove(templateId);
      _.remove(this.templates, { Id: templateId });
    } catch (err) {
      this.Notifications.error('Failure', err, 'Failed to delete template');
    }
  }

  editorUpdate(cm) {
    this.formValues.fileContent = cm.getValue();
  }

  $onInit() {
    this.getTemplates();
    this.getNetworks();

    this.isAdmin = this.Authentication.isAdmin();
    const user = this.Authentication.getUserDetails();
    this.currentUserId = user.ID;
  }
}

export default CustomTemplatesViewController;
