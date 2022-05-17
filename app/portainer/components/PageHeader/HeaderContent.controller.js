export default class HeaderContentController {
  /* @ngInject */
  constructor(Authentication) {
    this.Authentication = Authentication;
    this.display = !window.ddExtension;
    this.username = null;
  }

  $onInit() {
    const userDetails = this.Authentication.getUserDetails();
    if (userDetails) {
      this.username = userDetails.username;
    }
  }
}
