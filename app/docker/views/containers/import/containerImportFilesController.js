import angular from "angular";

class ContainerImportFilesController {
  /* @ngInject */
  constructor($transition$, ContainerService, Notifications, HttpRequestHelper, $async) {
    this.$transition$ = $transition$;
    this.ContainerService = ContainerService;
    this.Notifications = Notifications;
    this.HttpRequestHelper = HttpRequestHelper;
    this.$async = $async;

    this.uploadFilesAsync = this.uploadFilesAsync.bind(this);
  }

  async $onInit() {
    this.state = {
      actionInProgress: false,
      nodeName: this.$transition$.params().nodeName
    };

    this.formValues = {
      UploadFile: null,
      Path: null
    };

    const containerId = this.$transition$.params().id;
    try {
      this.HttpRequestHelper.setPortainerAgentTargetHeader(this.state.nodeName);
      this.container = await this.ContainerService.container(containerId);
    } catch (err) {
      this.Notifications.error("Failure", err, "Unable retrieve container details");
    }
  }

  uploadFiles() {
    return this.$async(this.uploadFilesAsync);
  }

  async uploadFilesAsync() {
    this.state.actionInProgress = true;
    const containerId = this.container.Id;
    const file = this.formValues.UploadFile;
    const path = this.formValues.Path;
    try {
      await this.ContainerService.uploadFiles(containerId, file, path);
      this.Notifications.success("Files successfully uploaded");
    } catch (err) {
      this.Notifications.error("Failure", err, "Unable to upload files");
    } finally {
      this.state.actionInProgress = false;
    }
  }
}

export default ContainerImportFilesController;
angular
  .module("portainer.docker")
  .controller("ContainerImportFilesController", ContainerImportFilesController);
