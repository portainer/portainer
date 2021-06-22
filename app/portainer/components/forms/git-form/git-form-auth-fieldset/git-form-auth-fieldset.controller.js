class GitFormComposeAuthFieldsetController {
  /* @ngInject */
  constructor() {
    this.authValues = {
      username: '',
      password: '',
    };

    this.onChangeField = this.onChangeField.bind(this);
    this.onChangeAuth = this.onChangeAuth.bind(this);
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

  onChangeAuth(auth) {
    if (!auth) {
      this.authValues.username = this.model.RepositoryUsername;
      this.authValues.password = this.model.RepositoryPassword;
      this.onChange({
        ...this.model,
        RepositoryAuthentication: true,
        RepositoryUsername: '',
        RepositoryPassword: '',
      });

      return;
    }

    this.onChange({
      ...this.model,
      RepositoryAuthentication: false,
      RepositoryUsername: this.authValues.username,
      RepositoryPassword: this.authValues.password,
    });
  }

  $onInit() {
    if (this.model.RepositoryAuthentication) {
      this.authValues.username = this.model.RepositoryUsername;
      this.authValues.password = this.model.RepositoryPassword;
    }
  }
}

export default GitFormComposeAuthFieldsetController;
