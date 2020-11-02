import moment from 'moment';

export default class LicenseInfoController {
  /* @ngInject */
  // constructor() {}

  productEdition() {
    switch (this.info.productEdition) {
      case 1:
        return 'Business Edition';
      case 2:
        return 'Enterprise Edition';
      default:
        return '';
    }
  }

  expiresAt() {
    return moment.unix(this.info.expiresAt).format('YYYY-MM-DD');
  }
}
