import _ from "lodash-es";
import { AccessControlFormData } from "Portainer/components/accessControlForm/porAccessControlFormModel";

import angular from "angular";

class CreateConfigController {
  /* @ngInject */
  constructor($async, $state, $transition$, Notifications, ConfigService, Authentication, FormValidator, ResourceControlService) {
    this.$state = $state;
    this.$transition$ = $transition$;
    this.Notifications = Notifications;
    this.ConfigService = ConfigService;
    this.Authentication = Authentication;
    this.FormValidator = FormValidator;
    this.ResourceControlService = ResourceControlService;
    this.$async = $async;

    this.formValues = {
      Name: "",
      Labels: [],
      AccessControlData: new AccessControlFormData(),
      ConfigContent: ""
    };

    this.state = {
      formValidationError: ""
    };

    this.editorUpdate = this.editorUpdate.bind(this);
    this.createAsync = this.createAsync.bind(this);
  }

  async $onInit() {
    if (!this.$transition$.params().id) {
      this.formValues.displayCodeEditor = true;
      return;
    }

    try {
      let data = await this.ConfigService.config(this.$transition$.params().id);
      this.formValues.Name = data.Name + "_copy";
      this.formValues.Data = data.Data;
      let labels = _.keys(data.Labels);
      for (let i = 0; i < labels.length; i++) {
        let labelName = labels[i];
        let labelValue = data.Labels[labelName];
        this.formValues.Labels.push({ name: labelName, value: labelValue });
      }
      this.formValues.displayCodeEditor = true;
    } catch (err) {
      this.formValues.displayCodeEditor = true;
      this.Notifications.error("Failure", err, "Unable to clone config");
    }
  }

  addLabel() {
    this.formValues.Labels.push({ name: "", value: "" });
  }

  removeLabel(index) {
    this.formValues.Labels.splice(index, 1);
  }

  prepareLabelsConfig(config) {
    let labels = {};
    this.formValues.Labels.forEach(function(label) {
      if (label.name && label.value) {
        labels[label.name] = label.value;
      }
    });
    config.Labels = labels;
  }

  prepareConfigData(config) {
    let configData = this.formValues.ConfigContent;
    config.Data = btoa(unescape(encodeURIComponent(configData)));
  }

  prepareConfiguration() {
    let config = {};
    config.Name = this.formValues.Name;
    this.prepareConfigData(config);
    this.prepareLabelsConfig(config);
    return config;
  }

  validateForm(accessControlData, isAdmin) {
    this.state.formValidationError = "";
    let error = "";
    error = this.FormValidator.validateAccessControl(
      accessControlData,
      isAdmin
    );

    if (error) {
      this.state.formValidationError = error;
      return false;
    }
    return true;
  }

  create() {
    return this.$async(this.createAsync);
  }

  async createAsync() {
    let accessControlData = this.formValues.AccessControlData;
    let userDetails = this.Authentication.getUserDetails();
    let isAdmin = this.Authentication.isAdmin();

    if (this.formValues.ConfigContent === "") {
      this.state.formValidationError = "Config content must not be empty";
      return;
    }

    if (!this.validateForm(accessControlData, isAdmin)) {
      return;
    }

    let config = this.prepareConfiguration();

    try {
      let data = await this.ConfigService.create(config);
      let configIdentifier = data.ID;
      let userId = userDetails.ID;
      await this.ResourceControlService.applyResourceControl(
        "config",
        configIdentifier,
        userId,
        accessControlData,
        []
      );
      this.Notifications.success("Config successfully created");
      this.$state.go("docker.configs", {}, { reload: true });
    } catch (err) {
      this.Notifications.error("Failure", err, "Unable to create config");
    }
  }

  editorUpdate(cm) {
    this.formValues.ConfigContent = cm.getValue();
  }
}

export default CreateConfigController;
angular
  .module("portainer.docker")
  .controller("CreateConfigController", CreateConfigController);
