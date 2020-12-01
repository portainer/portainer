import moment from 'moment';

export default class LicenseNodePanelController {
  /* @ngInject */
  constructor($async, $scope, LicenseService, Notifications) {
    this.$async = $async;
    this.LicenseService = LicenseService;
    this.Notifications = Notifications;

    this.remainingDays = null;
    this.info = null;
    this.loading = true;

    this.parseInfo = this.parseInfo.bind(this);
  }

  expiringText(days) {
    if (days < 0) {
      return 'has expired.';
    } else if (days === 0) {
      return 'expires TODAY.';
    }
    return `will expire in ${days === 1 ? '1 day' : `${days} days`}.`;
  }

  buildMessage(days) {
    return 'One or more of your licenses ' + this.expiringText(days);
  }

  parseInfo(info) {
    const expiresAt = moment.unix(info.expiresAt);
    this.remainingDays = expiresAt.diff(moment().startOf('day'), 'days');
    this.expirationMessage = this.buildMessage(this.remainingDays);
  }

  $onInit() {
    return this.$async(async () => {
      try {
        const licenseInfo = await this.LicenseService.info();
        this.LicenseService.subscribe(this.parseInfo);
        this.parseInfo(licenseInfo);
        this.loading = false;
      } catch (err) {
        this.Notifications.error('Failure', err, 'Failed to get license info');
      }
    });
  }
}
