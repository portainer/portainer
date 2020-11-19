import moment from 'moment';

export default class LicenseInfoController {
  /* @ngInject */
  constructor($async, StatusService, Notifications) {
    this.$async = $async;
    this.StatusService = StatusService;
    this.Notifications = Notifications;
  }

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

  overUsage() {
    return this.usedNodes > this.info.nodes;
  }

  $onInit() {
    return this.$async(async () => {
      try {
        this.usedNodes = await this.StatusService.nodesCount();
      } catch (err) {
        this.Notifications.error('Failure', err, 'Failed to get nodes count');
      }
    });
  }
}
