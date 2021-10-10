const TEST_STATUS = {
  LOADING: 'LOADING',
  SUCCESS: 'SUCCESS',
  FAILURE: 'FAILURE',
};

export default class LdapSettingsTestLogin {
  /* @ngInject */
  constructor($async, LDAPService, Notifications) {
    Object.assign(this, { $async, LDAPService, Notifications });

    this.TEST_STATUS = TEST_STATUS;

    this.state = {
      testStatus: '',
    };
  }

  async testLogin(username, password) {
    return this.$async(async () => {
      this.state.testStatus = TEST_STATUS.LOADING;
      try {
        const response = await this.LDAPService.testLogin(this.settings, username, password);
        this.state.testStatus = response.valid ? TEST_STATUS.SUCCESS : TEST_STATUS.FAILURE;
      } catch (err) {
        this.Notifications.error('Failure', err, 'Unable to test login');
        this.state.testStatus = TEST_STATUS.FAILURE;
      }
    });
  }
}
