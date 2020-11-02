export default class LicenseNodePanelController {
  /* @ngInject */
  constructor($async, LicenseService, StatusService, Notifications) {
    this.$async = $async;
    this.LicenseService = LicenseService;
    this.Notifications = Notifications;
    this.StatusService = StatusService;

    this.numberOfNodesExceeded = false;
  }

  $onInit() {
    return this.$async(async () => {
      let nodesCount, licenseInfo;
      try {
        nodesCount = await this.StatusService.nodesCount();
      } catch (err) {
        this.Notifications.error('Failure', err, 'Failed to get nodes count');
      }

      try {
        licenseInfo = await this.LicenseService.info();
      } catch (err) {
        this.Notifications.error('Failure', err, 'Failed to get license info');
      }

      if (!licenseInfo || licenseInfo.type === 1) {
        return;
      }

      this.numberOfNodesExceeded = nodesCount > licenseInfo.nodes;
    });
  }
}
