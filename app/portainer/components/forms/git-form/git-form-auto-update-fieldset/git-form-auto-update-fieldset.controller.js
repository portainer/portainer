import { HIDE_INTERNAL_AUTH } from '@/portainer/feature-flags/feature-ids';

class GitFormAutoUpdateFieldsetController {
  /* @ngInject */
  constructor(clipboard) {
    this.onChangeAutoUpdate = this.onChangeField('RepositoryAutomaticUpdates');
    this.onChangeMechanism = this.onChangeField('RepositoryMechanism');
    this.onChangeInterval = this.onChangeField('RepositoryFetchInterval');
    this.clipboard = clipboard;

    this.limitedFeature = HIDE_INTERNAL_AUTH;
  }

  copyWebhook() {
    this.clipboard.copyText(this.model.RepositoryWebhookURL);
    $('#copyNotification').show();
    $('#copyNotification').fadeOut(2000);
  }

  onChangeField(field) {
    return (value) => {
      this.onChange({
        ...this.model,
        [field]: value,
      });
    };
  }
}

export default GitFormAutoUpdateFieldsetController;
