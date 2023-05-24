import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { options } from '@/react/portainer/settings/SettingsView/backup-options';

/* @ngInject */
export default function BackupSettingsPanelController($scope, $async, BackupService, Notifications, FileSaver) {
  this.$onInit = $onInit.bind(this);
  this.onBackupOptionsChange = onBackupOptionsChange.bind(this);
  this.onToggleAutoBackups = onToggleAutoBackups.bind(this);
  this.getS3SettingsPayload = getS3SettingsPayload.bind(this);

  this.downloadBackup = downloadBackup.bind(this);
  this.saveS3BackupSettings = saveS3BackupSettings.bind(this);
  this.exportBackup = exportBackup.bind(this);

  this.backupOptions = options;
  this.s3BackupFeatureId = FeatureId.S3_BACKUP_SETTING;
  this.BACKUP_FORM_TYPES = { S3: 's3', FILE: 'file' };

  this.formValues = {
    passwordProtect: false,
    password: '',
    scheduleAutomaticBackups: true,
    cronRule: '',
    accessKeyId: '',
    secretAccessKey: '',
    region: '',
    bucketName: '',
    s3CompatibleHost: '',
    backupFormType: this.BACKUP_FORM_TYPES.FILE,
  };

  this.state = {
    backupInProgress: false,
    featureLimited: false,
  };

  function onToggleAutoBackups(checked) {
    $scope.$evalAsync(() => {
      this.formValues.scheduleAutomaticBackups = checked;
    });
  }

  function onBackupOptionsChange(type, limited) {
    this.formValues.backupFormType = type;
    this.state.featureLimited = limited;
  }

  function downloadBackup() {
    const payload = {};
    if (this.formValues.passwordProtect) {
      payload.password = this.formValues.password;
    }

    this.state.backupInProgress = true;

    BackupService.downloadBackup(payload)
      .then((data) => {
        const downloadData = new Blob([data.file], { type: 'application/gzip' });
        FileSaver.saveAs(downloadData, data.name);
        Notifications.success('Success', 'Backup successfully downloaded');
      })
      .catch((err) => {
        Notifications.error('Failure', err, 'Unable to download backup');
      })
      .finally(() => {
        this.state.backupInProgress = false;
      });
  }

  function saveS3BackupSettings() {
    const payload = this.getS3SettingsPayload();
    BackupService.saveS3Settings(payload)
      .then(() => {
        Notifications.success('Success', 'S3 Backup settings successfully saved');
      })
      .catch((err) => {
        Notifications.error('Failure', err, 'Unable to save S3 backup settings');
      })
      .finally(() => {
        this.state.backupInProgress = false;
      });
  }

  function exportBackup() {
    const payload = this.getS3SettingsPayload();
    BackupService.exportBackup(payload)
      .then(() => {
        Notifications.success('Success', 'Exported backup to S3 successfully');
      })
      .catch((err) => {
        Notifications.error('Failure', err, 'Unable to export backup to S3');
      })
      .finally(() => {
        this.state.backupInProgress = false;
      });
  }

  function getS3SettingsPayload() {
    return {
      Password: this.formValues.passwordProtectS3 ? this.formValues.passwordS3 : '',
      CronRule: this.formValues.scheduleAutomaticBackups ? this.formValues.cronRule : '',
      AccessKeyID: this.formValues.accessKeyId,
      SecretAccessKey: this.formValues.secretAccessKey,
      Region: this.formValues.region,
      BucketName: this.formValues.bucketName,
      S3CompatibleHost: this.formValues.s3CompatibleHost,
    };
  }

  function $onInit() {
    return $async(async () => {
      try {
        const data = await BackupService.getS3Settings();

        this.formValues.passwordS3 = data.Password;
        this.formValues.cronRule = data.CronRule;
        this.formValues.accessKeyId = data.AccessKeyID;
        this.formValues.secretAccessKey = data.SecretAccessKey;
        this.formValues.region = data.Region;
        this.formValues.bucketName = data.BucketName;
        this.formValues.s3CompatibleHost = data.S3CompatibleHost;

        this.formValues.scheduleAutomaticBackups = this.formValues.cronRule ? true : false;
        this.formValues.passwordProtectS3 = this.formValues.passwordS3 ? true : false;
      } catch (err) {
        Notifications.error('Failure', err, 'Unable to retrieve S3 backup settings');
      }
    });
  }
}
