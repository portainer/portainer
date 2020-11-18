import moment from 'moment';

export default class LicensesViewController {
  /* @ngInject */
  constructor($async, $state, LicenseService, ModalService, Notifications, clipboard) {
    this.$async = $async;
    this.$state = $state;
    this.LicenseService = LicenseService;
    this.ModalService = ModalService;
    this.Notifications = Notifications;
    this.clipboard = clipboard;

    this.info = null;
    this.licenses = null;

    this.removeAction = this.removeAction.bind(this);
    this.copyLicenseKey = this.copyLicenseKey.bind(this);
  }

  copyLicenseKey(item) {
    this.clipboard.copyText(item.licenseKey);
  }

  removeAction(licenses) {
    return this.$async(async () => {
      try {
        if (this.licenses.length === licenses.length) {
          this.Notifications.warning('At least one license is required');
          return;
        }

        if (!(await this.ModalService.confirmDeletionAsync('Are you sure you want to remove these licenses?'))) {
          return;
        }

        const response = await this.LicenseService.remove(licenses.map((license) => license.licenseKey));
        if (response.failedKeys && Object.keys(response.failedKeys).length) {
          throw new Error('Failed removing licenses');
        }
      } catch (err) {
        this.Notifications.error('Failure', err, 'Failed removing licenses');
      }
      this.$state.reload();
    });
  }

  async $onInit() {
    return this.$async(async () => {
      try {
        const licenses = await this.LicenseService.licenses();
        this.licenses = licenses.map((license) => {
          const createdAt = moment.unix(license.created);
          const expiresAt = moment(createdAt).add(license.expiresAfter, 'days');
          const valid = !license.revoked && moment().isBefore(expiresAt);

          return {
            ...license,
            expiresAt: expiresAt.format('YYYY-MM-DD'),
            valid,
          };
        });
      } catch (err) {
        this.Notifications.error('Failure', err, 'Failed loading licenses');
      }

      try {
        this.info = await this.LicenseService.info();
        this.LicenseService.subscribe((info) => {
          this.info = info;
        });
      } catch (err) {
        this.Notifications.error('Failure', err, 'Failed loading license info');
      }
    });
  }
}
