import _ from 'lodash-es';
import i18n from '@/i18n';

export default class RolesController {
  /* @ngInject */
  constructor(Notifications, RoleService) {
    this.Notifications = Notifications;
    this.RoleService = RoleService;
    this.t = i18n.t.bind(i18n);

    // Page header translations
    this.pageTitle = this.t('roles.title');
    this.pageBreadcrumbs = [{ label: this.t('roles.breadcrumbs') }];
  }

  async $onInit() {
    this.roles = [];

    try {
      this.roles = await this.RoleService.roles();
      this.roles = _.orderBy(this.roles, 'Priority', 'asc');
    } catch (err) {
      this.Notifications.error('Failure', err, this.t('roles.unable_to_retrieve'));
    }
  }
}
