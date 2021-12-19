class GitFormComposeAuthFieldsetController {
  /* @ngInject */
  constructor($scope) {
    Object.assign(this, { $scope });

    this.authValues = {
      username: '',
      password: '',
    };

    this.handleChange = this.handleChange.bind(this);
    this.onChangeField = this.onChangeField.bind(this);
    this.onChangeAuth = this.onChangeAuth.bind(this);
    this.onChangeUsername = this.onChangeField('RepositoryUsername');
    this.onChangePassword = this.onChangeField('RepositoryPassword');
  }

  handleChange(...args) {
    this.$scope.$evalAsync(() => {
      this.onChange(...args);
    });
  }

  onChangeField(field) {
    return (value) => {
      this.handleChange({
        ...this.model,
        [field]: value,
      });
    };
  }

  onChangeAuth(auth) {
    if (!auth) {
      this.authValues.username = this.model.RepositoryUsername;
      this.authValues.password = this.model.RepositoryPassword;
    }

    this.handleChange({
      ...this.model,
      RepositoryAuthentication: auth,
      RepositoryUsername: auth ? this.authValues.username : '',
      RepositoryPassword: auth ? this.authValues.password : '',
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
