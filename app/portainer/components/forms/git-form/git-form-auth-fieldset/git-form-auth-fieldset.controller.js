class GitFormComposeAuthFieldsetController {
  /* @ngInject */
  constructor() {
    this.onChangeField = this.onChangeField.bind(this);
    this.onChangeAuth = this.onChangeField('RepositoryAuthentication');
    this.onChangeUsername = this.onChangeField('RepositoryUsername');
    this.onChangePassword = this.onChangeField('RepositoryPassword');
  }

  onChangeField(field) {
    return (value) => {
      this.onChange({
        ...this.model,
        [field]: value,
      });
    };
  }
}

export default GitFormComposeAuthFieldsetController;
