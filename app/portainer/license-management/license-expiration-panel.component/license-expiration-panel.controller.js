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

  buildMessage(days) {
    if (days <= 0) {
      return 'Your license has expired.';
    }
    return `Your license will expire in ${days === 1 ? '1 day' : `${days} days`}.`;
  }

  parseInfo(info) {
    const expiresAt = moment.unix(info.expiresAt);
    const duration = moment.duration(expiresAt.diff(moment()));
    this.remainingDays = Math.ceil(duration.asDays());
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
