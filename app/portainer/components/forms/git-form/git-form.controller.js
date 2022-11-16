export default class GitFormController {
  /* @ngInject */
  constructor(StateManager) {
    this.StateManager = StateManager;

    this.onChangeField = this.onChangeField.bind(this);
    this.onChangeURL = this.onChangeField('RepositoryURL');
    this.onChangeRefName = this.onChangeField('RepositoryReferenceName');
    this.onChangeComposePath = this.onChangeField('ComposeFilePathInRepository');
  }

  onChangeField(field) {
    return (value) => {
      this.onChange({
        ...this.model,
        [field]: value,
      });
    };
  }

  $onInit() {
    this.deployMethod = this.deployMethod || 'compose';
    this.isDockerStandalone = !this.hideRebuildInfo && this.StateManager.getState().endpoint.mode.provider === 'DOCKER_STANDALONE';
  }
}
