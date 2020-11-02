export default class HeaderTitle {
  /* @ngInject */
  constructor(Authentication) {
    this.Authentication = Authentication;

    this.username = null;
  }

  $onInit() {
    const userDetails = this.Authentication.getUserDetails();
    if (userDetails) {
      this.username = userDetails.username;
    }
  }
}
